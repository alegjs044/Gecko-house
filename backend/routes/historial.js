const express = require("express");
const router = express.Router();
const db = require("../db");
const { obtenerEstado } = require("../registroCritico");
const { Limites } = require("../Const/Limites");

// Consultas SQL por tipo de sensor
const CONSULTA_HISTORIAL_COMPLETO = {
  temperatura: `
    SELECT ID_temperatura AS id, Medicion AS medicion, Marca_tiempo AS marca_tiempo, Zona AS zona, es_critico, Ciclo AS ciclo
    FROM temperatura
    WHERE ID_usuario = ?
    ORDER BY Marca_tiempo DESC
    LIMIT 1000
  `,
  humedad: `
    SELECT ID_humedad AS id, Medicion AS medicion, Marca_tiempo AS marca_tiempo, es_critico, estado_muda, Ciclo AS ciclo
    FROM humedad
    WHERE ID_usuario = ?
    ORDER BY Marca_tiempo DESC
    LIMIT 1000
  `,
  luz_uv: `
    SELECT ID_luz_uv AS id, Medicion AS medicion, Marca_tiempo AS marca_tiempo, es_critico, Ciclo AS ciclo
    FROM luz_uv
    WHERE ID_usuario = ?
    ORDER BY Marca_tiempo DESC
    LIMIT 1000
  `,
};

const esTipoValido = (tipo) => ['temperatura', 'humedad', 'luz_uv'].includes(tipo);

const obtenerColumnaID = (tipo) => {
  const map = {
    temperatura: 'ID_temperatura',
    humedad: 'ID_humedad',
    luz_uv: 'ID_luz_uv'
  };
  return map[tipo];
};

const procesarResultados = (resultados) => {
  return resultados.map((item) => ({
    ...item,
    es_critico: item.es_critico === 1,
    estado_muda: item.estado_muda === 1
  }));
};

