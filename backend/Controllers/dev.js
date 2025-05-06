// controllers/dev.js
const bcrypt = require("bcryptjs");
const db = require("../db");

// Crea un usuario temporal con hash bcrypt
exports.crearUsuarioTemporal = async (req, res) => {
  const { correo } = req.body;
  const usuarioTemporal = "user_temp_" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const clave = "temporal123";
  const hash = await bcrypt.hash(clave, 10);

  try {
    await db.promise().query(
      "INSERT INTO users (Usuario, Correo, Contrasena) VALUES (?, ?, ?)",
      [usuarioTemporal, correo, hash]
    );

    res.status(201).json({
      message: "Usuario temporal creado",
      usuario: usuarioTemporal,
      clave,
      qr_url: `http://localhost:3000/login?usuario=${usuarioTemporal}&clave=${clave}`
    });
  } catch (error) {
    console.error("❌ Error creando usuario temporal:", error.message);
    res.status(500).json({ error: "No se pudo crear el usuario" });
  }
};
