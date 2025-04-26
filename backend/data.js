// backend/data.js
const db = require("./db");

let ultimaFria = null;
let ultimaCaliente = null;
let ultimaHumedad = null;
let ultimaLuz = null;

const ID_usuario = 1;
const INTERVALO_MS = 1000 * 60 * 120; // 2 horas

const actualizarUltimosValores = (fria, caliente, humedad, luz) => {
  if (typeof fria === "number") ultimaFria = fria;
  if (typeof caliente === "number") ultimaCaliente = caliente;
  if (typeof humedad === "number") ultimaHumedad = humedad;
  if (typeof luz === "number") ultimaLuz = luz;
};

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

  if (ultimaHumedad !== null) {
    db.query(
      "INSERT INTO humedad (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)",
      [ID_usuario, ultimaHumedad, now]
    );
  }

  if (ultimaLuz !== null) {
    db.query(
      "INSERT INTO luz_uv (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)",
      [ID_usuario, ultimaLuz, now]
    );
  }

  console.log("Registro automático guardado en BD");
}, INTERVALO_MS);

module.exports = { actualizarUltimosValores };