// ✅ RUTA PARA HISTORIAL (CORREGIDA CON NUEVO DB)
router.get("/historial/:tipo", async (req, res) => {
  const tipo = req.params.tipo;
  const ID_usuario = req.query.ID_usuario;

  console.log(`📊 Solicitando historial de ${tipo} para usuario ${ID_usuario}`);

  if (!esTipoValido(tipo)) {
    console.log('❌ Tipo inválido:', tipo);
    return res.status(400).json({ error: "Tipo inválido" });
  }
  
  if (!ID_usuario) {
    console.log('❌ Falta ID_usuario');
    return res.status(400).json({ error: "Falta ID_usuario" });
  }

  try {
    // ✅ USAR EL NUEVO MÉTODO executeQuery
    const resultados = await db.executeQuery(CONSULTA_HISTORIAL_COMPLETO[tipo], [ID_usuario]);
    
    console.log(`📊 Historial ${tipo}: ${resultados.length} registros encontrados`);
    
    res.json(procesarResultados(resultados));
  } catch (error) {
    console.error(`❌ Error obteniendo historial ${tipo}:`, error.message);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// ✅ RUTA PARA ELIMINAR REGISTROS (CORREGIDA)
router.delete("/historial/:tipo/registros", async (req, res) => {
  const tipo = req.params.tipo;
  const ids = req.body.ids;
  const ID_usuario = req.query.ID_usuario;

  if (!esTipoValido(tipo)) return res.status(400).json({ error: "Tipo inválido" });
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "Se requiere un array de IDs." });
  if (!ID_usuario) return res.status(400).json({ error: "Falta ID_usuario" });

  try {
    const columnaID = obtenerColumnaID(tipo);
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM ${tipo} WHERE ${columnaID} IN (${placeholders}) AND ID_usuario = ?`;

    // ✅ USAR EL NUEVO MÉTODO executeQuery
    const result = await db.executeQuery(query, [...ids, ID_usuario]);
    
    res.json({ success: true, deletedCount: result.affectedRows });
  } catch (error) {
    console.error('❌ Error eliminando registros:', error.message);
    res.status(500).json({ error: "Error eliminando registros." });
  }
});

// ✅ NUEVA RUTA PARA DASHBOARD (datos para gráficas)
router.get("/dashboard/:ID_usuario", async (req, res) => {
  const ID_usuario = req.params.ID_usuario;
  
  console.log(`📊 Solicitando datos de dashboard para usuario ${ID_usuario}`);

  try {
    // Obtener últimos 50 registros de cada sensor
    const [temperaturaFria, temperaturaCaliente, humedad, luminosidad, uvData] = await Promise.all([
      // Temperatura zona fría
      db.executeQuery(`
        SELECT Medicion as valor, Marca_tiempo as timestamp 
        FROM temperatura 
        WHERE ID_usuario = ? AND Zona = 'fria' 
        ORDER BY Marca_tiempo DESC 
        LIMIT 50
      `, [ID_usuario]),
      
      // Temperatura zona caliente
      db.executeQuery(`
        SELECT Medicion as valor, Marca_tiempo as timestamp 
        FROM temperatura 
        WHERE ID_usuario = ? AND Zona = 'caliente' 
        ORDER BY Marca_tiempo DESC 
        LIMIT 50
      `, [ID_usuario]),
      
      // Humedad
      db.executeQuery(`
        SELECT Medicion as valor, Marca_tiempo as timestamp 
        FROM humedad 
        WHERE ID_usuario = ? 
        ORDER BY Marca_tiempo DESC 
        LIMIT 50
      `, [ID_usuario]),
      
      // Buscar tabla de luminosidad (puede no existir)
      db.executeQuery(`
        SELECT Medicion as valor, Marca_tiempo as timestamp 
        FROM luminosidad 
        WHERE ID_usuario = ? 
        ORDER BY Marca_tiempo DESC 
        LIMIT 50
      `, [ID_usuario]).catch(() => []), // Si no existe la tabla, devolver array vacío
      
      // Luz UV
      db.executeQuery(`
        SELECT Medicion as valor, Marca_tiempo as timestamp 
        FROM luz_uv 
        WHERE ID_usuario = ? 
        ORDER BY Marca_tiempo DESC 
        LIMIT 50
      `, [ID_usuario])
    ]);

    console.log(`📊 Datos encontrados:`, {
      temperaturaFria: temperaturaFria.length,
      temperaturaCaliente: temperaturaCaliente.length,
      humedad: humedad.length,
      luminosidad: luminosidad.length,
      uvData: uvData.length
    });

    res.json({
      fria: temperaturaFria.map(r => parseFloat(r.valor)),
      caliente: temperaturaCaliente.map(r => parseFloat(r.valor)),
      humedad: humedad.map(r => parseFloat(r.valor)),
      luminosidad: luminosidad.map(r => parseFloat(r.valor)),
      uv: uvData.map(r => parseFloat(r.valor))
    });

  } catch (error) {
    console.error('❌ Error obteniendo datos de dashboard:', error.message);
    
    // Si no hay datos, devolver arrays vacíos
    res.json({
      fria: [],
      caliente: [],
      humedad: [],
      luminosidad: [],
      uv: []
    });
  }
});

// ✅ RUTA PARA LÍMITES (CORREGIDA)
router.get("/limites", (req, res) => {
  try {
    const estado = obtenerEstado();
    
    console.log('🔍 Estado del sistema:', {
      inicializado: estado.inicializado,
      ciclo: estado.ciclo,
      muda: estado.muda
    });

    // Si el sistema no está inicializado, usar valores por defecto
    const ciclo = estado.ciclo || 'dia';
    const muda = estado.muda !== null ? estado.muda : false;

    const limites = {
      ciclo,
      estado_muda: muda,
      temperatura: {
        fria: Limites.zonafria[ciclo],
        caliente: Limites.zonacaliente[ciclo],
      },
      humedad: muda ? Limites.humedad.muda : Limites.humedad.normal,
      luz_uv: Limites.uvi[ciclo]
    };

    console.log('📊 Límites enviados:', limites);
    res.json(limites);
    
  } catch (error) {
    console.error('❌ Error obteniendo límites:', error.message);
    
    // Límites por defecto si hay error
    res.json({
      ciclo: 'dia',
      estado_muda: false,
      temperatura: {
        fria: { min: 26, max: 28 },
        caliente: { min: 30, max: 35 }
      },
      humedad: { min: 30, max: 50 },
      luz_uv: { min: 0, max: 1 }
    });
  }
});

module.exports = router;