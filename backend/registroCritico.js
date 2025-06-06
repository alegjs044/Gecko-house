const db = require("./db");
const { sendCriticalAlert } = require('./controllers/SendEmail');
const util = require("util");
const { Limites } = require("./Const/Limites");
const dbQuery = util.promisify(db.query).bind(db);

const CONFIG = {
  UMBRAL_CRITICO: 0.2,
  INTERVALO_BUFFER: 30000,
  INTERVALO_LIMPIEZA: 300000,
  LIMITE_REGISTROS: 500,
  LOTE_ELIMINACION: 1
};

let estado = {
  ciclo: null,
  muda: null,
  inicializado: false,
  ultimos: { tempFria: null, tempCaliente: null, humedad: null, luzUV: null }
};

let criticos = { temperatura: { fria: null, caliente: null }, humedad: null, luz_uv: null };
let buffer = { temperatura: { fria: null, caliente: null }, humedad: null, luz_uv: null };

// ✅ FUNCIÓN PARA EXTRAER ID_USUARIO DEL TÓPICO
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

const getLimites = (tipo, zona) => {
  if (tipo === "temperatura") return Limites.temperatura[zona][estado.ciclo];
  if (tipo === "humedad") return Limites.humedad[estado.muda ? "muda" : "normal"];
  if (tipo === "luz_uv") return Limites.luz_uv[estado.ciclo];
  return null;
};

const estaInicializado = () => estado.ciclo !== null && estado.muda !== null;

const verificarInicializacion = () => {
  if (!estado.inicializado && estaInicializado()) {
    estado.inicializado = true;
    console.log("✅ SISTEMA INICIALIZADO");
  }
};

// ✅ FUNCIÓN CORREGIDA PARA INSERTAR CON ID_USUARIO
const insertarRegistro = async (tabla, campos, valores) => {
  try {
    const query = `INSERT INTO ${tabla} (${campos.join(",")}) VALUES (${campos.map(() => "?").join(",")})`;
    await dbQuery(query, valores);
    console.log(`✅ Registro insertado en ${tabla} para usuario ${valores[0]}`);
  } catch (error) {
    console.error(`❌ Error insertando en ${tabla}:`, error.message);
    throw error;
  }
};

// ✅ FUNCIÓN DE LIMPIEZA CORREGIDA
const limpiarTabla = async (tabla, columnaId) => {
  try {
    if (!tabla || !columnaId) {
      console.error("❌ limpiarTabla: Parámetros inválidos", { tabla, columnaId });
      return;
    }

    const result = await dbQuery(`SELECT COUNT(*) as total FROM ${tabla}`);
    const total = parseInt(result[0].total);
    
    if (isNaN(total) || total <= 0) {
      console.log(`⚠️ ${tabla}: Total de registros inválido (${total})`);
      return;
    }

    if (total <= CONFIG.LIMITE_REGISTROS) {
      console.log(`✅ ${tabla}: ${total} registros (dentro del límite)`);
      return;
    }

    const cantidad = total - CONFIG.LIMITE_REGISTROS + CONFIG.LOTE_ELIMINACION;
    
    if (isNaN(cantidad) || cantidad <= 0) {
      console.error(`❌ ${tabla}: Cantidad a eliminar inválida (${cantidad})`);
      return;
    }

    const deleteResult = await dbQuery(`
      DELETE FROM ${tabla} 
      WHERE ${columnaId} IN (
        SELECT ${columnaId} FROM (
          SELECT ${columnaId} 
          FROM ${tabla} 
          ORDER BY Marca_tiempo ASC 
          LIMIT ?
        ) AS temp
      )`, [cantidad]);

    console.log(`🗑️ ${tabla}: Eliminados ${deleteResult.affectedRows} registros antiguos (${total} -> ${total - deleteResult.affectedRows})`);
    
  } catch (error) {
    console.error(`❌ Error limpiando tabla ${tabla}:`, error.message);
  }
};

const evaluarCritico = (tipo, valor, zona = null) => {
  if (!estaInicializado()) return { esCritico: false };
  const limites = getLimites(tipo, zona);
  if (!limites) return { esCritico: false };
  const fuera = valor < limites.min || valor > limites.max;
  return { esCritico: fuera, limites };
};

