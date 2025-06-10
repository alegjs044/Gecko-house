// =============================================
// REGISTRO CRÍTICO - Tu lógica que funciona + Múltiples usuarios
// =============================================
// Estados NULL hasta datos reales, pero ahora por usuario
// Registra valores críticos INMEDIATAMENTE con umbral de diferencia 0.2
// Registra valores normales cada 30 segundos
// =============================================

const db = require("./db");
const { sendCriticalAlert } = require('./controllers/SendEmail');

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
  UMBRAL_CRITICO: 0.2
};

// ============================================
// LIMPIEZA FIFO - MÁXIMO 1000 REGISTROS POR USUARIO
// ============================================
const CONFIG_LIMPIEZA = {
  LIMITE_REGISTROS: 500,
  LOTE_ELIMINACION: 1,
  INTERVALO_VERIFICACION: 300000
};

const limpiarTablaFIFO = async (tabla, columnaId, ID_usuario) => {
  return new Promise((resolve, reject) => {
    const consultaConteo = `SELECT COUNT(*) as total FROM ${tabla} WHERE ID_usuario = ?`;
    
    db.query(consultaConteo, [ID_usuario], (err, resultado) => {
      if (err) {
        reject(err);
        return;
      }
      
      const totalRegistros = resultado[0].total;
      
      if (totalRegistros <= CONFIG_LIMPIEZA.LIMITE_REGISTROS) {
        resolve(false);
        return;
      }
      
      const registrosAEliminar = totalRegistros - CONFIG_LIMPIEZA.LIMITE_REGISTROS + CONFIG_LIMPIEZA.LOTE_ELIMINACION;
      
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
// ESTADO DEL SISTEMA - POR USUARIO
// ============================================
let estadosUsuarios = {};

const obtenerOCrearEstadoUsuario = (ID_usuario) => {
  if (!estadosUsuarios[ID_usuario]) {
    estadosUsuarios[ID_usuario] = {
      // Estados críticos (NULL hasta confirmación por MQTT)
      cicloActual: null,        // null hasta recibir 'dia', 'noche', 'diaam'
      estadoMuda: null,         // null hasta recibir 0 o 1
      
      // Control de inicialización
      sistemaInicializado: false,
      
      // Últimos valores (para referencia)
      ultimosValores: {
        tempFria: null,
        tempCaliente: null, 
        humedad: null,
        luzUV: null
      }
    };
  }
  return estadosUsuarios[ID_usuario];
};

// ============================================
// LÍMITES CRÍTICOS - Tu estructura que funciona
// ============================================
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
    normal: { min: 30, max: 50 },    // cuando NO está en muda
    muda:   { min: 50, max: 70 }     // cuando SÍ está en muda
  },
  luz_uv: {
    'dia':   { min: 0,   max: 0   },
    'noche': { min: 0,   max: 0   },
    'diaam': { min: 0.2, max: 1   }
  }
};

// ============================================
// CONTROL DE ÚLTIMOS VALORES CRÍTICOS - POR USUARIO
// ============================================
let ultimosCriticosPorUsuario = {};

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

// ============================================
// BUFFER PARA VALORES NORMALES - POR USUARIO
// ============================================
let buffersPorUsuario = {};

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
// FUNCIÓN PARA EXTRAER ID_USUARIO DEL TÓPICO
// ============================================
const extraerIDUsuario = (topic) => {
  const parts = topic.split('/');
  const userPart = parts[2]; // terrario/sensor/User1 -> User1
  
  if (userPart && userPart.startsWith('User')) {
    const idStr = userPart.replace('User', '');
    const id = parseInt(idStr);
    return isNaN(id) ? 1 : id;
  }
  
  return 1; // Default ID
};

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Verifica si el sistema está completamente inicializado para un usuario
 * @param {number} ID_usuario - ID del usuario
 * @returns {boolean} true si ciclo y muda están definidos
 */
const sistemaEstaInicializado = (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  return estado.cicloActual !== null && estado.estadoMuda !== null;
};

/**
 * Actualiza el estado de inicialización del sistema para un usuario
 * @param {number} ID_usuario - ID del usuario
 */
const verificarInicializacionCompleta = (ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  const anteriorEstado = estado.sistemaInicializado;
  estado.sistemaInicializado = sistemaEstaInicializado(ID_usuario);
  
  // Si se acaba de inicializar completamente
  if (!anteriorEstado && estado.sistemaInicializado) {
    console.log(`✅ SISTEMA COMPLETAMENTE INICIALIZADO para usuario ${ID_usuario}`);
    console.log(`   - Ciclo: ${estado.cicloActual}`);
    console.log(`   - Muda: ${estado.estadoMuda}`);
    console.log("🎯 Evaluaciones críticas ACTIVADAS");
  }
};

// ============================================
// EVALUACIÓN DE LÍMITES CRÍTICOS
// ============================================

/**
 * Evalúa si un valor es crítico - Tu lógica que funciona
 * @param {string} tipoSensor - 'temperatura', 'humedad', 'luz_uv'
 * @param {number} valor - Valor del sensor
 * @param {string|null} zona - 'fria', 'caliente' o null
 * @param {number} ID_usuario - ID del usuario
 * @returns {object} { esCritico: boolean, limites: object, razon: string }
 */
const evaluarValorCritico = (tipoSensor, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  // Verificar si el sistema está inicializado
  if (!sistemaEstaInicializado(ID_usuario)) {
    return {
      esCritico: false,
      limites: null,
      razon: `Sistema no inicializado para usuario ${ID_usuario}`
    };
  }
  
  let limites;
  
  // Obtener límites según el tipo de sensor
  if (tipoSensor === 'temperatura') {
    limites = LIMITES.temperatura[zona][estado.cicloActual];
  } 
  else if (tipoSensor === 'humedad') {
    const estadoMuda = estado.estadoMuda === 1 ? 'muda' : 'normal';
    limites = LIMITES.humedad[estadoMuda];
  }
  else if (tipoSensor === 'luz_uv') {
    limites = LIMITES.luz_uv[estado.cicloActual];
  }
  else {
    return {
      esCritico: false,
      limites: null,
      razon: `Tipo de sensor desconocido: ${tipoSensor}`
    };
  }
  
  // Verificar si está fuera de rango
  const fuera = valor < limites.min || valor > limites.max;
  
  return {
    esCritico: fuera,
    limites: limites,
    razon: fuera ? `Valor ${valor} fuera de rango ${limites.min}-${limites.max}` : "Normal"
  };
};

// ============================================
// REGISTRO EN BASE DE DATOS
// ============================================

/**
 * Registra un valor crítico inmediatamente en la BD
 * @param {string} tipoSensor - Tipo de sensor
 * @param {number} valor - Valor a registrar
 * @param {string|null} zona - Zona (solo para temperatura)
 * @param {number} ID_usuario - ID del usuario
 * @returns {Promise} Promesa de inserción
 */
const registrarValorCriticoEnBD = async (tipoSensor, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  const timestamp = new Date();
  let query, params, tabla, columnaId;
  
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
    query = `INSERT INTO humedad 
             (ID_usuario, Medicion, Marca_tiempo, es_critico, estado_muda, Ciclo) 
             VALUES (?, ?, ?, 1, ?, ?)`;
    params = [ID_usuario, valor, timestamp, estado.estadoMuda, estado.cicloActual];
    
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
      
      // Limpieza FIFO ocasional
      if (Math.random() < 0.05) {
        limpiarTablaFIFO(tabla, columnaId, ID_usuario).catch(err => {
          console.error(`❌ Error en limpieza post-inserción:`, err);
        });
      }
      
      resolve(result);
    });
  });
};

