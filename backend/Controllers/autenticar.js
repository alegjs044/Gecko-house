const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET_KEY = process.env.SECRET_KEY || "clave_segura";

// 👉 LOGIN
exports.login = async (req, res) => {
  try {
    const { Usuario, Contrasena } = req.body;
    if (!Usuario || !Contrasena) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const [results] = await db.promise().query(
      "SELECT * FROM users WHERE Usuario = ?",
      [Usuario]
    );

    if (!results.length) {
      return res.status(404).json({ error: "Usuario o contraseña incorrectos" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(Contrasena, user.Contrasena);
    if (!isMatch) {
      return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: user.ID_usuario, email: user.Correo, user: user.Usuario },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({ message: "Inicio de sesión exitoso", token });
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// REGISTRO
exports.register = async (req, res) => {
  try {
    const { Usuario, Correo, Contrasena } = req.body;
    if (!Usuario || !Correo || !Contrasena) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const [existingUsers] = await db.promise().query(
      "SELECT * FROM users WHERE Usuario = ? OR Correo = ?",
      [Usuario, Correo]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Usuario o correo ya existen" });
    }

    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    await db.promise().query(
      "INSERT INTO users (Usuario, Correo, Contrasena) VALUES (?, ?, ?)",
      [Usuario, Correo, hashedPassword]
    );

    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error en el registro:", error.message);
    res.status(500).json({ error: "Error de conexión" });
  }
};

// EDITAR USUARIO
exports.editUser = async (req, res) => {
  const { Usuario, Contrasena, token } = req.body;
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { email: correo, user: username, id: userId } = decoded;

    const [userExists] = await db.promise().query(
      "SELECT 1 FROM users WHERE Usuario = ? AND Correo = ?",
      [username, correo]
    );

    if (userExists.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    await db.promise().query(
      "UPDATE users SET Contrasena = ?, Usuario = ? WHERE Correo = ?",
      [hashedPassword, Usuario, correo]
    );

    const newToken = jwt.sign(
      { id: userId, email: correo, user: Usuario },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({ message: "Usuario actualizado", token: newToken });
  } catch (error) {
    console.error("Error editando usuario:", error.message);
    res.status(401).json({ error: "Token inválido o error al editar usuario" });
  }
};
