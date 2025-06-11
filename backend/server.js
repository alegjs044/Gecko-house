require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { mqttClient, initMQTT } = require("./mqttClient");

const DEBUG_MODE = process.env.DEBUG_MODE === "true";
const log = {
  info: (...args) => DEBUG_MODE && console.info("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};

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

// Rutas
app.get("/", (req, res) => res.send("🦎 Servidor GeckoHouse funcionando correctamente!"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/email", require("./routes/email"));
app.use("/api", require("./routes/recuperar"));
app.use("/api", require("./routes/historial"));
app.use("/api/dev", require("./routes/dev"));
app.use("/api", require("./routes/soporte"));

const socketToUserMap = new Map();
const userToSocketMap = new Map();

initMQTT(io, socketToUserMap, userToSocketMap);

const sendToSpecificUser = (userId, eventName, data) => {
  const socketId = userToSocketMap.get(parseInt(userId));
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(eventName, data);
      log.info(`[SOCKET] Enviado '${eventName}' a usuario ${userId}`, data);
      return true;
    }
  }
  log.warn(`[SOCKET] Usuario ${userId} no conectado o no encontrado`);
  return false;
};



io.on("connection", (socket) => {
  let id_usuario = socket.handshake.auth?.ID_usuario;
  if (id_usuario && typeof id_usuario === "string") id_usuario = parseInt(id_usuario);

  log.info(`[SOCKET] Conectado: ${socket.id} | Usuario: ${id_usuario || "Desconocido"}`);

  if (id_usuario && !isNaN(id_usuario)) {
    if (userToSocketMap.has(id_usuario)) {
      const oldSocketId = userToSocketMap.get(id_usuario);
      socketToUserMap.delete(oldSocketId);
    }
    socketToUserMap.set(socket.id, id_usuario);
    userToSocketMap.set(id_usuario, socket.id);
    socket.emit("user-confirmed", {
      message: "Usuario identificado correctamente",
      ID_usuario: id_usuario,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  }

  const getMQTTUserId = (id) => `User${parseInt(id) || 1}`;
  const userId = () => socketToUserMap.get(socket.id);
  const idMQTT = () => getMQTTUserId(userId());

 
  socket.on("placa-termica", ({ temperatura }) => {
    const value = Math.max(0, Math.min(100, parseInt(temperatura)));
    mqttClient.publish(`terrario/placaP/${idMQTT()}`, value.toString());
    
    socket.emit("actuador-data", { zona: "placaP", valor: value, ID_usuario: userId() });
    
    log.info(`[PLACA] Usuario ${userId()} ajustó placa térmica a ${value}%`);
  });



socket.on("modo", (valor) => {
  console.log(`🔧 Usuario ${userId()} solicita cambio de modo a: ${valor}`);
  

  const modoValue = valor === "manual" ? "1" : "0";
  const modoNumerico = valor === "manual" ? 0 : 1; 
  

  mqttClient.publish(`terrario/modo/${idMQTT()}`, modoValue);
  
  
  socket.emit("actuador-confirmado", { 
    zona: "modo", 
    valor: modoNumerico, 
    ID_usuario: userId(),
    timestamp: new Date().toISOString()
  });
  
  console.log(`✅ Usuario ${userId()} cambió a modo ${valor} (valor: ${modoNumerico})`);
});

  
  socket.on("control-foco", ({ encendido }) => {
    const valor = encendido ? "1" : "0";
    mqttClient.publish(`terrario/focoP/${idMQTT()}`, valor);
    
    socket.emit("actuador-confirmado", { 
      zona: "focoP", 
      valor: encendido ? 1 : 0, 
      ID_usuario: userId(),
      timestamp: new Date().toISOString()
    });
    
    log.info(`[FOCO] Usuario ${userId()} ${encendido ? 'encendió' : 'apagó'} foco principal`);
  });


  socket.on("control-uv", ({ encendido }) => {
    const valor = encendido ? "1" : "0";
    mqttClient.publish(`terrario/focouviP/${idMQTT()}`, valor);
    
 
    socket.emit("actuador-confirmado", { 
      zona: "focouviP", 
      valor: encendido ? 1 : 0, 
      ID_usuario: userId(),
      timestamp: new Date().toISOString()
    });
    
    log.info(`[UV] Usuario ${userId()} ${encendido ? 'encendió' : 'apagó'} luz UV`);
  });


  socket.on("control-humidificador", ({ encendido }) => {
    const valor = encendido ? "1" : "0";
    mqttClient.publish(`terrario/humidificadorP/${idMQTT()}`, valor);
    

    socket.emit("actuador-confirmado", { 
      zona: "humidificadorP", 
      valor: encendido ? 1 : 0, 
      ID_usuario: userId(),
      timestamp: new Date().toISOString()
    });
    
    log.info(`[HUMIDIFICADOR] Usuario ${userId()} ${encendido ? 'encendió' : 'apagó'} humidificador`);
  });


  socket.on("solicitar-estado", () => {
    const user_id = userId();
    if (user_id) {

      socket.emit("estado-solicitado", {
        ID_usuario: user_id,
        timestamp: new Date().toISOString(),
        message: "Estado del terrario solicitado"
      });
      log.info(`[ESTADO] Usuario ${user_id} solicitó estado del terrario`);
    }
  });


  socket.on("heartbeat", () => {
    socket.emit("heartbeat-response", {
      ID_usuario: userId(),
      timestamp: new Date().toISOString()
    });
  });


  socket.on("user-activity", (data) => {
    const user_id = userId();
    if (user_id) {
      log.info(`[ACTIVITY] Usuario ${user_id} reportó actividad:`, data);
    }
  });

  socket.on("disconnect", () => {
    socketToUserMap.delete(socket.id);
    if (id_usuario) userToSocketMap.delete(id_usuario);
    log.info(`[SOCKET] Desconectado: ${socket.id} | Usuario: ${id_usuario || "Desconocido"}`);
  });
});


const broadcastToAllUsers = (eventName, data) => {
  const connectedUsers = Array.from(userToSocketMap.keys());
  connectedUsers.forEach(userId => sendToSpecificUser(userId, eventName, data));
  return connectedUsers.length;
};


const sendUserSpecificData = (userId, eventName, data) => {
  return sendToSpecificUser(userId, eventName, { 
    ...data, 
    ID_usuario: userId,
    timestamp: new Date().toISOString()
  });
};

const getServerStats = () => ({
  connectedUsers: userToSocketMap.size,
  totalSockets: io.sockets.sockets.size,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString(),
});


app.get("/api/server/stats", (req, res) => res.json(getServerStats()));

app.get("/api/server/users", (req, res) => {
  const users = Array.from(userToSocketMap.keys());
  res.json({ 
    connectedUsers: users, 
    count: users.length, 
    timestamp: new Date().toISOString() 
  });
});


app.post("/api/server/send/:userId", (req, res) => {
  const { userId } = req.params;
  const { event, data } = req.body;
  
  const sent = sendToSpecificUser(parseInt(userId), event || 'test-message', data);
  
  res.json({
    success: sent,
    userId: parseInt(userId),
    message: sent ? 'Mensaje enviado' : 'Usuario no conectado',
    timestamp: new Date().toISOString()
  });
});


process.on("uncaughtException", (error) => {
  log.error("❌ Error no capturado:", error);
});

process.on("unhandledRejection", (reason) => {
  log.error("❌ Promesa rechazada no manejada:", reason);
});

process.on("SIGTERM", () => {
  log.warn("🛑 SIGTERM recibido. Cerrando servidor...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  log.warn("🛑 SIGINT recibido. Cerrando servidor...");
  server.close(() => process.exit(0));
});

const PORT = process.env.PORT || 5004;
server.listen(PORT, () => {
  console.log(`🌐 Servidor iniciado: http://localhost:${PORT}`);
  console.log(`📡 Socket.IO en puerto ${PORT}`);
  console.log(`🦎 GeckoHouse listo para recibir datos`);
  console.log(`⏰ Iniciado: ${new Date().toLocaleString("es-ES")}`);
  console.log(`👥 Sistema de aislamiento de usuarios: ACTIVADO`);

  setInterval(() => {
    const stats = getServerStats();
    console.log(`📊 Usuarios conectados: ${stats.connectedUsers} | Sockets: ${stats.totalSockets}`);
  }, 300000);
});

module.exports = {
  io,
  sendToSpecificUser,
  sendUserSpecificData,
  broadcastToAllUsers,
  getServerStats,
  socketToUserMap,
  userToSocketMap,
};