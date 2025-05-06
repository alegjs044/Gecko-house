
// backend/data.js
const db = require("./db");

let ultimaFria = null;
let ultimaCaliente = null;
let ultimaHumedad = null;
let ultimaLuz = null;

let ID_usuario = null;
const INTERVALO_MS = 1000 * 60 * 120;

const now = () => new Date();

const guardarMedicion = (tabla, valor, zona = null, usuarioId) => {
  if (valor == null) return;


  const finalUsuarioId = usuarioId === 'User1' && ID_usuario ? ID_usuario : usuarioId;

  if (!finalUsuarioId) return;

  let query, params;

  if (tabla === "temperatura") {
    query = "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, ?, ?)";
    params = [finalUsuarioId, valor, zona, now()];
  } else {
    query = `INSERT INTO ${tabla} (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)`;
    params = [finalUsuarioId, valor, now()];
  }

  db.query(query, params, (err) => {
    if (err) console.error("❌ Error al guardar en BD:", err);
  });
};


const actualizarUltimosValores = (fria, caliente, humedad, luz, usuarioId) => {
  ID_usuario = usuarioId;
  if (typeof fria === "number") ultimaFria = fria;
  if (typeof caliente === "number") ultimaCaliente = caliente;
  if (typeof humedad === "number") ultimaHumedad = humedad;
  if (typeof luz === "number") ultimaLuz = luz;
};

setInterval(() => {
  if (!ID_usuario) return;

  if (ultimaFria !== null) guardarMedicion("temperatura", ultimaFria, "fría", ID_usuario);
  if (ultimaCaliente !== null) guardarMedicion("temperatura", ultimaCaliente, "caliente", ID_usuario);
  if (ultimaHumedad !== null) guardarMedicion("humedad", ultimaHumedad, null, ID_usuario);
  if (ultimaLuz !== null) guardarMedicion("luz_uv", ultimaLuz, null, ID_usuario);

  console.log("✅ Registro automático guardado en BD");
}, INTERVALO_MS);

const guardarDatoCritico = (tabla, valor, zona = null, usuarioId) => {
  guardarMedicion(tabla, valor, zona, usuarioId);
};

module.exports = { actualizarUltimosValores, guardarDatoCritico };
