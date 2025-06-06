const mqtt = require("mqtt");
const db = require("./db");
const { procesarSensor, cambiarCiclo, cambiarMuda, obtenerEstado } = require("./registroCritico");
const { procesarAlerta } = require("./Controllers/alertasNotificaciones");
const Limites  = require("./Const/Limites");

const mqttClient = mqtt.connect("mqtts://d0e185c9110d4506b80ae6e164aaf93e.s1.eu.hivemq.cloud:8883", {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
});

let estadoUV = false;
let estadoMuda = {};
let cicloActual = {};

// ✅ SISTEMA DE USUARIOS ACTIVOS
let usuariosActivos = new Set(); // Set de IDs de usuarios conectados
let ultimaActividad = new Map(); // Map para tracking de última actividad
let ioReference = null; // Referencia al objeto io

// ✅ CONFIGURACIÓN DE TIMEOUTS
const CONFIG_USUARIOS = {
  TIMEOUT_INACTIVIDAD: 600000, 
  INTERVALO_LIMPIEZA: 60000,  
  TIEMPO_GRACIA: 30000        
};

// ✅ FUNCIÓN PARA EXTRAER ID_USUARIO DEL TÓPICO
const extraerIDUsuario = (topic) => {
  const parts = topic.split('/');
  const userPart = parts[2];

  if (!userPart) return null;

  if (userPart.startsWith('User')) {
    const idStr = userPart.replace('User', '');
    const id = parseInt(idStr);
    return isNaN(id) ? null : id;
  }

  const id = parseInt(userPart);
  return isNaN(id) ? null : id;
};


// ✅ FUNCIÓN PARA VALIDAR SI UN USUARIO ESTÁ ACTIVO
const esUsuarioActivo = (ID_usuario) => {
  if (!ID_usuario) return false;
  
  const activo = usuariosActivos.has(ID_usuario);
  const ultimaAct = ultimaActividad.get(ID_usuario);
  const ahora = Date.now();
  
  // Verificar si el usuario está dentro del tiempo de gracia
  if (activo && ultimaAct && (ahora - ultimaAct) < CONFIG_USUARIOS.TIMEOUT_INACTIVIDAD) {
    return true;
  }
  
  if (activo && (!ultimaAct || (ahora - ultimaAct) >= CONFIG_USUARIOS.TIMEOUT_INACTIVIDAD)) {
    console.log(`⚠️ Usuario ${ID_usuario} marcado como inactivo por timeout`);
    usuariosActivos.delete(ID_usuario);
    ultimaActividad.delete(ID_usuario);
    return false;
  }
  
  return false;
};

