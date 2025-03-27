/**
 * SERVIDOR EXPRESS PARA SISTEMA DE MONITOREO AMBIENTAL
 */

// Carga de variables de entorno desde archivo .env
require("dotenv").config();

// Importación de dependencias
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const nodemailer = require("nodemailer");

// Importación de controladores para las diferentes mediciones
const temperaturaController = require('./Controllers/ControllerTemperatura');
const humedadController = require('./Controllers/ControllerHumedad');
const iluminacionController = require('./Controllers/ControllerIluminacion');
const notificacionesController = require('./Controllers/ControllerNotificaciones');

// Inicialización de la aplicación Express
const app = express();

// Middlewares
app.use(express.json());  // Para parsear solicitudes con cuerpo JSON
app.use(cors());          // Para permitir solicitudes de origen cruzado

// Clave secreta para la generación y verificación de tokens JWT
const SECRET_KEY = process.env.SECRET_KEY || "clave_segura";

/**
 * Función auxiliar para ejecutar consultas a la base de datos con promesas
 * @param {string} query - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise} - Promesa con el resultado de la consulta
 */
const queryAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// ===================================
// RUTAS DE AUTENTICACIÓN Y USUARIOS
// ===================================

/**
 * @route POST /login
 * @description Autentica a un usuario y genera un token JWT
 * @access Público
 */
