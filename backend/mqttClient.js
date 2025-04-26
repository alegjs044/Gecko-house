const mqtt = require("mqtt");
const db = require("./db");
const { procesarAlerta } = require("./Controllers/alertasNotificaciones");
const { actualizarUltimosValores } = require("./data");

const mqttClient = mqtt.connect("mqtts://d0e185c9110d4506b80ae6e164aaf93e.s1.eu.hivemq.cloud:8883", {
  username: "Gecko_House",
  password: "Gecko_House1",
});

const TOPICS = [
  "terrario/zonafria/User1",
  "terrario/zonacaliente/User1",
  "terrario/humedad/User1",
  "terrario/luminosidad/User1",
  "terrario/uvi/User1",
  "terrario/ciclo/User1"
];

const ID_usuario = 1;
let ultimoValorFria = null;
let ultimoValorCaliente = null;
let ultimoValorHumedad = null;
let ultimoValorLuz = null;
let estadoUV = false;

const limitesSistema = {
  "terrario/zonafria/User1": { bajo: 22, alto: 32 },
  "terrario/zonacaliente/User1": { bajo: 24, alto: 36 },
  "terrario/humedad/User1": { bajo: 30, alto: 50 },
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

  if (topic === "terrario/uvi/User1") {
    const isUVOn = message.toString().toLowerCase() === "encendido";
    if (isUVOn !== estadoUV) {
      estadoUV = isUVOn;
      db.query(
        "INSERT INTO luz_uv (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)",
        [ID_usuario, isUVOn ? 1 : 0, now]
      );
    }
    return;
  }

  const limites = limitesSistema[topic];

  if (topic === "terrario/zonafria/User1") {
    if (shouldSave(ultimoValorFria, valor, limites)) {
      ultimoValorFria = valor;
      db.query(
        "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, 'fría', ?)",
        [ID_usuario, valor, now]
      );
      if (valor < limites.bajo || valor > limites.alto) {
        const desc = valor > limites.alto
          ? `⚠️ Temperatura alta zona fría: ${valor}°C`
          : `⚠️ Temperatura baja zona fría: ${valor}°C`;
        await procesarAlerta("temperatura", desc, valor);
      }
    }
  }

  if (topic === "terrario/zonacaliente/User1") {
    if (shouldSave(ultimoValorCaliente, valor, limites)) {
      ultimoValorCaliente = valor;
      db.query(
        "INSERT INTO temperatura (ID_usuario, Medicion, Zona, Marca_tiempo) VALUES (?, ?, 'caliente', ?)",
        [ID_usuario, valor, now]
      );
      if (valor < limites.bajo || valor > limites.alto) {
        const desc = valor > limites.alto
          ? `⚠️ Temperatura alta zona caliente: ${valor}°C`
          : `⚠️ Temperatura baja zona caliente: ${valor}°C`;
        await procesarAlerta("temperatura", desc, valor);
      }
    }
  }

  if (topic === "terrario/humedad/User1") {
    if (shouldSave(ultimoValorHumedad, valor, limites)) {
      ultimoValorHumedad = valor;
      db.query(
        "INSERT INTO humedad (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)",
        [ID_usuario, valor, now]
      );
      if (valor < limites.bajo || valor > limites.alto) {
        const desc = valor > limites.alto
          ? `⚠️ Humedad alta: ${valor}%`
          : `⚠️ Humedad baja: ${valor}%`;
        await procesarAlerta("humedad", desc, valor);
      }
    }
  }

  if (topic === "terrario/luminosidad/User1") {
    ultimoValorLuz = valor;
    db.query(
      "INSERT INTO sensores (ID_usuario, topico, valor, Marca_tiempo) VALUES (?, ?, ?, ?)",
      [ID_usuario, topic, valor, now]
    );
  }

  if (topic === "terrario/ciclo/User1") {
    db.query(
      "INSERT INTO sensores (ID_usuario, topico, valor, Marca_tiempo) VALUES (?, ?, ?, ?)",
      [ID_usuario, topic, message.toString(), now]
    );
  }

  io.emit("sensor-data", {
    topic,
    valor,
    timestamp: now,
    zona: topic.split("/")[1],
  });

  actualizarUltimosValores(
    topic.includes("zonafria") ? valor : null,
    topic.includes("zonacaliente") ? valor : null,
    topic.includes("humedad") ? valor : null,
    topic.includes("luminosidad") ? valor : null
  );
};

const initMQTT = (io) => {
  mqttClient.on("message", (topic, message) => handleMessage(topic, message, io));
};

module.exports = { mqttClient, initMQTT };
