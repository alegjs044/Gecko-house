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
app.use("/api/dev", require("./routes/dev"));

require("./data");

// ✅ Iniciar MQTT una vez
initMQTT(io);

// Mapa de sockets conectados con su ID_usuario
const socketToUserMap = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado a WebSocket");

  const id_usuario = socket.handshake.auth?.ID_usuario;
  if (id_usuario) {
    socketToUserMap.set(socket.id, id_usuario);
  }

  // 👉 ESCUCHAR eventos del cliente AQUÍ dentro
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

  socket.on("disconnect", () => {
    socketToUserMap.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor web corriendo en http://localhost:${PORT}`);
});
