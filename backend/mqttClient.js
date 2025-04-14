const mqtt = require("mqtt");
const db = require("./db");
const { procesarAlerta } = require("./Controllers/alertasNotificaciones");

const mqttClient = mqtt.connect("mqtts://d0e185c9110d4506b80ae6e164aaf93e.s1.eu.hivemq.cloud:8883", {
  username: "Gecko_House",
  password: "Gecko_House1",
});

const TOPICS = [
  "terrario/zonafria",
  "terrario/zonacaliente",
  "terrario/humedad",
  "terrario/iluminacion",
];

const ID_usuario = 1;
let ultimoValorFria = null;
let ultimoValorCaliente = null;

const limitesSistema = {
  "terrario/zonafria": { bajo: 22, alto: 32 },
  "terrario/zonacaliente": { bajo: 24, alto: 36 },
};

const shouldSave = (anterior, actual, limites, umbral = 0.5) => {
  if (actual > limites.alto || actual < limites.bajo) return true;
  if (anterior === null) return true;
  return Math.abs(actual - anterior) >= umbral;
};

mqttClient.on("connect", () => {
  console.log("✅ Conectado a HiveMQ");
  mqttClient.subscribe(TOPICS);
});

const handleMessage = async (topic, message, io) => {
  const valor = parseFloat(message.toString());
  const now = new Date();

  if (!limitesSistema[topic] || isNaN(valor)) return;

  const limites = limitesSistema[topic];

  if (topic === "terrario/zonafria") {
    if (shouldSave(ultimoValorFria, valor, limites)) {
      ultimoValorFria = valor;
      db.query(
        "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, 'fría', ?)",
        [ID_usuario, valor, now]
      );

      if (valor < limites.bajo || valor > limites.alto) {
        const descripcion = valor > limites.alto
          ? `⚠️ La temperatura excedió ${limites.alto}°C. Actual: ${valor}°C`
          : `⚠️ La temperatura bajó de ${limites.bajo}°C. Actual: ${valor}°C`;
        await procesarAlerta("temperatura", descripcion, valor);
      }
    }
  }

  if (topic === "terrario/zonacaliente") {
    if (shouldSave(ultimoValorCaliente, valor, limites)) {
      ultimoValorCaliente = valor;
      db.query(
        "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, 'caliente', ?)",
        [ID_usuario, valor, now]
      );

      if (valor < limites.bajo || valor > limites.alto) {
        const descripcion = valor > limites.alto
          ? `⚠️ La temperatura excedió ${limites.alto}°C. Actual: ${valor}°C`
          : `⚠️ La temperatura bajó de ${limites.bajo}°C. Actual: ${valor}°C`;
        await procesarAlerta("temperatura", descripcion, valor);
      }
    }
  }
  const { actualizarUltimosValores } = require("./autoRecorder");

  actualizarUltimosValores(valor, null); // para zona fría
  actualizarUltimosValores(null, valor); // para zona caliente
  
  // Emitir al frontend vía WebSocket
  io.emit("sensor-data", {
    topic,
    valor,
    timestamp: now,
    zona: topic.includes("fria") ? "fría" : "caliente",
  });
};

const initMQTT = (io) => {
  mqttClient.on("message", (topic, message) => handleMessage(topic, message, io));
};

module.exports = { mqttClient, initMQTT };
