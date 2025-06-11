// ============================================
// SISTEMA DE REGISTRO CRÍTICO MULTIUSUARIO
// Gestiona evaluación y almacenamiento de valores críticos para sensores
// de terrarios de gecko leopardo con soporte para múltiples usuarios
// ============================================

// DEPENDENCIAS Y MÓDULOS
const db = require("./db");
const { sendCriticalAlert } = require('./controllers/SendEmail');

// ============================================
// CONFIGURACIONES Y CONSTANTES DEL SISTEMA
// ============================================

// Configuración para detección de valores críticos
const CONFIG = {
  UMBRAL_CRITICO: 1  // Diferencia mínima entre valores críticos consecutivos
};

// Configuración para limpieza automática de registros (sistema FIFO)
const CONFIG_LIMPIEZA = {
  LIMITE_REGISTROS: 500,      // Máximo registros por usuario por tabla
  LOTE_ELIMINACION: 1,        // Registros a eliminar cuando se supera el límite
  INTERVALO_VERIFICACION: 300000  // 5 minutos entre verificaciones automáticas
};

// Límites de valores normales por sensor y condición
const LIMITES = {
  temperatura: {
    fria: {
      'dia':   { min: 26, max: 28 },
      'noche': { min: 20, max: 24 },
      'diaam': { min: 26, max: 28 }
    },
    caliente: {
      'dia':   { min: 28, max: 34 },
      'noche': { min: 25, max: 28 },
      'diaam': { min: 28, max: 34 }
    }
  },
  humedad: {
    normal: { min: 30, max: 50 },  // Estado normal del gecko
    muda:   { min: 50, max: 70 }   // Estado de muda del gecko
  },
  luz_uv: {
    'dia':   { min: 0,   max: 0   },
    'noche': { min: 0,   max: 0   },
    'diaam': { min: 0.2, max: 1   }
  }
};

// ============================================
// VARIABLES GLOBALES DE ESTADO
// ============================================

// Estado del sistema por usuario (ciclo, muda, inicialización, últimos valores)
let estadosUsuarios = {};

// Registro de últimos valores críticos para control de umbral
let ultimosCriticosPorUsuario = {};

// Buffer temporal para valores normales (se procesan cada 30 segundos)
let buffersPorUsuario = {};

// ============================================
// FUNCIONES UTILITARIAS
// ============================================

// Extrae el ID del usuario desde el topic MQTT
const extraerIDUsuario = (topic) => {
  const parts = topic.split('/');
  const userPart = parts[2];
  
  if (userPart && userPart.startsWith('User')) {
    const idStr = userPart.replace('User', '');
    const id = parseInt(idStr);
    return isNaN(id) ? 1 : id;
  }
  
  return 1;  // Usuario por defecto si no se puede extraer
};

// Normaliza valores TINYINT desde la base de datos a números
const normalizarTinyInt = (valor) => {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') return parseInt(valor) || 0;
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  return 0;
};

// ============================================
// FUNCIONES DE GESTIÓN DE ESTADO POR USUARIO
// ============================================

// Obtiene o crea el estado de un usuario específico
const obtenerOCrearEstadoUsuario = (ID_usuario) => {
  if (!estadosUsuarios[ID_usuario]) {
    estadosUsuarios[ID_usuario] = {
      cicloActual: null,           // 'dia', 'noche', 'diaam'
      estadoMuda: null,            // 0 = normal, 1 = en muda
      sistemaInicializado: false,  // true cuando ciclo y muda están definidos
      ultimosValores: {            // Cache de últimos valores recibidos
        tempFria: null,
        tempCaliente: null, 
        humedad: null,
        luzUV: null
      }
    };
  }
  return estadosUsuarios[ID_usuario];
};

// Obtiene el registro de últimos valores críticos para un usuario
const obtenerUltimosCriticos = (ID_usuario) => {
  if (!ultimosCriticosPorUsuario[ID_usuario]) {
    ultimosCriticosPorUsuario[ID_usuario] = {
      temperatura: { fria: null, caliente: null },
      humedad: null,
      luz_uv: null
    };
  }
  return ultimosCriticosPorUsuario[ID_usuario];
};

