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

    const esTemporal = user.Usuario.startsWith("user_temp_");

    const token = jwt.sign(
      { id: user.ID_usuario, email: user.Correo, user: user.Usuario },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      ID_usuario: user.ID_usuario,
      Nombre: user.Nombre || user.Usuario,
      Correo: user.Correo,
      temporal: esTemporal
    });

  } catch (error) {
    console.error("❌ Error en login:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};


// EDITAR USUARIO
exports.editUser = async (req, res) => {
  const { Usuario, Contrasena, Correo, token } = req.body;
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { id: userId } = decoded;

    // Validar usuario duplicado
    const [usuarioDuplicado] = await db.promise().query(
      "SELECT * FROM users WHERE Usuario = ? AND ID_usuario != ?",
      [Usuario, userId]
    );
    if (usuarioDuplicado.length > 0) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }

    // Validar correo duplicado
    const [correoDuplicado] = await db.promise().query(
      "SELECT * FROM users WHERE Correo = ? AND ID_usuario != ?",
      [Correo, userId]
    );
    if (correoDuplicado.length > 0) {
      return res.status(400).json({ error: "El correo ya está en uso" });
    }

    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    await db.promise().query(
      "UPDATE users SET ID_usuario = ?, Usuario = ?, Correo = ?, Contrasena = ? WHERE ID_usuario = ?",
      [Usuario, Usuario, Correo, hashedPassword, userId]
    );    
    

    const newToken = jwt.sign(
      { id: Usuario, email: Correo, user: Usuario },
      SECRET_KEY,
      { expiresIn: "2h" }
    );
    

    res.json({ message: "Usuario actualizado", token: newToken });

  } catch (error) {
    console.error("❌ Error editando usuario:", error.message);
    res.status(401).json({ error: "Token inválido o error al editar usuario" });
  }
};
