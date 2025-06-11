const mqtt = require("mqtt");
const db = require("./db");
const { procesarSensor, cambiarCiclo, cambiarMuda, obtenerEstado } = require("./registroCritico");
const { procesarAlerta } = require("./Controllers/alertasNotificaciones");

const mqttClient = mqtt.connect("mqtts://d0e185c9110d4506b80ae6e164aaf93e.s1.eu.hivemq.cloud:8883", {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
});

let estadoUV = false;
let estadoMuda = {};
let cicloActual = {};

let usuariosActivos = new Set();
let ultimaActividad = new Map();
let ioReference = null;

// 🔧 CONFIGURACIÓN CORREGIDA - CAMBIO MÍNIMO
const CONFIG_USUARIOS = {
  TIMEOUT_INACTIVIDAD: 3600000, // 🔧 1 HORA (era 10 minutos)
  INTERVALO_LIMPIEZA: 300000,   // 🔧 5 minutos (era 1 minuto)
  TIEMPO_GRACIA: 120000         // 🔧 2 minutos (era 30 segundos)
};

const extraerIDUsuario = (topic) => {
  const match = topic.match(/\/User(\d+)$/);
  return match ? parseInt(match[1]) : null;
};

const esUsuarioActivo = (ID_usuario) => {
  if (!ID_usuario) return false;

  const activo = usuariosActivos.has(ID_usuario);
  const ultimaAct = ultimaActividad.get(ID_usuario);
  const ahora = Date.now();

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

const registrarActividadUsuario = (ID_usuario, accion = 'data') => {
  if (!ID_usuario) return false;

  const ahora = Date.now();
  const eraActivo = usuariosActivos.has(ID_usuario);

  usuariosActivos.add(ID_usuario);
  ultimaActividad.set(ID_usuario, ahora);

  if (!eraActivo) {
    // Notificar cambio de estado solo al usuario específico
    emitirSoloAUsuario(ID_usuario, 'user-status-change', {
      ID_usuario,
      activo: true,
      accion,
      timestamp: new Date().toISOString()
    });
  }

  return true;
};

const desactivarUsuario = (ID_usuario, razon = 'manual') => {
  if (!ID_usuario) return false;

  const eraActivo = usuariosActivos.has(ID_usuario);

  usuariosActivos.delete(ID_usuario);
  ultimaActividad.delete(ID_usuario);

  if (eraActivo) {
    console.log(`🔴 Usuario ${ID_usuario} desactivado (${razon})`);

    // Notificar cambio de estado solo al usuario específico
    emitirSoloAUsuario(ID_usuario, 'user-status-change', {
      ID_usuario,
      activo: false,
      razon,
      timestamp: new Date().toISOString()
    });
  }

  return true;
};

// 🔧 FUNCIÓN HELPER PARA EMITIR SOLO AL USUARIO ESPECÍFICO
const emitirSoloAUsuario = (ID_usuario, evento, datos) => {
  if (!ioReference || !ioReference.userToSocketMap) {
    return false;
  }

  const socketId = ioReference.userToSocketMap.get(ID_usuario);
  if (socketId) {
    const socket = ioReference.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(evento, datos);
      return true;
    }
  }
  return false;
};

const obtenerEstadisticasUsuarios = () => {
  return {
    usuariosActivos: Array.from(usuariosActivos),
    totalUsuarios: usuariosActivos.size,
    ultimasActividades: Object.fromEntries(ultimaActividad),
    timestamp: new Date().toISOString()
  };
};

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
    console.log(`🧹 ${usuariosAEliminar.length} usuarios limpiados por inactividad`);
  }
};

// 🔧 AGREGADO: Función de logs mejorada de tu código original
const logSensorData = (topic, valor, ID_usuario) => {
  const timestamp = new Date().toLocaleTimeString();
  const sensorData = {
    "zonafria": `[${timestamp}] 🌡️❄️ Zona fría: ${valor}°C (Usuario ${ID_usuario})`,
    "zonacaliente": `[${timestamp}] 🌡️🔥 Zona caliente: ${valor}°C (Usuario ${ID_usuario})`,
    "humedad": `[${timestamp}] 💧 Humedad: ${valor}% (Usuario ${ID_usuario})`,
    "muda": `[${timestamp}] 🦎 Muda: ${valor} (Usuario ${ID_usuario})`,
    "uvi": `[${timestamp}] ☀️ UV: ${valor} (Usuario ${ID_usuario})`,
    "luminosidad": `[${timestamp}] 💡 Luz: ${valor}% (Usuario ${ID_usuario})`,
    "ciclo": `[${timestamp}] 🔄 Ciclo: ${valor} (Usuario ${ID_usuario})`,
  };
  
  const zona = topic.split("/")[1];
  console.log(sensorData[zona] || `[${timestamp}] ${topic}: ${valor} (Usuario ${ID_usuario})`);
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
  console.log("🔄 Reconectando MQTT...");
});


