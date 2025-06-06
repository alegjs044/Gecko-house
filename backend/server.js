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

// Rutas
app.get("/", (req, res) => res.send("🦎 Servidor GeckoHouse funcionando correctamente!"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/email", require("./routes/email"));
app.use("/api", require("./routes/recuperar"));
app.use("/api", require("./routes/historial"));
app.use("/api/dev", require("./routes/dev"));
app.use("/api", require("./routes/soporte"));

// Iniciar MQTT
initMQTT(io);

const socketToUserMap = new Map();
const userToSocketMap = new Map();

const sendToSpecificUser = (userId, eventName, data) => {
  const socketId = userToSocketMap.get(parseInt(userId));
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(eventName, data);
      console.log(`📤 Enviado '${eventName}' a usuario ${userId}:`, data);
      return true;
    }
  }
  console.log(`⚠️ Usuario ${userId} no encontrado o desconectado`);
  return false;
};

io.on("connection", (socket) => {
  let id_usuario = socket.handshake.auth?.ID_usuario;
  if (id_usuario && typeof id_usuario === 'string') {
    id_usuario = parseInt(id_usuario);
  }
  console.log(`🟢 Cliente conectado | Socket ID: ${socket.id} | Usuario: ${id_usuario || 'Desconocido'}`);

  if (id_usuario && !isNaN(id_usuario)) {
    if (userToSocketMap.has(id_usuario)) {
      const oldSocketId = userToSocketMap.get(id_usuario);
      socketToUserMap.delete(oldSocketId);
    }
    socketToUserMap.set(socket.id, id_usuario);
    userToSocketMap.set(id_usuario, socket.id);
    socket.emit('user-confirmed', {
      message: 'Usuario identificado correctamente',
      ID_usuario: id_usuario,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  const getMQTTUserId = (id) => `User${parseInt(id) || 1}`;
  const userId = () => socketToUserMap.get(socket.id);
  const idMQTT = () => getMQTTUserId(userId());

  socket.on("placa-termica", (payload) => {
    const value = Math.max(0, Math.min(100, parseInt(payload.temperatura)));
    mqttClient.publish(`terrario/placaP/${idMQTT()}`, value.toString());
    io.emit("actuador-data", { zona: "placaP", valor: value, ID_usuario: userId() });
  });

  socket.on("modo", (valor) => {
    const isManual = valor === "manual";
    mqttClient.publish(`terrario/modo/${idMQTT()}`, isManual ? "1" : "0");
  });

  socket.on("humidificador", (estado) => {
    mqttClient.publish(`terrario/humidificadorP/${idMQTT()}`, estado ? "1" : "0");
    io.emit("actuador-data", { zona: "humidificadorP", valor: estado, ID_usuario: userId() });
  });

  socket.on("control-foco", (estado) => {
    mqttClient.publish(`terrario/focoP/${idMQTT()}`, estado ? "1" : "0");
    io.emit("actuador-data", { zona: "focoP", valor: estado, ID_usuario: userId() });
  });

  socket.on("control-uv", (estado) => {
    mqttClient.publish(`terrario/focouviP/${idMQTT()}`, estado ? "1" : "0");
    io.emit("actuador-data", { zona: "focouviP", valor: estado, ID_usuario: userId() });
  });

  socket.on("disconnect", () => {
    socketToUserMap.delete(socket.id);
    if (id_usuario) userToSocketMap.delete(id_usuario);
    console.log("🔴 Cliente desconectado");
  });
});

const broadcastToAllUsers = (eventName, data) => {
  const connectedUsers = Array.from(userToSocketMap.keys());
  connectedUsers.forEach(userId => {
    sendToSpecificUser(userId, eventName, data);
  });
  return connectedUsers.length;
};

const getServerStats = () => ({
  connectedUsers: userToSocketMap.size,
  totalSockets: io.sockets.sockets.size,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString()
});

app.get("/api/server/stats", (req, res) => res.json(getServerStats()));
app.get("/api/server/users", (req, res) => {
  const users = Array.from(userToSocketMap.keys());
  res.json({ connectedUsers: users, count: users.length, timestamp: new Date().toISOString() });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido. Cerrando servidor...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido. Cerrando servidor...');
  server.close(() => process.exit(0));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 === SERVIDOR GECKOHOUSE INICIADO ===`);
  console.log(`🌐 Servidor web: http://localhost:${PORT}`);
  console.log(`📡 Socket.IO: Puerto ${PORT}`);
  console.log(`🦎 Sistema: Listo para recibir datos de Arduino`);
  console.log(`⏰ Iniciado: ${new Date().toLocaleString('es-ES')}`);
  setInterval(() => {
    const stats = getServerStats();
    console.log(`📊 Estadísticas - Usuarios: ${stats.connectedUsers} | Uptime: ${Math.floor(stats.uptime)}s`);
  }, 300000);
});

module.exports = {
  io,
  sendToSpecificUser,
  broadcastToAllUsers,
  getServerStats,
  socketToUserMap,
  userToSocketMap
};