// ✅ FUNCIÓN PARA REGISTRAR ACTIVIDAD DE USUARIO
const registrarActividadUsuario = (ID_usuario, accion = 'data') => {
  if (!ID_usuario) return false;
  
  const ahora = Date.now();
  const eraActivo = usuariosActivos.has(ID_usuario);
  
  usuariosActivos.add(ID_usuario);
  ultimaActividad.set(ID_usuario, ahora);
  
  if (!eraActivo) {
    
    // Notificar cambio de estado si hay referencia a io
    if (ioReference) {
      ioReference.emit('user-status-change', {
        ID_usuario,
        activo: true,
        accion,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return true;
};

// ✅ FUNCIÓN PARA DESACTIVAR USUARIO
const desactivarUsuario = (ID_usuario, razon = 'manual') => {
  if (!ID_usuario) return false;
  
  const eraActivo = usuariosActivos.has(ID_usuario);
  
  usuariosActivos.delete(ID_usuario);
  ultimaActividad.delete(ID_usuario);
  
  if (eraActivo) {
    console.log(`🔴 Usuario ${ID_usuario} desactivado (${razon})`);
    
    // Notificar cambio de estado
    if (ioReference) {
      ioReference.emit('user-status-change', {
        ID_usuario,
        activo: false,
        razon,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return true;
};

// ✅ FUNCIÓN PARA OBTENER ESTADÍSTICAS DE USUARIOS
const obtenerEstadisticasUsuarios = () => {
  return {
    usuariosActivos: Array.from(usuariosActivos),
    totalUsuarios: usuariosActivos.size,
    ultimasActividades: Object.fromEntries(ultimaActividad),
    timestamp: new Date().toISOString()
  };
};

// ✅ LIMPIEZA PERIÓDICA DE USUARIOS INACTIVOS
const limpiarUsuariosInactivos = () => {
  const ahora = Date.now();
  const usuariosAEliminar = [];
  
  ultimaActividad.forEach((tiempo, usuario) => {
    if (ahora - tiempo > CONFIG_USUARIOS.TIMEOUT_INACTIVIDAD) {
      usuariosAEliminar.push(usuario);
    }
  });
  
  usuariosAEliminar.forEach(usuario => {
    desactivarUsuario(usuario, 'timeout');
  });
  
  if (usuariosAEliminar.length > 0) {
  }
};

// ✅ MAPEO COMPLETO DE TÓPICOS
const MAPEO_TOPICOS = {
  // === SENSORES ===
  'zonafria': { tipo: 'temperatura', zona: 'fria', esSensor: true },
  'zonacaliente': { tipo: 'temperatura', zona: 'caliente', esSensor: true },
  'humedad': { tipo: 'humedad', zona: null, esSensor: true },
  'luminosidad': { tipo: 'luminosidad', zona: null, esSensor: true },
  'uvi': { tipo: 'luz_uv', zona: null, esSensor: true },
  
  // === ESTADOS ===
  'muda': { tipo: 'estado', subtipo: 'muda', esSensor: false },
  'ciclo': { tipo: 'estado', subtipo: 'ciclo', esSensor: false },
  
  // === ACTUADORES (no procesar como sensores) ===
  'placaP': { tipo: 'actuador', dispositivo: 'placa', esSensor: false },
  'humidificadorP': { tipo: 'actuador', dispositivo: 'humidificador', esSensor: false },
  'focoP': { tipo: 'actuador', dispositivo: 'foco', esSensor: false },
  'focouviP': { tipo: 'actuador', dispositivo: 'uv', esSensor: false },
  'modo': { tipo: 'actuador', dispositivo: 'modo', esSensor: false },
  
  // === ALIAS PARA RETROCOMPATIBILIDAD ===
  'foco': { tipo: 'actuador', dispositivo: 'foco', esSensor: false },
  'focouvi': { tipo: 'actuador', dispositivo: 'uv', esSensor: false },
  'humidificador': { tipo: 'actuador', dispositivo: 'humidificador', esSensor: false },
  'control': { tipo: 'actuador', dispositivo: 'general', esSensor: false }
};

// ✅ FUNCIÓN PARA INSERTAR EN BASE DE DATOS SOLO SI USUARIO ESTÁ ACTIVO
const insertarEnBaseDatos = async (tipo, medicion, ID_usuario, zona = null, ciclo = null, estadoMuda = null) => {
  try {
    // ✅ VERIFICAR SI EL USUARIO ESTÁ ACTIVO
    if (!esUsuarioActivo(ID_usuario)) {
      return false;
    }
    
    const timestamp = new Date();
    
    switch (tipo) {
      case 'temperatura':
        const queryTemp = `
          INSERT INTO temperatura (ID_usuario, Medicion, Marca_tiempo, Zona, Ciclo, es_critico) 
          VALUES (?, ?, ?, ?, ?, 0)
        `;
        await db.promise().query(queryTemp, [ID_usuario, medicion, timestamp, zona, ciclo]);
        break;
        
      case 'humedad':
        const queryHum = `
          INSERT INTO humedad (ID_usuario, Medicion, Marca_tiempo, estado_muda, Ciclo, es_critico) 
          VALUES (?, ?, ?, ?, ?, 0)
        `;
        await db.promise().query(queryHum, [ID_usuario, medicion, timestamp, estadoMuda ? 1 : 0, ciclo]);
        break;
        
      case 'luz_uv':
        const queryUV = `
          INSERT INTO luz_uv (ID_usuario, Medicion, Marca_tiempo, Ciclo, es_critico) 
          VALUES (?, ?, ?, ?, 0)
        `;
        await db.promise().query(queryUV, [ID_usuario, medicion, timestamp, ciclo]);
        
      default:
        return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error insertando ${tipo} para usuario ${ID_usuario}:`, error.message);
    return false;
  }
};

const shouldSave = (anterior, actual, limites, umbral = 0.5) => {
  if (actual > limites.alto || actual < limites.bajo) return true;
  if (anterior === null) return true;
  return Math.abs(actual - anterior) >= umbral;
};

mqttClient.on("connect", () => {
  console.log("✅ Conectado a HiveMQ Cloud");
  mqttClient.subscribe("terrario/+/+");
});

mqttClient.on("error", (error) => {
  console.error("❌ Error de conexión MQTT:", error);
});

mqttClient.on("close", () => {
  console.log("🔴 Conexión MQTT cerrada");
});

mqttClient.on("reconnect", () => {
});

// ✅ HANDLER PRINCIPAL DE MENSAJES CON VALIDACIÓN DE USUARIOS
const handleMessage = async (topic, message, io) => {
  try {
    const valorStr = message.toString().trim();
    const valor = parseFloat(valorStr);
    
    // ✅ PARSEAR TÓPICO
    const topicParts = topic.split("/");
    if (topicParts.length !== 3 || topicParts[0] !== "terrario") {
      return;
    }
    
    const [_, zona, usuarioMQTT] = topicParts;
    const ID_usuario = extraerIDUsuario(topic);
    const timestamp = new Date();
    
    // ✅ VERIFICAR QUE TENGAMOS UN ID DE USUARIO VÁLIDO
    if (!ID_usuario) {
      return;
    }
    
    console.log(`🔄 Procesando: ${zona} para usuario ${ID_usuario} (MQTT: ${usuarioMQTT})`);
    
    // ✅ VERIFICAR MAPEO
    const mapeo = MAPEO_TOPICOS[zona];
    if (!mapeo) {
      return;
    }
    
    // ✅ VERIFICAR SI EL USUARIO ESTÁ ACTIVO ANTES DE PROCESAR
    if (mapeo.esSensor && !esUsuarioActivo(ID_usuario)) {
      return;
    }
    
    // ✅ PROCESAR SEGÚN TIPO
    if (mapeo.tipo === 'estado') {
      await procesarEstado(mapeo.subtipo, valorStr, ID_usuario, io, timestamp);
    } else if (mapeo.tipo === 'actuador') {
      await procesarActuador(mapeo.dispositivo, valorStr, ID_usuario, io, timestamp);
    } else if (mapeo.esSensor) {
      await procesarSensorDatos(mapeo, valor, valorStr, ID_usuario, zona, io, timestamp);
    }
    
  } catch (error) {
    console.error("❌ Error en handleMessage:", error);
  }
};

// ✅ FUNCIÓN PARA PROCESAR ESTADOS (siempre se procesan)
const procesarEstado = async (subtipo, valorStr, ID_usuario, io, timestamp) => {
  switch (subtipo) {
    case 'muda':
      const enMuda = valorStr === "1" || valorStr.toLowerCase() === "true";
      estadoMuda[ID_usuario] = enMuda;
      cambiarMuda(enMuda);
      console.log(`🦎 Estado de muda cambiado a: ${enMuda}`);
      
      io.emit("sensor-data", { 
        topic: `terrario/muda/User${ID_usuario}`, 
        zona: "muda", 
        valor: enMuda ? 1 : 0, 
        timestamp, 
        ID_usuario 
      });
      break;
      
    case 'ciclo':
      const nuevoCiclo = valorStr.toLowerCase().trim();
      cicloActual[ID_usuario] = nuevoCiclo;
      cambiarCiclo(nuevoCiclo);
      console.log(`🌅 Ciclo actualizado para usuario ${ID_usuario}: ${nuevoCiclo}`);
      
      io.emit("sensor-data", { 
        topic: `terrario/ciclo/User${ID_usuario}`, 
        zona: "ciclo", 
        valor: nuevoCiclo, 
        timestamp, 
        ID_usuario 
      });
      break;
  }
};

// ✅ FUNCIÓN PARA PROCESAR ACTUADORES
const procesarActuador = async (dispositivo, valorStr, ID_usuario, io, timestamp) => {

  
  // Los actuadores no se guardan en base de datos, solo se confirman via socket
  io.emit("actuador-confirmado", {
    dispositivo,
    valor: valorStr,
    ID_usuario,
    timestamp
  });
};

// ✅ FUNCIÓN PARA PROCESAR DATOS DE SENSORES SOLO SI USUARIO ACTIVO
const procesarSensorDatos = async (mapeo, valor, valorStr, ID_usuario, zona, io, timestamp) => {
  if (isNaN(valor)) {
    return;
  }
  
  const { tipo, zona: zonaSensor } = mapeo;
  
  // ✅ OBTENER ESTADO ACTUAL
  const ciclo = cicloActual[ID_usuario] || 
    (timestamp.getHours() >= 6 && timestamp.getHours() < 18 ? "dia" : "noche");
  const muda = estadoMuda[ID_usuario] === true;
  
  // ✅ GUARDAR EN BASE DE DATOS SOLO SI USUARIO ESTÁ ACTIVO
  const guardado = await insertarEnBaseDatos(tipo, valor, ID_usuario, zonaSensor, ciclo, muda);
  
  if (!guardado) {
    return;
  }
  
  // ✅ EMITIR A CLIENTES SOLO SI SE GUARDÓ
  switch (tipo) {
    case 'temperatura':
      console.log(`🌡️ Temperatura ${zonaSensor} procesada para usuario activo ${ID_usuario}: ${valor}`);
      break;
    case 'humedad':
      console.log(`💧 Humedad procesada para usuario activo ${ID_usuario}: ${valor}`);
      break;
    case 'luminosidad':
      console.log(`☀️ Luminosidad procesada para usuario activo ${ID_usuario}: ${valor}`);
      break;
    case 'luz_uv':
      console.log(`🔆 UV procesado para usuario activo ${ID_usuario}: ${valor}`);
      estadoUV = valor > 0;
      break;
  }
  
  io.emit("sensor-data", { 
    topic: `terrario/${zona}/User${ID_usuario}`, 
    zona: tipo, 
    valor, 
    timestamp, 
    ID_usuario 
  });
  
  // ✅ PROCESAR PARA ALERTAS CRÍTICAS SOLO SI USUARIO ACTIVO
  try {
    await procesarSensor(`terrario/${zona}/User${ID_usuario}`, valor, io);
    
    // ✅ PROCESAR ALERTAS ADICIONALES
    const estado = obtenerEstado();
    if (estado.inicializado && ["temperatura", "humedad"].includes(tipo)) {
      const descripcion = `⚠️ Valor ${tipo} en ${zonaSensor || 'zona'}: ${valor}`;
      await procesarAlerta(tipo, descripcion, valor, ciclo, muda);
    }
  } catch (error) {
    console.error("❌ Error al procesar alerta:", error.message);
  }
};

// ✅ FUNCIÓN DE INICIALIZACIÓN CON SISTEMA DE USUARIOS
const initMQTT = (io) => {

  // Guardar referencia al objeto io
  ioReference = io;
  
  mqttClient.on("message", (topic, message) => {
    handleMessage(topic, message, io);
  });
  
  // ✅ ESCUCHAR EVENTOS DE CONEXIÓN/DESCONEXIÓN DE USUARIOS
  io.on("connection", (socket) => {
    const ID_usuario = socket.handshake.auth?.ID_usuario;
    
    if (ID_usuario) {
      const userId = parseInt(ID_usuario);
      if (!isNaN(userId)) {
        registrarActividadUsuario(userId, 'conexion');
      }
    }
    
    socket.on("disconnect", () => {
      if (ID_usuario) {
        const userId = parseInt(ID_usuario);
        if (!isNaN(userId)) {
          // No desactivar inmediatamente, dar tiempo de gracia
          setTimeout(() => {
            // Verificar si el usuario se reconectó
            if (!io.sockets.sockets.get(socket.id)) {
              desactivarUsuario(userId, 'desconexion');
            }
          }, CONFIG_USUARIOS.TIEMPO_GRACIA);
        }
      }
    });
    
    // ✅ ESCUCHAR ACTIVIDAD DEL USUARIO
    socket.on("user-activity", (data) => {
      if (data.ID_usuario) {
        registrarActividadUsuario(parseInt(data.ID_usuario), 'actividad');
      }
    });
  });
  
  // ✅ LIMPIEZA PERIÓDICA
  setInterval(limpiarUsuariosInactivos, CONFIG_USUARIOS.INTERVALO_LIMPIEZA);
  
  // ✅ LOGGING MEJORADO
  setInterval(() => {
    if (mqttClient.connected) {
      const stats = obtenerEstadisticasUsuarios();
      console.log(`📊 MQTT Status: Conectado | Usuarios activos: ${stats.totalUsuarios} | Estados de muda: ${Object.keys(estadoMuda).length} | Ciclos: ${Object.keys(cicloActual).length}`);
      
      if (stats.totalUsuarios > 0) {
      }
    }
  }, 300000); // Cada 5 minutos
};

// ✅ FUNCIÓN PARA PUBLICAR MENSAJES
const publicarMensaje = (topic, message) => {
  if (mqttClient.connected) {
    mqttClient.publish(topic, message.toString());
    console.log(`📤 Mensaje publicado: ${topic} = ${message}`);
    return true;
  } else {
    console.error(`❌ No se puede publicar: MQTT desconectado`);
    return false;
  }
};

// ✅ FUNCIONES DE UTILIDAD
const obtenerEstadoMQTT = () => {
  return {
    conectado: mqttClient.connected,
    estadosUsuarios: {
      muda: estadoMuda,
      ciclo: cicloActual
    },
    estadoUV: estadoUV,
    usuarios: obtenerEstadisticasUsuarios()
  };
};

module.exports = { 
  mqttClient, 
  initMQTT, 
  publicarMensaje,
  obtenerEstadoMQTT,
  extraerIDUsuario,
  registrarActividadUsuario,
  desactivarUsuario,
  esUsuarioActivo,
  obtenerEstadisticasUsuarios
};