const handleMessage = async (topic, message, io) => {
  try {
    const valorStr = message.toString().trim();
    const topicParts = topic.split("/");

    if (topicParts.length !== 3 || topicParts[0] !== "terrario") return;

    const [_, zona, usuarioMQTT] = topicParts;
    const ID_usuario = extraerIDUsuario(topic);
    const timestamp = new Date();

    if (!ID_usuario) return;

    if (!esUsuarioActivo(ID_usuario)) {
      registrarActividadUsuario(ID_usuario, 'sensor-data');
    }

    // 🌗 CICLO
if (zona === "ciclo") {
  const nuevoCiclo = valorStr.toLowerCase();
  logSensorData(topic, nuevoCiclo, ID_usuario);

  cicloActual[ID_usuario] = nuevoCiclo;

  console.log("📤 Enviando ciclo al frontend:", nuevoCiclo);

  emitirSoloAUsuario(ID_usuario, "sensor-data", {
    topic,
    valor: nuevoCiclo,
    timestamp,
    zona,
    ID_usuario
  });

  if (cambiarCiclo(nuevoCiclo)) {
    console.log(`🔄 CICLO para usuario ${ID_usuario}: cambiado a ${nuevoCiclo}`);
  } else {
    console.log(`🔁 CICLO para usuario ${ID_usuario}: sin cambio (${nuevoCiclo})`);
  }
  return;
}


    // 🦎 MUDA
    if (zona === "muda") {
      const estado = parseInt(valorStr);
      if (isNaN(estado) || (estado !== 0 && estado !== 1)) {
        console.error(`❌ Estado muda inválido para usuario ${ID_usuario}: "${valorStr}"`);
        return;
      }

      logSensorData(topic, estado, ID_usuario);

      estadoMuda[ID_usuario] = estado === 1;

      if (cambiarMuda(estado === 1)) {
        emitirSoloAUsuario(ID_usuario, "muda-actualizada", {
          estado_muda: estado,
          timestamp,
          ID_usuario
        });
      }
      return;
    }

    // 📈 OTROS SENSORES
    let valor;
    if (zona === "uvi") {
      if (valorStr.toLowerCase() === "encendido") valor = 1;
      else if (valorStr.toLowerCase() === "apagado") valor = 0;
      else valor = parseFloat(valorStr);
    } else {
      valor = parseFloat(valorStr);
    }

    if (isNaN(valor)) {
      console.error(`❌ Valor no numérico en ${topic}: "${valorStr}"`);
      return;
    }

    logSensorData(topic, valor, ID_usuario);

    await procesarSensor(topic, valor, io);

    emitirSoloAUsuario(ID_usuario, "sensor-data", {
      topic,
      valor,
      timestamp,
      zona,
      ID_usuario
    });

  } catch (error) {
    console.error("❌ Error en handleMessage:", error);
  }
};



const initMQTT = (io, socketToUserMap = null, userToSocketMap = null) => {
  ioReference = io;
  ioReference.socketToUserMap = socketToUserMap;
  ioReference.userToSocketMap = userToSocketMap;

  mqttClient.on("message", (topic, message) => {
    handleMessage(topic, message, io);
  });

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
          setTimeout(() => {
            if (!io.sockets.sockets.get(socket.id)) {
              desactivarUsuario(userId, 'desconexion');
            }
          }, CONFIG_USUARIOS.TIEMPO_GRACIA);
        }
      }
    });

    socket.on("user-activity", (data) => {
      if (data.ID_usuario) {
        registrarActividadUsuario(parseInt(data.ID_usuario), 'actividad');
      }
    });
  });

  setInterval(limpiarUsuariosInactivos, CONFIG_USUARIOS.INTERVALO_LIMPIEZA);

  setInterval(() => {
    if (mqttClient.connected) {
      const stats = obtenerEstadisticasUsuarios();
      console.log(`📊 MQTT Status: Conectado | Usuarios activos: ${stats.totalUsuarios} | Estados de muda: ${Object.keys(estadoMuda).length} | Ciclos: ${Object.keys(cicloActual).length}`);

      if (stats.totalUsuarios > 0) {
        console.log(`👥 Usuarios conectados: ${stats.usuariosActivos.join(', ')}`);
      }
    }
  }, 300000);
};

const publicarMensaje = (topic, message) => {
  if (mqttClient.connected) {
    mqttClient.publish(topic, message.toString());
    return true;
  } else {
    console.error(`❌ No se puede publicar: MQTT desconectado`);
    return false;
  }
};

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
  obtenerEstadisticasUsuarios,
  emitirSoloAUsuario
};