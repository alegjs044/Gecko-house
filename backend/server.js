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

<<<<<<< HEAD
// Rutas
=======
// Rutas Express existentes
>>>>>>> 6fac248fdd7276a8693df17f5dfe69b13e1a6a0f
app.get("/", (req, res) => res.send("Servidor funcionando correctamente!"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/email", require("./routes/email"));
app.use("/api", require("./routes/recuperar"));

<<<<<<< HEAD
require("./data");
=======
require("./autoRecorder");
>>>>>>> 6fac248fdd7276a8693df17f5dfe69b13e1a6a0f

// WebSocket
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado a WebSocket");

<<<<<<< HEAD
  socket.on("modo", (modo) => {
    mqttClient.publish("terrario/modo/User1", modo);
  });

  socket.on("placa-termica", (porcentaje) => {
    const value = Math.max(0, Math.min(100, parseInt(porcentaje)));
    mqttClient.publish("terrario/placa-termica/User1", value.toString());
  });

  socket.on("humidificador", (estado) => {
    mqttClient.publish("terrario/humidificador/User1", estado ? "on" : "off");
  });

  socket.on("iluminación", (estado) => {
    mqttClient.publish("terrario/iluminacion/User1", estado ? "on" : "off");
  });

  socket.on("muda-piel", (modo) => {
    mqttClient.publish("terrario/muda-piel/User1", modo);
  });
});

// MQTT Listener
initMQTT(io);

=======
  socket.on("modo", (modo) => mqttClient.publish("terrario/modo", modo));
  socket.on("placa-termica", (temp) => mqttClient.publish("terrario/placa-termica", temp.toString()));
  socket.on("humidificador", (estado) => mqttClient.publish("terrario/humidificador", estado ? "on" : "off"));
  socket.on("muda-piel", (modo) => mqttClient.publish("terrario/muda-piel", modo));
});

// Inicializar conexión MQTT con lógica modularizada
initMQTT(io);




>>>>>>> 6fac248fdd7276a8693df17f5dfe69b13e1a6a0f
// Servidor HTTP
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor web corriendo en http://localhost:${PORT}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> 6fac248fdd7276a8693df17f5dfe69b13e1a6a0f
