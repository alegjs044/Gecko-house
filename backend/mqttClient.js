// backend/mqttClient.js (VERSIÓN ADAPTADA)
const mqtt = require("mqtt");
const db = require("./db");
const { procesarAlerta } = require("./Controllers/alertasNotificaciones");
const { actualizarUltimosValores, guardarDatoCritico } = require("./data");

const mqttClient = mqtt.connect("mqtts://d0e185c9110d4506b80ae6e164aaf93e.s1.eu.hivemq.cloud:8883", {
  username: "Gecko_House",
  password: "Gecko_House1",
});

let estadoUV = false;

const limitesSistema = {
  zonafria: { bajo: 22, alto: 32 },
  zonacaliente: { bajo: 24, alto: 36 },
  humedad: { bajo: 30, alto: 50 },
};

const shouldSave = (anterior, actual, limites, umbral = 0.5) => {
  if (actual > limites.alto || actual < limites.bajo) return true;
  if (anterior === null) return true;
  return Math.abs(actual - anterior) >= umbral;
};

mqttClient.on("connect", () => {
  console.log("✅ Conectado a HiveMQ");
  mqttClient.subscribe("terrario/+/+"); 
});

const handleMessage = async (topic, message, io) => {
  const valor = parseFloat(message.toString());
  const now = new Date();
  const [_, zona, ID_usuario] = topic.split("/");

  if (zona === "uvi") {
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

  const limites = limitesSistema[zona];
  if (!limites) return; // zona no controlada

  if (zona === "zonafria") {
    if (shouldSave(null, valor, limites)) {
      actualizarUltimosValores(valor, null, null, null, ID_usuario);
      if (valor < limites.bajo || valor > limites.alto) {
        guardarDatoCritico("temperatura", valor, "fría", ID_usuario);
        await procesarAlerta("temperatura", `⚠️ Temperatura fuera de rango zona fría: ${valor}°C`, valor);
      }
    }
  }

  if (zona === "zonacaliente") {
    if (shouldSave(null, valor, limites)) {
      actualizarUltimosValores(null, valor, null, null, ID_usuario);
      if (valor < limites.bajo || valor > limites.alto) {
        guardarDatoCritico("temperatura", valor, "caliente", ID_usuario);
        await procesarAlerta("temperatura", `⚠️ Temperatura fuera de rango zona caliente: ${valor}°C`, valor);
      }
    }
  }

  if (zona === "humedad") {
    if (shouldSave(null, valor, limites)) {
      actualizarUltimosValores(null, null, valor, null, ID_usuario);
      if (valor < limites.bajo || valor > limites.alto) {
        guardarDatoCritico("humedad", valor, null, ID_usuario);
        await procesarAlerta("humedad", `⚠️ Humedad fuera de rango: ${valor}%`, valor);
      }
    }
  }

  if (zona === "luminosidad") {
    actualizarUltimosValores(null, null, null, valor, ID_usuario);
  }

  io.emit("sensor-data", {
    topic,
    valor,
    timestamp: now,
    zona,
    ID_usuario,
  });
};

const initMQTT = (io) => {
  mqttClient.on("message", (topic, message) => handleMessage(topic, message, io));
};

module.exports = { mqttClient, initMQTT };