// Obtiene el buffer de valores normales para un usuario
const obtenerBuffer = (ID_usuario) => {
  if (!buffersPorUsuario[ID_usuario]) {
    buffersPorUsuario[ID_usuario] = {
      temperatura: { fria: null, caliente: null },
      humedad: null,
      luz_uv: null
    };
  }
  return buffersPorUsuario[ID_usuario];
};

// ============================================
// FUNCIONES DE VERIFICACIÓN DE INICIALIZACIÓN
// ============================================

// Verifica si el sistema está completamente inicializado para un usuario
const sistemaEstaInicializado = (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  return estado.cicloActual !== null && estado.estadoMuda !== null;
};

// Verifica y notifica cuando se completa la inicialización del sistema
const verificarInicializacionCompleta = (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  const anteriorEstado = estado.sistemaInicializado;
  estado.sistemaInicializado = sistemaEstaInicializado(ID_usuario);
  
  if (!anteriorEstado && estado.sistemaInicializado) {
    console.log(`✅ SISTEMA COMPLETAMENTE INICIALIZADO para usuario ${ID_usuario}`);
    console.log(`   - Ciclo: ${estado.cicloActual}`);
    console.log(`   - Muda: ${estado.estadoMuda}`);
    console.log("🎯 Evaluaciones críticas ACTIVADAS");
  }
};

// ============================================
// FUNCIONES DE EVALUACIÓN DE LÍMITES
// ============================================

// Evalúa si un valor está fuera de los límites normales
const evaluarValorCritico = (tipoSensor, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  // Verificar que el sistema esté inicializado
  if (!sistemaEstaInicializado(ID_usuario)) {
    return {
      esCritico: false,
      limites: null,
      razon: `Sistema no inicializado para usuario ${ID_usuario}`
    };
  }
  
  let limites;
  
  // Determinar límites según el tipo de sensor
  if (tipoSensor === 'temperatura') {
    limites = LIMITES.temperatura[zona][estado.cicloActual];
    
  } else if (tipoSensor === 'humedad') {
    // CORRECCIÓN: Normalizar TINYINT desde base de datos
    const estadoMudaNumerico = normalizarTinyInt(estado.estadoMuda);
    const estadoMuda = estadoMudaNumerico === 1 ? 'muda' : 'normal';
    limites = LIMITES.humedad[estadoMuda];
    
    console.log(`🦎 Evaluando humedad: valor=${valor}, estadoMuda=${estadoMudaNumerico} (${estadoMuda}), límites=${JSON.stringify(limites)}`);
    
  } else if (tipoSensor === 'luz_uv') {
    limites = LIMITES.luz_uv[estado.cicloActual];
    
  } else {
    return {
      esCritico: false,
      limites: null,
      razon: `Tipo de sensor desconocido: ${tipoSensor}`
    };
  }
  
  // Evaluar si el valor está fuera de límites
  const fuera = valor < limites.min || valor > limites.max;
  
  return {
    esCritico: fuera,
    limites: limites,
    razon: fuera ? `Valor ${valor} fuera de rango ${limites.min}-${limites.max}` : "Normal"
  };
};

// ============================================
// FUNCIONES DE REGISTRO EN BASE DE DATOS
// ============================================

