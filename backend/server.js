// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { mqttClient, initMQTT } = require("./mqttClient");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Rutas Express existentes
app.get("/", (req, res) => res.send("Servidor funcionando correctamente!"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/email", require("./routes/email"));
app.use("/api", require("./routes/recuperar"));

require("./autoRecorder");

// WebSocket
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado a WebSocket");

  socket.on("modo", (modo) => mqttClient.publish("terrario/modo", modo));
  socket.on("placa-termica", (temp) => mqttClient.publish("terrario/placa-termica", temp.toString()));
  socket.on("humidificador", (estado) => mqttClient.publish("terrario/humidificador", estado ? "on" : "off"));
  socket.on("muda-piel", (modo) => mqttClient.publish("terrario/muda-piel", modo));
});

// Inicializar conexión MQTT con lógica modularizada
initMQTT(io);




// Servidor HTTP
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor web corriendo en http://localhost:${PORT}`);
});