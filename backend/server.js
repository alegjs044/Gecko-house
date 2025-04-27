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

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Servidor funcionando correctamente!"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/email", require("./routes/email"));
app.use("/api", require("./routes/recuperar"));
app.use("/api", require("./routes/historial"));

require("./data");

// 🔥 Iniciar MQTT **una sola vez** al levantar el server
initMQTT(io);

io.on("connection", (socket) => {
  const ID_usuario = socket.handshake.auth.ID_usuario;
  console.log("🟢 Cliente conectado a WebSocket | ID_usuario:", ID_usuario ?? "No enviado");

  // 🔥 Aquí solo se escucha eventos del cliente
  socket.on("placa-termica", (payload) => {
    const value = Math.max(0, Math.min(100, parseInt(payload.temperatura)));
    mqttClient.publish("terrario/placa-termica/User1", value.toString());
  });

  socket.on("humidificador", (estado) => {
    mqttClient.publish("terrario/humidificador/User1", estado ? "on" : "off");
  });

  socket.on("iluminacion", (estado) => {
    mqttClient.publish("terrario/iluminacion/User1", estado ? "on" : "off");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor web corriendo en http://localhost:${PORT}`);
});
