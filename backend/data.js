// backend/autoRecorder.js
const db = require("./db");

// Últimos valores guardados (de mqttClient.js)
let ultimaFria = null;
let ultimaCaliente = null;

const ID_usuario = 1;
const INTERVALO_MS = 1000 * 60 * 120; // 2 horas

// Esta función debe ser llamada por mqttClient para mantener los valores
const actualizarUltimosValores = (fria, caliente) => {
  if (typeof fria === "number") ultimaFria = fria;
  if (typeof caliente === "number") ultimaCaliente = caliente;
};

// Guardar cada 2 horas
setInterval(() => {
  const now = new Date();

  if (ultimaFria !== null) {
    db.query(
      "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, 'fría', ?)",
      [ID_usuario, ultimaFria, now]
    );
  }

  if (ultimaCaliente !== null) {
    db.query(
      "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, 'caliente', ?)",
      [ID_usuario, ultimaCaliente, now]
    );
  }

  console.log("🔹 Registro programado guardado en BD");
}, INTERVALO_MS);

module.exports = { actualizarUltimosValores };
