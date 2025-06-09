// backend/controllers/alertsController.js
const db = require("../db");
const axios = require("axios");

/**
 * Procesa una alerta enviando un correo si el valor excede los límites,
 * pero no guarda nada en tablas de notificaciones (solo se usa la tabla de temperatura).
 * @param {string} tipo - Tipo de medición (temperatura, humedad, luz_uv)
 * @param {string} descripcion - Descripción del evento
 * @param {number} valor - Valor medido
 */


const procesarAlerta = async (tipo, descripcion, valor, ciclo, muda, zonaSensor) => {
  try {
    await axios.post("http://localhost:5000/api/email/send-email", {
      tipo,
      descripcion,
      valor,
      ciclo,
      muda,
      zona: zonaSensor  // ✅ usar el parámetro recibido correctamente
    });

    console.log(`📢 Alerta de ${tipo} enviada con zona ${zonaSensor}`);
  } catch (err) {
    console.error("❌ Error al procesar alerta:", err.message);
  }
};

module.exports = { procesarAlerta };