const actualizarUltimo = (tipo, valor, zona = null) => {
  if (tipo === "temperatura") estado.ultimos[zona === "fria" ? "tempFria" : "tempCaliente"] = valor;
  else estado.ultimos[tipo] = valor;
};

// ✅ FUNCIÓN CORREGIDA PARA GUARDAR CRÍTICOS CON ID_USUARIO
const guardarCritico = async (tipo, valor, zona = null, ID_usuario = 1) => {
  const timestamp = new Date();
  const tabla = tipo;
  const columnaId = `ID_${tipo}`;
  
  // ✅ SIEMPRE INCLUIR ID_usuario COMO PRIMER CAMPO
  const campos = ["ID_usuario", "Medicion", "Marca_tiempo", "es_critico"];
  const valores = [ID_usuario, valor, timestamp, 1];

  if (tipo === "temperatura") {
    campos.push("Zona", "Ciclo");
    valores.push(zona, estado.ciclo);
  } else if (tipo === "humedad") {
    campos.push("estado_muda", "Ciclo");
    valores.push(estado.muda, estado.ciclo);
  } else {
    campos.push("Ciclo");
    valores.push(estado.ciclo);
  }

  await insertarRegistro(tabla, campos, valores);
  
  // Limpieza ocasional con manejo de errores
  if (Math.random() < 0.05) {
    limpiarTabla(tabla, columnaId).catch(err => 
      console.error(`❌ Error en limpieza automática de ${tabla}:`, err.message)
    );
  }
};

// ✅ FUNCIÓN CORREGIDA PARA GUARDAR NORMALES CON ID_USUARIO
const guardarNormal = async (tipo, zona, metadata) => {
  const tabla = tipo;
  const columnaId = `ID_${tipo}`;
  
  // ✅ SIEMPRE INCLUIR ID_usuario COMO PRIMER CAMPO
  const campos = ["ID_usuario", "Medicion", "Marca_tiempo", "es_critico"];
  const valores = [metadata.ID_usuario || 1, metadata.valor, metadata.timestamp, 0];

  if (tipo === "temperatura") {
    campos.push("Zona", "Ciclo");
    valores.push(zona, metadata.ciclo);
  } else if (tipo === "humedad") {
    campos.push("estado_muda", "Ciclo");
    valores.push(metadata.estado_muda, metadata.ciclo);
  } else {
    campos.push("Ciclo");
    valores.push(metadata.ciclo);
  }

  await insertarRegistro(tabla, campos, valores);
  
  // Limpieza ocasional con manejo de errores
  if (Math.random() < 0.02) {
    limpiarTabla(tabla, columnaId).catch(err => 
      console.error(`❌ Error en limpieza automática de ${tabla}:`, err.message)
    );
  }
};

const procesarBuffer = async () => {
  if (!estaInicializado()) return;
  
  try {
    for (let tipo of ["temperatura", "humedad", "luz_uv"]) {
      if (tipo === "temperatura") {
        for (let zona of ["fria", "caliente"]) {
          const meta = buffer.temperatura[zona];
          if (meta) await guardarNormal("temperatura", zona, meta);
        }
      } else {
        const meta = buffer[tipo];
        if (meta) await guardarNormal(tipo, null, meta);
      }
    }
    
    // Limpiar buffer después del procesamiento
    buffer = { temperatura: { fria: null, caliente: null }, humedad: null, luz_uv: null };
    
  } catch (error) {
    console.error("❌ Error procesando buffer:", error.message);
  }
};

// ✅ FUNCIÓN CORREGIDA PARA ALMACENAR EN BUFFER CON ID_USUARIO
const almacenarBuffer = (tipo, valor, zona = null, ID_usuario = 1) => {
  if (!estaInicializado()) return;
  const meta = {
    valor,
    timestamp: new Date(),
    ciclo: estado.ciclo,
    estado_muda: estado.muda,
    ID_usuario
  };
  if (tipo === "temperatura") buffer.temperatura[zona] = meta;
  else buffer[tipo] = meta;
};