// Registra un valor crítico inmediatamente en la base de datos
const registrarValorCriticoEnBD = async (tipoSensor, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  const timestamp = new Date();
  let query, params, tabla, columnaId;
  
  // Configurar query según el tipo de sensor
  if (tipoSensor === 'temperatura') {
    tabla = 'temperatura';
    columnaId = 'ID_temperatura';
    query = `INSERT INTO temperatura 
             (ID_usuario, Medicion, Zona, Marca_tiempo, es_critico, Ciclo) 
             VALUES (?, ?, ?, ?, 1, ?)`;
    params = [ID_usuario, valor, zona, timestamp, estado.cicloActual];
    
  } else if (tipoSensor === 'humedad') {
    tabla = 'humedad';
    columnaId = 'ID_humedad';
    
    // Normalizar estado_muda antes de guardar
    const estadoMudaNormalizado = normalizarTinyInt(estado.estadoMuda);
    
    query = `INSERT INTO humedad 
             (ID_usuario, Medicion, Marca_tiempo, es_critico, estado_muda, Ciclo) 
             VALUES (?, ?, ?, 1, ?, ?)`;
    params = [ID_usuario, valor, timestamp, estadoMudaNormalizado, estado.cicloActual];
    
  } else if (tipoSensor === 'luz_uv') {
    tabla = 'luz_uv';
    columnaId = 'ID_luz_uv';
    query = `INSERT INTO luz_uv 
             (ID_usuario, Medicion, Marca_tiempo, es_critico, Ciclo) 
             VALUES (?, ?, ?, 1, ?)`;
    params = [ID_usuario, valor, timestamp, estado.cicloActual];
  }
  
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        console.error(`❌ Error registrando CRÍTICO en BD (${tipoSensor}) para usuario ${ID_usuario}:`, err);
        reject(err);
        return;
      }
      
      console.log(`🚨 CRÍTICO REGISTRADO: ${tipoSensor} ${zona || ''} = ${valor} (Usuario ${ID_usuario}, ID: ${result.insertId})`);
      
      // Limpieza probabilística después de inserción
      if (Math.random() < 0.05) {
        limpiarTablaFIFO(tabla, columnaId, ID_usuario).catch(err => {
          console.error(`❌ Error en limpieza post-inserción:`, err);
        });
      }
      
      resolve(result);
    });
  });
};

// Registra un valor normal en la base de datos (desde buffer)
const registrarValorNormalEnBD = async (tipoSensor, valor, zona, metadata) => {
  let query, params, tabla, columnaId;
  
  // Configurar query según el tipo de sensor
  if (tipoSensor === 'temperatura') {
    tabla = 'temperatura';
    columnaId = 'ID_temperatura';
    query = `INSERT INTO temperatura 
             (ID_usuario, Medicion, Zona, Marca_tiempo, es_critico, Ciclo) 
             VALUES (?, ?, ?, ?, 0, ?)`;
    params = [metadata.ID_usuario, valor, zona, metadata.timestamp, metadata.ciclo];
    
  } else if (tipoSensor === 'humedad') {
    tabla = 'humedad';
    columnaId = 'ID_humedad';
    
    // Normalizar estado_muda
    const estadoMudaNormalizado = normalizarTinyInt(metadata.estado_muda);
    
    query = `INSERT INTO humedad 
             (ID_usuario, Medicion, Marca_tiempo, es_critico, estado_muda, Ciclo) 
             VALUES (?, ?, ?, 0, ?, ?)`;
    params = [metadata.ID_usuario, valor, metadata.timestamp, estadoMudaNormalizado, metadata.ciclo];
    
  } else if (tipoSensor === 'luz_uv') {
    tabla = 'luz_uv';
    columnaId = 'ID_luz_uv';
    query = `INSERT INTO luz_uv 
             (ID_usuario, Medicion, Marca_tiempo, es_critico, Ciclo) 
             VALUES (?, ?, ?, 0, ?)`;
    params = [metadata.ID_usuario, valor, metadata.timestamp, metadata.ciclo];
  }
  
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        console.error(`❌ Error registrando NORMAL en BD (${tipoSensor}) para usuario ${metadata.ID_usuario}:`, err);
        reject(err);
        return;
      }
      
      console.log(`📝 NORMAL REGISTRADO: ${tipoSensor} ${zona || ''} = ${valor} (Usuario ${metadata.ID_usuario}, ID: ${result.insertId})`);
      
      // Limpieza probabilística después de inserción
      if (Math.random() < 0.02) {
        limpiarTablaFIFO(tabla, columnaId, metadata.ID_usuario).catch(err => {
          console.error(`❌ Error en limpieza post-inserción:`, err);
        });
      }
      
      resolve(result);
    });
  });
};

// ============================================
// FUNCIONES DE GESTIÓN DE BUFFER
// ============================================

