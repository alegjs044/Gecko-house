const express = require("express");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

// Configurar nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.PASS_EMAIL,
  },
});

// **1️⃣ Endpoint para solicitar recuperación de contraseña**
app.post("/api/recover-password", async (req, res) => {
  const { email } = req.body;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT ID_usuario FROM users WHERE Correo = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Correo no encontrado" });
    }

    // Generar un token de recuperación válido por 1 hora
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Guardar el token en la base de datos
    await connection.execute(
      "UPDATE users SET reset_token = ? WHERE Correo = ?",
      [token, email]
    );

    // Cerrar conexión
    await connection.end();

    // URL de recuperación
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    // Configurar correo
    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: email,
      subject: "Recuperación de contraseña",
      html: `<p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Este enlace expirará en 1 hora.</p>`,
    });

    res.json({ msg: "Correo de recuperación enviado" });
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

// **2️⃣ Endpoint para restablecer contraseña**
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  let connection;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT ID_usuario FROM users WHERE Correo = ? AND reset_token = ?",
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y eliminar el token
    await connection.execute(
      "UPDATE users SET Contrasena = ?, reset_token = NULL WHERE Correo = ?",
      [hashedPassword, email]
    );

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