// ✅ FUNCIÓN PRINCIPAL CORREGIDA CON ID_USUARIO
const procesarSensor = async (topic, valor, io) => {
  // ✅ EXTRAER ID_USUARIO DEL TÓPICO
  const ID_usuario = extraerIDUsuario(topic);
  
  const MAPEO = {
    'terrario/zonafria/User1': { tipo: 'temperatura', zona: 'fria' },
    'terrario/zonacaliente/User1': { tipo: 'temperatura', zona: 'caliente' },
    'terrario/humedad/User1': { tipo: 'humedad', zona: null },
    'terrario/uvi/User1': { tipo: 'luz_uv', zona: null }
  };

  // ✅ MAPEO DINÁMICO PARA CUALQUIER USUARIO
  let sensor = MAPEO[topic];
  if (!sensor) {
    // Intentar mapeo dinámico
    if (topic.includes('zonafria')) {
      sensor = { tipo: 'temperatura', zona: 'fria' };
    } else if (topic.includes('zonacaliente')) {
      sensor = { tipo: 'temperatura', zona: 'caliente' };
    } else if (topic.includes('humedad')) {
      sensor = { tipo: 'humedad', zona: null };
    } else if (topic.includes('uvi')) {
      sensor = { tipo: 'luz_uv', zona: null };
    }
  }

  if (!sensor) {
    console.log(`⚠️ Sensor no reconocido para topic: ${topic}`);
    return;
  }
  
  const { tipo, zona } = sensor;
  actualizarUltimo(tipo, valor, zona);

  if (!estaInicializado()) {
    io.emit("sensor-pendiente", { topic, valor, timestamp: new Date(), ID_usuario });
    return;
  }

  const eval = evaluarCritico(tipo, valor, zona);
  if (eval.esCritico) {
    const ultimo = tipo === "temperatura" ? criticos.temperatura[zona] : criticos[tipo];
    if (ultimo !== null && Math.abs(valor - ultimo) < CONFIG.UMBRAL_CRITICO) return;
    
    try {
      // ✅ PASAR ID_USUARIO A FUNCIÓN DE GUARDAR
      await guardarCritico(tipo, valor, zona, ID_usuario);
      await sendCriticalAlert({ tipo_sensor: tipo, zona, valor, limites: eval.limites, usuario: ID_usuario });

      
      if (tipo === "temperatura") criticos.temperatura[zona] = valor;
      else criticos[tipo] = valor;
      
      io.emit("valor-critico", { 
        tipo, zona, valor, 
        timestamp: new Date(), 
        ciclo: estado.ciclo, 
        estado_muda: estado.muda,
        ID_usuario
      });
    } catch (error) {
      console.error(`❌ Error guardando valor crítico para ${tipo}:`, error.message);
    }
  } else {
    // ✅ PASAR ID_USUARIO A FUNCIÓN DE BUFFER
    almacenarBuffer(tipo, valor, zona, ID_usuario);
  }
};

const cambiarCiclo = (nuevo) => { estado.ciclo = nuevo; verificarInicializacion(); };
const cambiarMuda = (nuevo) => { estado.muda = nuevo; verificarInicializacion(); };

// Intervalos con manejo de errores mejorado
setInterval(() => {
  procesarBuffer().catch(err => 
    console.error("❌ Error en procesamiento periódico del buffer:", err.message)
  );
}, CONFIG.INTERVALO_BUFFER);

setInterval(() => {
  const tablas = [
    { nombre: 'temperatura', id: 'ID_temperatura' },
    { nombre: 'humedad', id: 'ID_humedad' },
    { nombre: 'luz_uv', id: 'ID_luz_uv' }
  ];
  
  tablas.forEach(t => {
    limpiarTabla(t.nombre, t.id).catch(err => 
      console.error(`❌ Error en limpieza periódica de ${t.nombre}:`, err.message)
    );
  });
}, CONFIG.INTERVALO_LIMPIEZA);

module.exports = {
  procesarSensor,
  cambiarCiclo,
  cambiarMuda,
  obtenerEstado: () => estado,
  obtenerBuffer: () => buffer,
  sistemaInicializado: estaInicializado,
  limpiarTabla,
  extraerIDUsuario
};