app.post("/login", async (req, res) => {
  try {
    // Extraer credenciales del cuerpo de la solicitud
    const { Usuario, Contrasena } = req.body;
    
    // Validar que se proporcionen ambos campos
    if (!Usuario || !Contrasena) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Buscar usuario en la base de datos
    const [results] = await db.promise().query("SELECT * FROM users WHERE Usuario = ?", [Usuario]);
    if (!results.length) {
      return res.status(404).json({ error: "Usuario o contraseña incorrectos" });
    }
    
    const user = results[0];
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(Contrasena, user.Contrasena);
    if (!isMatch) {
      return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Generar token JWT si la autenticación es exitosa
    const token = jwt.sign(
      { id: user.ID_usuario, email: user.Correo, user: user.Usuario }, 
      SECRET_KEY, 
      { expiresIn: "2h" }
    );

    // Enviar respuesta exitosa con el token
    res.json({ message: "Inicio de sesión exitoso", token });
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * @route POST /register
 * @description Registra un nuevo usuario en el sistema
 * @access Público
 */
app.post("/register", async (req, res) => {
  try {
    // Extraer datos del usuario del cuerpo de la solicitud
    const { Usuario, Correo, Contrasena } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!Usuario || !Correo || !Contrasena) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar si el usuario o correo ya existen en el sistema
    const [existingUsers] = await db.promise().query(
      "SELECT * FROM users WHERE Usuario = ? OR Correo = ?",
      [Usuario, Correo]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Usuario o correo ya existen" });
    }

    // Hashear la contraseña para almacenamiento seguro
    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    // Insertar nuevo usuario en la base de datos
    await db.promise().query(
      "INSERT INTO users (Usuario, Correo, Contrasena) VALUES (?, ?, ?)",
      [Usuario, Correo, hashedPassword]
    );

    // Enviar respuesta exitosa
    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error en el registro de usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * @route POST /edit-user
 * @description Actualiza la información de un usuario existente
 * @access Privado (requiere token de autenticación)
 */
app.post("/edit-user", async (req, res) => {
  // Extraer datos y token de la solicitud
  const { Usuario, Contrasena, token } = req.body;

  // Verificar que se proporcionó un token
  if (!token) {
    return res.status(401).json({ error: "No se proporcionó token de autenticación" });
  }

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, SECRET_KEY);
    const { id: userId, email: correo, user: username } = decoded;

    // Validar datos de actualización
    if (!Usuario || !Contrasena) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar que el usuario existe
    const userExists = await queryAsync(
      "SELECT 1 FROM users WHERE Usuario = ? AND Correo = ?",
      [username, correo]
    );

    if (userExists.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    // Actualizar información del usuario
    await queryAsync(
      "UPDATE users SET Contrasena = ?, Usuario = ? WHERE Correo = ?",
      [hashedPassword, Usuario, correo]
    );

    // Generar nuevo token con la información actualizada
    const newToken = jwt.sign({ id: userId, email: correo, user: Usuario }, SECRET_KEY, {
      expiresIn: "2h",
    });

    // Enviar respuesta exitosa con el nuevo token
    res.status(200).json({
      message: "Usuario modificado con éxito",
      token: newToken,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(401).json({ error: "Token inválido o error en la actualización" });
  }
});

// ===================================
// RUTAS BÁSICAS DEL SERVIDOR
// ===================================

/**
 * @route GET /
 * @description Ruta de verificación para comprobar que el servidor está funcionando
 * @access Público
 */
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente!");
});

// ===================================
// SISTEMA DE NOTIFICACIONES POR EMAIL
// ===================================

// Configuración del transportador de correo electrónico
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.PASS_EMAIL,
  },
});

/**
 * Genera mensajes de alerta según el tipo de medición y su valor
 * @param {string} tipo - Tipo de medición (temperatura, humedad, luz_uv)
 * @param {number} valor - Valor de la medición
 * @param {Object} limites - Límites superior e inferior para la medición
 * @returns {Object} - Objeto con asunto y texto del mensaje o error
 */
const getAlertMessage = (tipo, valor, limites) => {
  // Validar que se proporcionó un valor
  if (valor === undefined || valor === null) {
    return { error: `No se proporcionó el valor de ${tipo}` };
  }

  console.log(`${tipo} recibida:`, valor);

  // Generar mensaje según el valor esté por encima o por debajo de los límites
  if (valor > limites.alto) {
    return {
      subject: `⚠️ Alerta de ${tipo} Alta ⚠️`,
      text: `¡Cuidado! El nivel de ${tipo} ha superado ${limites.alto}. Actualmente es de ${valor}.`,
    };
  } else if (valor < limites.bajo) {
    return {
      subject: `⚠️ Alerta de ${tipo} Baja ⚠️`,
      text: `¡Cuidado! El nivel de ${tipo} ha descendido por debajo de ${limites.bajo}. Actualmente es de ${valor}.`,
    };
  }

  // Si el valor está dentro de los límites, no hay alerta
  return { error: `El nivel de ${tipo} está dentro del rango normal` };
};

/**
 * @route POST /send-email
 * @description Envía alertas por correo electrónico cuando los valores están fuera de rango
 * @access Privado
 */
app.post("/send-email", async (req, res) => {
  // Extraer datos de la solicitud
  const { descripcion, valor, tipo, temperatura, humedad, luz_uv } = req.body;
  console.log("Datos recibidos:", req.body);

  // Definir los tipos de mediciones y sus límites
  const tipos = {
    humedad: { valor: humedad || valor, limites: { alto: 50, bajo: 30 } },
    luz_uv: { valor: luz_uv || valor, limites: { alto: 0.7, bajo: 0.4 } },
    temperatura: { valor: temperatura || valor, limites: { alto: 32, bajo: 22 } },
  };

  // Verificar que el tipo de medición sea válido
  if (!tipos[tipo]) {
    return res.status(400).json({ message: "Tipo de medición no válido" });
  }

  // Generar mensaje de alerta según el tipo y valor
  const alertMessage = getAlertMessage(tipo, tipos[tipo].valor, tipos[tipo].limites);
  if (alertMessage.error) {
    return res.status(400).json({ message: alertMessage.error });
  }

  // Configurar opciones del correo electrónico
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: process.env.EMAIL_TO,
    subject: alertMessage.subject,
    text: alertMessage.text,
  };

  console.log("Opciones de correo configuradas:", mailOptions);

  try {
    // Enviar el correo electrónico
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado exitosamente:", info.messageId);
    
    // Enviar respuesta exitosa
    res.status(200).json({ 
      message: "Correo enviado con éxito", 
      info: info.messageId 
    });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    
    // Enviar respuesta de error
    res.status(500).json({ 
      message: "Error al enviar el correo", 
      error: error.message 
    });
  }
});

// ===================================
// ENDPOINTS DEL CONTROLADOR DE NOTIFICACIONES
// ===================================

/**
 * @route POST /api/addNotification
 * @description Agrega una nueva notificación al sistema
 * @access Privado
 */
app.post("/api/addNotification", notificacionesController.addNotification);

/**
 * @route POST /api/addNotificationUser
 * @description Asocia una notificación a un usuario específico
 * @access Privado
 */
app.post("/api/addNotificationUser", notificacionesController.addNotificationUser);

/**
 * @route GET /api/getNotificationsByUserId/:id_user
 * @description Obtiene las notificaciones para un usuario específico
 * @access Privado
 */
app.get("/api/getNotificationsByUserId/:id_user", notificacionesController.getNotificationsByUserId);

// Lectura Notificaciones (actualizacion_contador)
app.post("/api/markNotificationAsRead/:id_notificacion/:id_user", notificacionesController.markNotificationAsRead);
app.post("/api/markAllNotificationsAsRead/:id_user", notificacionesController.markAllNotificationsAsRead);

// ===================================
// ENDPOINTS DEL CONTROLADOR DE TEMPERATURA
// ===================================

/**
 * @route GET /api/temperatura
 * @description Obtiene todos los registros de temperatura
 * @access Privado
 */
app.get("/api/temperatura", temperaturaController.getTemperatura);

/**
 * @route POST /api/addtemperatura
 * @description Agrega un nuevo registro de temperatura
 * @access Privado
 */
app.post("/api/addtemperatura", temperaturaController.addTemperatura);

/**
 * @route DELETE /api/temperatura/:ID_temperatura
 * @description Elimina un registro de temperatura específico
 * @access Privado
 */
app.delete("/api/temperatura/:ID_temperatura", temperaturaController.deleteTemperatura);

// ===================================
// ENDPOINTS DEL CONTROLADOR DE HUMEDAD
// ===================================

/**
 * @route GET /api/humedad
 * @description Obtiene todos los registros de humedad
 * @access Privado
 */
app.get("/api/humedad", humedadController.getHumedad);

/**
 * @route POST /api/addhumedad
 * @description Agrega un nuevo registro de humedad
 * @access Privado
 */
app.post("/api/addhumedad", humedadController.addHumedad);

/**
 * @route DELETE /api/humedad/:ID_humedad
 * @description Elimina un registro de humedad específico
 * @access Privado
 */
app.delete("/api/humedad/:ID_humedad", humedadController.deleteHumedad);

// ===================================
// ENDPOINTS DEL CONTROLADOR DE ILUMINACIÓN UV
// ===================================

/**
 * @route GET /api/iluminacion
 * @description Obtiene todos los registros de iluminación UV
 * @access Privado
 */
app.get("/api/iluminacion", iluminacionController.getLuzUV);

/**
 * @route POST /api/addiluminacion
 * @description Agrega un nuevo registro de iluminación UV
 * @access Privado
 */
app.post("/api/addiluminacion", iluminacionController.addLuzUV);

/**
 * @route DELETE /api/iluminacion/:ID_luz_uv
 * @description Elimina un registro de iluminación UV específico
 * @access Privado
 */
app.delete("/api/iluminacion/:ID_luz_uv", iluminacionController.deleteLuzUV);

// ===================================
// INICIO DEL SERVIDOR
// ===================================

// Definir puerto del servidor (usando variable de entorno o 5000 por defecto)
const PORT = process.env.PORT || 5000;

// Iniciar el servidor y escuchar en el puerto definido
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});