// Almacena un valor normal en el buffer temporal (se procesa cada 30 segundos)
const almacenarEnBuffer = (tipo, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  if (!sistemaEstaInicializado(ID_usuario)) {
    console.log(`⏸️ Buffer omitido (sistema no inicializado): ${tipo} ${zona || ''} = ${valor} (Usuario ${ID_usuario})`);
    return;
  }
  
  // Crear metadata del valor
  const metadata = {
    valor,
    timestamp: new Date(),
    ciclo: estado.cicloActual,
    estado_muda: estado.estadoMuda,
    ID_usuario
  };

  const buffer = obtenerBuffer(ID_usuario);
  
  // Almacenar en el buffer apropiado
  if (tipo === 'temperatura') {
    buffer.temperatura[zona] = metadata;
    console.log(`📦 Buffer: ${tipo} ${zona} = ${valor} (Usuario ${ID_usuario}, será registrado en 30s)`);
  } else if (tipo === 'humedad') {
    buffer.humedad = metadata;
    console.log(`📦 Buffer: ${tipo} = ${valor} (Usuario ${ID_usuario}, será registrado en 30s)`);
  } else if (tipo === 'luz_uv') {
    buffer.luz_uv = metadata;
    console.log(`📦 Buffer: ${tipo} = ${valor} (Usuario ${ID_usuario}, será registrado en 30s)`);
  }
};

// Procesa y registra todos los valores normales del buffer de un usuario
const procesarBufferNormales = async (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  if (!sistemaEstaInicializado(ID_usuario)) {
    console.log(`⏸️ Buffer no procesado: sistema no inicializado para usuario ${ID_usuario}`);
    return;
  }
  
  console.log(`⏰ Procesando buffer de valores normales para usuario ${ID_usuario}...`);
  let registrosGuardados = 0;
  
  try {
    const buffer = obtenerBuffer(ID_usuario);
    
    // Procesar cada tipo de sensor en el buffer
    if (buffer.temperatura.fria) {
      await registrarValorNormalEnBD('temperatura', 
        buffer.temperatura.fria.valor, 
        'fria',
        buffer.temperatura.fria
      );
      registrosGuardados++;
    }
    
    if (buffer.temperatura.caliente) {
      await registrarValorNormalEnBD('temperatura', 
        buffer.temperatura.caliente.valor, 
        'caliente',
        buffer.temperatura.caliente
      );
      registrosGuardados++;
    }
    
    if (buffer.humedad) {
      await registrarValorNormalEnBD('humedad', 
        buffer.humedad.valor, 
        null,
        buffer.humedad
      );
      registrosGuardados++;
    }
    
    if (buffer.luz_uv) {
      await registrarValorNormalEnBD('luz_uv', 
        buffer.luz_uv.valor, 
        null,
        buffer.luz_uv
      );
      registrosGuardados++;
    }
    
    console.log(`✅ Buffer procesado para usuario ${ID_usuario}: ${registrosGuardados} registros normales guardados`);
    
  } catch (error) {
    console.error(`❌ Error procesando buffer de valores normales para usuario ${ID_usuario}:`, error);
  }
  
  // Limpiar buffer después del procesamiento
  buffersPorUsuario[ID_usuario] = {
    temperatura: { fria: null, caliente: null },
    humedad: null,
    luz_uv: null
  };
};

// Procesa los buffers de todos los usuarios registrados
const procesarTodosLosBuffers = async () => {
  const usuariosConBuffer = Object.keys(buffersPorUsuario);
  
  for (const ID_usuario of usuariosConBuffer) {
    await procesarBufferNormales(parseInt(ID_usuario));
  }
};

// ============================================
// FUNCIÓN DE ACTUALIZACIÓN DE ÚLTIMOS VALORES
// ============================================

// Actualiza el cache de últimos valores recibidos por sensor
const actualizarUltimoValor = (tipo, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  if (tipo === 'temperatura') {
    estado.ultimosValores[zona === 'fria' ? 'tempFria' : 'tempCaliente'] = valor;
  } else if (tipo === 'humedad') {
    estado.ultimosValores.humedad = valor;
  } else if (tipo === 'luz_uv') {
    estado.ultimosValores.luzUV = valor;
  }
};