/**
 * Registra un valor normal en la BD
 * @param {string} tipoSensor - Tipo de sensor
 * @param {number} valor - Valor a registrar
 * @param {string|null} zona - Zona (solo para temperatura)
 * @param {object} metadata - Datos adicionales del buffer
 * @returns {Promise} Promesa de inserción
 */
const registrarValorNormalEnBD = async (tipoSensor, valor, zona, metadata) => {
  let query, params, tabla, columnaId;
  
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
    query = `INSERT INTO humedad 
             (ID_usuario, Medicion, Marca_tiempo, es_critico, estado_muda, Ciclo) 
             VALUES (?, ?, ?, 0, ?, ?)`;
    params = [metadata.ID_usuario, valor, metadata.timestamp, metadata.estado_muda, metadata.ciclo];
    
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
      
      // Limpieza FIFO ocasional
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
// GESTIÓN DEL BUFFER DE VALORES NORMALES
// ============================================

/**
 * Almacena un valor normal en el buffer para registro posterior
 * @param {string} tipo - Tipo de sensor
 * @param {number} valor - Valor del sensor
 * @param {string|null} zona - Zona (solo temperatura)
 * @param {number} ID_usuario - ID del usuario
 */
const almacenarEnBuffer = (tipo, valor, zona = null, ID_usuario) => {
  const estado = obtenerOCrearEstadoUsuario(ID_usuario);
  
  // Solo almacenar si el sistema está inicializado
  if (!sistemaEstaInicializado(ID_usuario)) {
    console.log(`⏸️ Buffer omitido (sistema no inicializado): ${tipo} ${zona || ''} = ${valor} (Usuario ${ID_usuario})`);
    return;
  }
  
  const metadata = {
    valor,
    timestamp: new Date(),
    ciclo: estado.cicloActual,
    estado_muda: estado.estadoMuda,
    ID_usuario
  };

  const buffer = obtenerBuffer(ID_usuario);
  
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

/**
 * Procesa y guarda todos los valores normales del buffer para un usuario
 * @param {number} ID_usuario - ID del usuario
 */
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
    
    // Registrar temperatura fría
    if (buffer.temperatura.fria) {
      await registrarValorNormalEnBD('temperatura', 
        buffer.temperatura.fria.valor, 
        'fria',
        buffer.temperatura.fria
      );
      registrosGuardados++;
    }
    
    // Registrar temperatura caliente
    if (buffer.temperatura.caliente) {
      await registrarValorNormalEnBD('temperatura', 
        buffer.temperatura.caliente.valor, 
        'caliente',
        buffer.temperatura.caliente
      );
      registrosGuardados++;
    }
    
    // Registrar humedad
    if (buffer.humedad) {
      await registrarValorNormalEnBD('humedad', 
        buffer.humedad.valor, 
        null,
        buffer.humedad
      );
      registrosGuardados++;
    }
    
    // Registrar luz UV
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
  
  // Limpiar buffer
  buffersPorUsuario[ID_usuario] = {
    temperatura: { fria: null, caliente: null },
    humedad: null,
    luz_uv: null
  };
};

/**
 * Procesa todos los buffers de todos los usuarios activos
 */
const procesarTodosLosBuffers = async () => {
  const usuariosConBuffer = Object.keys(buffersPorUsuario);
  
  for (const ID_usuario of usuariosConBuffer) {
    await procesarBufferNormales(parseInt(ID_usuario));
  }
};

// ============================================
// ACTUALIZACIÓN DE ÚLTIMOS VALORES
// ============================================

/**
 * Actualiza el último valor conocido de un sensor para un usuario
 * @param {string} tipo - Tipo de sensor
 * @param {number} valor - Nuevo valor
 * @param {string|null} zona - Zona (solo temperatura)
 * @param {number} ID_usuario - ID del usuario
 */
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
// FUNCIÓN PRINCIPAL DE PROCESAMIENTO
// ============================================

/**
 * Procesa un sensor recibido por MQTT - FUNCIÓN PRINCIPAL
 * @param {string} topic - Tópico MQTT
 * @param {number} valor - Valor del sensor
 * @param {object} io - Socket.io para notificaciones
 */
const procesarSensor = async (topic, valor, io) => {
  // Extraer ID_USUARIO del tópico
  const ID_usuario = extraerIDUsuario(topic);
  
  const MAPEO_TOPICS = {
    'terrario/zonafria/User1': { tipo: 'temperatura', zona: 'fria' },
    'terrario/zonacaliente/User1': { tipo: 'temperatura', zona: 'caliente' },
    'terrario/humedad/User1': { tipo: 'humedad', zona: null },
    'terrario/uvi/User1': { tipo: 'luz_uv', zona: null }
  };
  
  let sensorInfo = MAPEO_TOPICS[topic];
  if (!sensorInfo) {
    // Mapeo dinámico para cualquier usuario
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
  
  // 1. ACTUALIZAR último valor en memoria
  actualizarUltimoValor(tipo, valor, zona, ID_usuario);
  
  // 2. VERIFICAR si el sistema está inicializado para este usuario
  if (!sistemaEstaInicializado(ID_usuario)) {
    const estado = obtenerOCrearEstadoUsuario(ID_usuario);
    console.log(`⏸️ Sensor recibido pero sistema no inicializado para usuario ${ID_usuario}: ${tipo} ${zona || ''} = ${valor}`);
    console.log(`   Estado actual: ciclo=${estado.cicloActual}, muda=${estado.estadoMuda}`);
    
    // Notificar al frontend que el dato está pendiente
    io.emit("sensor-pendiente", {
      topic,
      valor,
      timestamp: new Date(),
      razon: `Sistema no inicializado para usuario ${ID_usuario}`,
      ID_usuario
    });
    return;
  }
  
  // 3. EVALUAR si es crítico (una sola vez)
  const evaluacion = evaluarValorCritico(tipo, valor, zona, ID_usuario);
  
  if (evaluacion.esCritico) {
    // VERIFICAR UMBRAL DE DIFERENCIA
    const ultimosCriticos = obtenerUltimosCriticos(ID_usuario);
    let ultimoCritico;
    
    if (tipo === 'temperatura') {
      ultimoCritico = ultimosCriticos.temperatura[zona];
    } else if (tipo === 'humedad') {
      ultimoCritico = ultimosCriticos.humedad;
    } else if (tipo === 'luz_uv') {
      ultimoCritico = ultimosCriticos.luz_uv;
    }
    
    // Si hay un valor anterior y la diferencia es menor al umbral, no registrar
    if (ultimoCritico !== null && Math.abs(valor - ultimoCritico) < CONFIG.UMBRAL_CRITICO) {
      console.log(`⏸️ Crítico omitido por umbral para usuario ${ID_usuario}: ${tipo} ${zona || ''} = ${valor} (diferencia: ${Math.abs(valor - ultimoCritico).toFixed(2)})`);
      return;
    }
    
    // Es crítico y cumple umbral: registrar INMEDIATAMENTE
    try {
      await registrarValorCriticoEnBD(tipo, valor, zona, ID_usuario);
      
      // Enviar email de alerta
      const estado = obtenerOCrearEstadoUsuario(ID_usuario);
      await sendCriticalAlert({ 
        tipo_sensor: tipo, 
        zona, 
        valor, 
        limites: evaluacion.limites, 
        usuario: ID_usuario,
        ciclo: estado.cicloActual,
        estado_muda: estado.estadoMuda
      });
      console.log(`📧 Email enviado: ${tipo} ${zona || ''} = ${valor} (Usuario ${ID_usuario})`);
      
      // Actualizar último crítico registrado
      if (tipo === 'temperatura') {
        ultimosCriticos.temperatura[zona] = valor;
      } else if (tipo === 'humedad') {
        ultimosCriticos.humedad = valor;
      } else if (tipo === 'luz_uv') {
        ultimosCriticos.luz_uv = valor;
      }
      
      // ENVIAR NOTIFICACIÓN WebSocket
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
      
      console.log(`🔔 Notificación crítica enviada: ${tipo} ${zona || ''} = ${valor} (Usuario ${ID_usuario})`);
      
      // NOTIFICAR al frontend vía WebSocket (evento adicional)
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
      
    } catch (error) {
      console.error(`❌ Error procesando valor crítico para usuario ${ID_usuario}:`, error);
    }
  } else {
    // No es crítico: ALMACENAR EN BUFFER
    almacenarEnBuffer(tipo, valor, zona, ID_usuario);
    console.log(`✅ Normal para usuario ${ID_usuario}: ${tipo} ${zona || ''} = ${valor} - ${evaluacion.razon}`);
    
    // Emitir datos normales al frontend
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
// CAMBIOS DE ESTADO DEL SISTEMA
// ============================================

/**
 * Cambia el ciclo actual del sistema (GLOBAL para todos los usuarios)
 * @param {string} nuevoCiclo - 'dia', 'noche', 'diaam'
 * @returns {boolean} true si el cambio fue exitoso
 */
const cambiarCiclo = (nuevoCiclo) => {
  // Para simplicidad, aplicamos el ciclo a todos los usuarios
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

/**
 * Cambia el estado de muda del gecko para un usuario específico
 * @param {number} nuevoEstado - 0 (normal) o 1 (mudando)
 * @param {number} ID_usuario - ID del usuario (opcional, si no se proporciona se aplica a todos)
 * @returns {boolean} true si el cambio fue exitoso
 */
const cambiarMuda = (nuevoEstado, ID_usuario = null) => {
  if (ID_usuario) {
    // Cambiar solo para un usuario específico
    const estado = obtenerOCrearEstadoUsuario(ID_usuario);
    const anterior = estado.estadoMuda;
    estado.estadoMuda = nuevoEstado;
    
    if (anterior === null) {
      console.log(`🎯 MUDA INICIALIZADA para usuario ${ID_usuario}: ${nuevoEstado} (${nuevoEstado === 1 ? 'MUDANDO' : 'NORMAL'})`);
    } else {
      console.log(`🦎 MUDA para usuario ${ID_usuario}: ${anterior} → ${nuevoEstado} (${nuevoEstado === 1 ? 'MUDANDO' : 'NORMAL'})`);
    }
    
    verificarInicializacionCompleta(ID_usuario);
  } else {
    // Aplicar a todos los usuarios (para compatibilidad)
    Object.keys(estadosUsuarios).forEach(ID_usuario => {
      cambiarMuda(nuevoEstado, parseInt(ID_usuario));
    });
  }
  
  return true;
};

// ============================================
// GETTERS PÚBLICOS
// ============================================

/**
 * Obtiene el estado completo del sistema (todos los usuarios)
 * @returns {object} Estados de todos los usuarios
 */
const obtenerEstado = () => {
  // Para compatibilidad, devolvemos el estado del primer usuario o uno por defecto
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

/**
 * Obtiene el estado de un usuario específico
 * @param {number} ID_usuario - ID del usuario
 * @returns {object} Estado del usuario
 */
const obtenerEstadoUsuarioEspecifico = (ID_usuario) => {
  return obtenerOCrearEstadoUsuario(ID_usuario);
};

/**
 * Obtiene el contenido actual del buffer de un usuario
 * @param {number} ID_usuario - ID del usuario
 * @returns {object} Buffer de valores normales
 */
const obtenerBufferUsuario = (ID_usuario) => {
  return obtenerBuffer(ID_usuario);
};

// ============================================
// INICIALIZACIÓN DEL SISTEMA
// ============================================

console.log("🔄 Iniciando sistema de registro crítico multiusuario...");
console.log("⚠️  Estados en NULL hasta recibir datos del broker MQTT por usuario");
console.log(`🎯 Umbral crítico: ${CONFIG.UMBRAL_CRITICO}`);

// TIMER para procesar valores normales cada 30 segundos
setInterval(() => {
  procesarTodosLosBuffers();
}, 30000);

// TIMER para limpieza FIFO cada 5 minutos
setTimeout(() => {
  Object.keys(estadosUsuarios).forEach(ID_usuario => {
    ejecutarLimpiezaCompleta(parseInt(ID_usuario));
  });
}, 30000);

setInterval(() => {
  Object.keys(estadosUsuarios).forEach(ID_usuario => {
    ejecutarLimpiezaCompleta(parseInt(ID_usuario));
  });
}, CONFIG_LIMPIEZA.INTERVALO_VERIFICACION);

console.log("⏰ Timer iniciado: valores normales cada 30 segundos");
console.log("✅ Sistema multiusuario listo - Esperando datos del broker...");

// ============================================
// EXPORTACIONES
// ============================================
module.exports = {
  // Funciones principales
  procesarSensor,
  cambiarCiclo,
  cambiarMuda,
  
  // Verificaciones
  evaluarValorCritico,
  sistemaEstaInicializado,
  
  // Getters
  obtenerEstado,
  obtenerEstadoUsuarioEspecifico,
  obtenerBufferUsuario,
  
  // Limpieza FIFO
  ejecutarLimpiezaCompleta,
  limpiarTablaFIFO,
  
  // Utilidades
  extraerIDUsuario,
  
  // Constantes
  Limites: LIMITES
};