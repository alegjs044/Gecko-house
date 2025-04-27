// backend/routes/historial.js
const express = require("express");
const router = express.Router();
const db = require("../db");


router.get("/historial/:tipo", (req, res) => {
  const { tipo } = req.params;

  let query = "";
  if (tipo === "temperatura") {
    query = `
      SELECT 
        Medicion AS medicion, 
        Marca_tiempo AS marca_tiempo, 
        Zona AS zona 
      FROM temperatura 
      ORDER BY Marca_tiempo DESC 
      LIMIT 100
    `;
  } else if (tipo === "humedad") {
    query = `
      SELECT 
        Medicion AS medicion, 
        Marca_tiempo AS marca_tiempo 
      FROM humedad 
      ORDER BY Marca_tiempo DESC 
      LIMIT 100
    `;
  } else if (tipo === "luz_uv") {
    query = `
      SELECT 
        Medicion AS medicion, 
        Marca_tiempo AS marca_tiempo 
      FROM luz_uv 
      ORDER BY Marca_tiempo DESC 
      LIMIT 100
    `;
  } else {
    return res.status(400).json({ error: "Tipo de historial inválido." });
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error(" Error consultando historial:", err);
      return res.status(500).json({ error: "Error en el servidor." });
    }

    if (results.length === 0) {
      return res.json([]); 
    }

    res.json(results);
  });
});

module.exports = router;