// ============================================
// FUNCIÓN PRINCIPAL DE PROCESAMIENTO DE SENSORES
// ============================================

// Función principal que procesa cada medición de sensor recibida
const procesarSensor = async (topic, valor, io) => {
  const ID_usuario = extraerIDUsuario(topic);
  
  // Almacenar referencia global de io para logs
  global.ioReference = io;
  
  // Mapeo de topics a tipos de sensor
  const MAPEO_TOPICS = {
    'terrario/zonafria/User1': { tipo: 'temperatura', zona: 'fria' },
    'terrario/zonacaliente/User1': { tipo: 'temperatura', zona: 'caliente' },
    'terrario/humedad/User1': { tipo: 'humedad', zona: null },
    'terrario/uvi/User1': { tipo: 'luz_uv', zona: null }
  };
  
  // Identificar tipo de sensor desde el topic
  let sensorInfo = MAPEO_TOPICS[topic];
  if (!sensorInfo) {
    if (topic.includes('zonafria')) {
      sensorInfo = { tipo: 'temperatura', zona: 'fria' };
    } else if (topic.includes('zonacaliente')) {
      sensorInfo = { tipo: 'temperatura', zona: 'caliente' };
    } else if (topic.includes('humedad')) {
      sensorInfo = { tipo: 'humedad', zona: null };
    } else if (topic.includes('uvi')) {
      sensorInfo = { tipo: 'luz_uv', zona: null };
    } else {
      console.log(`ℹ️ Tópico ignorado: ${topic}`);
      return;
    }
  }
  
  const { tipo, zona } = sensorInfo;
  
  // Actualizar cache de últimos valores
  actualizarUltimoValor(tipo, valor, zona, ID_usuario);
  
  // Verificar si el sistema está inicializado
  if (!sistemaEstaInicializado(ID_usuario)) {
    const estado = obtenerOCrearEstadoUsuario(ID_usuario);
    console.log(`⏸️ Sensor recibido pero sistema no inicializado para usuario ${ID_usuario}: ${tipo} ${zona || ''} = ${valor}`);
    console.log(`   Estado actual: ciclo=${estado.cicloActual}, muda=${estado.estadoMuda}`);
    
    io.emit("sensor-pendiente", {
      topic,
      valor,
      timestamp: new Date(),
      razon: `Sistema no inicializado para usuario ${ID_usuario}`,
      ID_usuario
    });
    return;
  }
  
  // Evaluar si el valor es crítico
  const evaluacion = evaluarValorCritico(tipo, valor, zona, ID_usuario);
  
  if (evaluacion.esCritico) {
    // PROCESAMIENTO DE VALOR CRÍTICO
    
    const ultimosCriticos = obtenerUltimosCriticos(ID_usuario);
    let ultimoCritico;
    
    // Obtener último valor crítico del mismo sensor
    if (tipo === 'temperatura') {
      ultimoCritico = ultimosCriticos.temperatura[zona];
    } else if (tipo === 'humedad') {
      ultimoCritico = ultimosCriticos.humedad;
    } else if (tipo === 'luz_uv') {
      ultimoCritico = ultimosCriticos.luz_uv;
    }
    
    // Verificar umbral para evitar spam de críticos similares
    const diferencia = ultimoCritico !== null ? Math.abs(valor - ultimoCritico) : null;
    console.log(`🔍 UMBRAL CHECK: ${tipo} ${zona || ''} = ${valor} | Último: ${ultimoCritico} | Dif: ${diferencia ? diferencia.toFixed(2) : 'null'} | Umbral: ${CONFIG.UMBRAL_CRITICO}`);
    
    if (ultimoCritico !== null && diferencia < CONFIG.UMBRAL_CRITICO) {
      console.log(`⏸️ Crítico omitido por umbral para usuario ${ID_usuario}: diferencia ${diferencia.toFixed(2)} < ${CONFIG.UMBRAL_CRITICO}`);
      return;
    }
    
    try {
      // Registrar valor crítico en base de datos
      await registrarValorCriticoEnBD(tipo, valor, zona, ID_usuario);
      
      // Actualizar último valor crítico
      if (tipo === 'temperatura') {
        ultimosCriticos.temperatura[zona] = valor;
      } else if (tipo === 'humedad') {
        ultimosCriticos.humedad = valor;
      } else if (tipo === 'luz_uv') {
        ultimosCriticos.luz_uv = valor;
      }
      
      const estado = obtenerOCrearEstadoUsuario(ID_usuario);
      
      // Emitir alertas por WebSocket
      io.emit("alerta-valor-critico", {
        tipo_sensor: tipo,
        zona: zona,
        valor: valor,
        limites: evaluacion.limites,
        ciclo: estado.cicloActual,
        estado_muda: estado.estadoMuda,
        timestamp: new Date(),
        ID_usuario
      });
      
      io.emit("valor-critico", {
        tipo,
        zona,
        valor,
        timestamp: new Date(),
        ciclo: estado.cicloActual,
        estado_muda: estado.estadoMuda,
        ID_usuario,
        es_critico: true
      });
      
      console.log(`🔔 Notificación crítica enviada: ${tipo} ${zona || ''} = ${valor} (Usuario ${ID_usuario})`);
      
      // Verificar estado de conexiones WebSocket
      if (global.ioReference && global.ioReference.sockets) {
        const socketsCount = global.ioReference.sockets.sockets.size;
        console.log(`📡 Socket status: ${socketsCount} clientes conectados`);
        
        if (socketsCount === 0) {
          console.warn(`⚠️ No hay clientes conectados - notificaciones no se enviarán hasta que se conecte el frontend`);
        }
      }
      
      // Enviar email de alerta crítica
      try {
        await sendCriticalAlert({ 
          tipo_sensor: tipo, 
          zona, 
          valor, 
          limites: evaluacion.limites, 
          usuario: ID_usuario,
          ciclo: estado.cicloActual,
          estado_muda: estado.estadoMuda
        });
        console.log(`📧 Email enviado con éxito: ${tipo} ${zona || ''} = ${valor} (Usuario ${ID_usuario})`);
      } catch (emailError) {
        if (emailError.message.includes('Daily user sending limit exceeded')) {
          console.warn(`⚠️ Límite diario de Gmail alcanzado - notificaciones in-app funcionando normalmente`);
        } else {
          console.error(`❌ Error enviando email para usuario ${ID_usuario}:`, emailError.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error procesando valor crítico para usuario ${ID_usuario}:`, error);
    }
    
  } else {
    // PROCESAMIENTO DE VALOR NORMAL
    
    almacenarEnBuffer(tipo, valor, zona, ID_usuario);
    console.log(`✅ Normal para usuario ${ID_usuario}: ${tipo} ${zona || ''} = ${valor} - ${evaluacion.razon}`);
    
    // Emitir datos del sensor por WebSocket
    io.emit("sensor-data", {
      tipo,
      zona,
      valor,
      timestamp: new Date(),
      ID_usuario,
      es_critico: false
    });
  }
};

// ============================================
// FUNCIONES DE CONTROL DE CICLO Y MUDA
// ============================================

// Cambia el ciclo actual del sistema (día, noche, amanecer)
const cambiarCiclo = (nuevoCiclo) => {
  Object.keys(estadosUsuarios).forEach(ID_usuario => {
    const estado = obtenerOCrearEstadoUsuario(parseInt(ID_usuario));
    const anterior = estado.cicloActual;
    estado.cicloActual = nuevoCiclo;
    
    if (anterior === null) {
      console.log(`🎯 CICLO INICIALIZADO para usuario ${ID_usuario}: ${nuevoCiclo}`);
    } else {
      console.log(`🔄 CICLO para usuario ${ID_usuario}: ${anterior} → ${nuevoCiclo}`);
    }
    
    verificarInicializacionCompleta(parseInt(ID_usuario));
  });
  
  return true;
};

// Cambia el estado de muda del gecko
const cambiarMuda = (nuevoEstado, ID_usuario = null) => {
  // Asegurar que nuevoEstado sea número
  const estadoNumerico = normalizarTinyInt(nuevoEstado);
  
  if (ID_usuario) {
    const estado = obtenerOCrearEstadoUsuario(ID_usuario);
    const anterior = estado.estadoMuda;
    
    // Guardar como número normalizado
    estado.estadoMuda = estadoNumerico;
    
    console.log(`🦎 CAMBIO DE MUDA usuario ${ID_usuario}:`, {
      anterior: anterior,
      nuevo: estadoNumerico,
      textoEstado: estadoNumerico === 1 ? 'MUDANDO' : 'NORMAL'
    });
    
    // Mostrar límites que se aplicarán
    const estadoMudaTexto = estadoNumerico === 1 ? 'muda' : 'normal';
    const limitesQueSeAplicaran = LIMITES.humedad[estadoMudaTexto];
    console.log(`🦎 Límites humedad que se aplicarán: ${JSON.stringify(limitesQueSeAplicaran)}`);
    
    verificarInicializacionCompleta(ID_usuario);
  } else {
    // Cambiar para todos los usuarios
    Object.keys(estadosUsuarios).forEach(ID_usuario => {
      cambiarMuda(estadoNumerico, parseInt(ID_usuario));
    });
  }
  
  return true;
};

// ============================================
// FUNCIONES DE CONSULTA DE ESTADO
// ============================================

// Obtiene el estado general del sistema (primer usuario)
const obtenerEstado = () => {
  const primerUsuario = Object.keys(estadosUsuarios)[0];
  if (primerUsuario) {
    const estado = estadosUsuarios[primerUsuario];
    return {
      ciclo: estado.cicloActual,
      muda: estado.estadoMuda,
      inicializado: estado.sistemaInicializado,
      ultimos: estado.ultimosValores
    };
  }
  
  return {
    ciclo: null,
    muda: null,
    inicializado: false,
    ultimos: { tempFria: null, tempCaliente: null, humedad: null, luzUV: null }
  };
};

// Obtiene el estado específico de un usuario
const obtenerEstadoUsuarioEspecifico = (ID_usuario) => {
  return obtenerOCrearEstadoUsuario(ID_usuario);
};

// Obtiene el buffer actual de un usuario
const obtenerBufferUsuario = (ID_usuario) => {
  return obtenerBuffer(ID_usuario);
};

// ============================================
// FUNCIONES DE LIMPIEZA AUTOMÁTICA (FIFO)
// ============================================

// Implementa limpieza FIFO para mantener límite de registros por tabla
const limpiarTablaFIFO = async (tabla, columnaId, ID_usuario) => {
  return new Promise((resolve, reject) => {
    const consultaConteo = `SELECT COUNT(*) as total FROM ${tabla} WHERE ID_usuario = ?`;
    
    db.query(consultaConteo, [ID_usuario], (err, resultado) => {
      if (err) {
        reject(err);
        return;
      }
      
      const totalRegistros = resultado[0].total;
      
      // Verificar si se supera el límite
      if (totalRegistros <= CONFIG_LIMPIEZA.LIMITE_REGISTROS) {
        resolve(false);
        return;
      }
      
      const registrosAEliminar = totalRegistros - CONFIG_LIMPIEZA.LIMITE_REGISTROS + CONFIG_LIMPIEZA.LOTE_ELIMINACION;
      
      // Eliminar registros más antiguos
      const consultaEliminacion = `
        DELETE FROM ${tabla} 
        WHERE ID_usuario = ? 
        AND ${columnaId} IN (
          SELECT ${columnaId} FROM (
            SELECT ${columnaId} 
            FROM ${tabla} 
            WHERE ID_usuario = ? 
            ORDER BY Marca_tiempo ASC 
            LIMIT ?
          ) AS temp
        )
      `;
      
      db.query(consultaEliminacion, [ID_usuario, ID_usuario, registrosAEliminar], (errDel, resultDel) => {
        if (errDel) {
          reject(errDel);
          return;
        }
        
        resolve(true);
      });
    });
  });
};

// Ejecuta limpieza completa para todas las tablas de un usuario
const ejecutarLimpiezaCompleta = async (ID_usuario) => {
  const tablas = [
    { nombre: 'temperatura', columnaId: 'ID_temperatura' },
    { nombre: 'humedad', columnaId: 'ID_humedad' },
    { nombre: 'luz_uv', columnaId: 'ID_luz_uv' }
  ];
  
  try {
    for (const tabla of tablas) {
      await limpiarTablaFIFO(tabla.nombre, tabla.columnaId, ID_usuario);
    }
  } catch (error) {
    console.error(`❌ Error durante limpieza FIFO para usuario ${ID_usuario}:`, error);
  }
};

// ============================================
// FUNCIONES DE DIAGNÓSTICO Y DEBUG
// ============================================

// Función de diagnóstico específica para problemas de TINYINT
const diagnosticarTinyInt = (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  console.log(`🔬 DIAGNÓSTICO TINYINT Usuario ${ID_usuario}:`);
  console.log(`   estado.estadoMuda RAW: "${estado.estadoMuda}"`);
  console.log(`   Tipo: ${typeof estado.estadoMuda}`);
  console.log(`   Comparación === 1: ${estado.estadoMuda === 1}`);
  console.log(`   Comparación == 1: ${estado.estadoMuda == 1}`);
  console.log(`   normalizarTinyInt(): ${normalizarTinyInt(estado.estadoMuda)}`);
  
  // Probar evaluación
  const estadoMudaNumerico = normalizarTinyInt(estado.estadoMuda);
  const estadoMuda = estadoMudaNumerico === 1 ? 'muda' : 'normal';
  const limites = LIMITES.humedad[estadoMuda];
  
  console.log(`   Estado interpretado: ${estadoMuda}`);
  console.log(`   Límites aplicados: ${JSON.stringify(limites)}`);
};

// Función para verificar estado actual de un usuario
const verificarEstadoMudaUsuario = (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  console.log(`🔍 Estado actual usuario ${ID_usuario}:`, {
    ciclo: estado.cicloActual,
    estadoMuda: estado.estadoMuda,
    inicializado: estado.sistemaInicializado
  });
  return estado;
};

// ============================================
// INICIALIZACIÓN DEL SISTEMA
// ============================================

console.log("🔄 Iniciando sistema de registro crítico multiusuario...");
console.log("⚠️  Estados en NULL hasta recibir datos del broker MQTT por usuario");
console.log(`🎯 Umbral crítico: ${CONFIG.UMBRAL_CRITICO}`);

// Timer para procesamiento de buffers cada 30 segundos
setInterval(() => {
  procesarTodosLosBuffers();
}, 30000);

// Limpieza inicial después de 30 segundos
setTimeout(() => {
  Object.keys(estadosUsuarios).forEach(ID_usuario => {
    ejecutarLimpiezaCompleta(parseInt(ID_usuario));
  });
}, 30000);

// Timer para limpieza automática cada 5 minutos
setInterval(() => {
  Object.keys(estadosUsuarios).forEach(ID_usuario => {
    ejecutarLimpiezaCompleta(parseInt(ID_usuario));
  });
}, CONFIG_LIMPIEZA.INTERVALO_VERIFICACION);

console.log("⏰ Timer iniciado: valores normales cada 30 segundos");
console.log("✅ Sistema multiusuario listo - Esperando datos del broker...");

// ============================================
// EXPORTACIÓN DE MÓDULOS
// ============================================

module.exports = {
  // Funciones principales
  procesarSensor,
  cambiarCiclo,
  cambiarMuda,
  evaluarValorCritico,
  
  // Funciones de estado
  sistemaEstaInicializado,
  obtenerEstado,
  obtenerEstadoUsuarioEspecifico,
  obtenerBufferUsuario,
  
  // Funciones de limpieza
  ejecutarLimpiezaCompleta,
  limpiarTablaFIFO,
  
  // Funciones utilitarias
  extraerIDUsuario,
  normalizarTinyInt,
  
  // Funciones de diagnóstico
  verificarEstadoMudaUsuario,
  diagnosticarTinyInt,
  
  // Constantes
  Limites: LIMITES
};