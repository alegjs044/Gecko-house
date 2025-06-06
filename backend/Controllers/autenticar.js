const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET_KEY = process.env.SECRET_KEY || "clave_segura";

// 👉 LOGIN CON LOGS PERO SIN CAMBIAR LA ESTRUCTURA
exports.login = async (req, res) => {
  try {
    const { Usuario, Contrasena } = req.body;
    
    // ✅ LOGS PARA DEBUGGING
    console.log('🔐 === INTENTO DE LOGIN ===');
    console.log('Usuario:', Usuario);
    console.log('Contraseña length:', Contrasena?.length);
    
    if (!Usuario || !Contrasena) {
      console.log('❌ Campos faltantes');
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // ✅ USAR EL NUEVO MÉTODO executeQuery
    console.log('🔍 Buscando usuario en base de datos...');
    const results = await db.executeQuery(
      "SELECT * FROM users WHERE Usuario = ?",
      [Usuario]
    );

    console.log('📊 Resultados de búsqueda:', {
      found: results.length > 0,
      totalResults: results.length
    });

    if (!results.length) {
      console.log('❌ Usuario no encontrado:', Usuario);
      return res.status(404).json({ error: "Usuario o contraseña incorrectos" });
    }

    const user = results[0];
    console.log('👤 Usuario encontrado:', {
      ID_usuario: user.ID_usuario,
      Usuario: user.Usuario,
      Correo: user.Correo
    });

    // ✅ VERIFICAR CONTRASEÑA
    console.log('🔐 Verificando contraseña...');
    const isMatch = await bcrypt.compare(Contrasena, user.Contrasena);
    console.log('🔍 Resultado comparación:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Contraseña incorrecta para usuario:', Usuario);
      return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
    }

    console.log('✅ Contraseña verificada correctamente');

    const esTemporal = user.Usuario.startsWith("user_temp_");

    const token = jwt.sign(
      { id: user.ID_usuario, email: user.Correo, user: user.Usuario },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    console.log('✅ Token generado exitosamente');

    // ✅ MANTENER LA MISMA ESTRUCTURA DE RESPUESTA QUE FUNCIONA
    const response = {
      message: "Inicio de sesión exitoso",
      token,
      ID_usuario: user.ID_usuario,
      Nombre: user.Nombre || user.Usuario,
      Correo: user.Correo,
      temporal: esTemporal
    };

    console.log('🎉 Login exitoso para usuario:', user.ID_usuario);
    console.log('📤 Enviando respuesta exitosa');

    res.json(response);

  } catch (error) {
    console.error("❌ Error en login:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// EDITAR USUARIO (mantener igual)
exports.editUser = async (req, res) => {
  const { Usuario, Contrasena, Correo, token } = req.body;
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const { id: userId } = jwt.verify(token, SECRET_KEY);

    const usuarioDuplicado = await db.executeQuery(
      "SELECT * FROM users WHERE Usuario = ? AND ID_usuario != ?",
      [Usuario, userId]
    );
    if (usuarioDuplicado.length > 0) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }

    const correoDuplicado = await db.executeQuery(
      "SELECT * FROM users WHERE Correo = ? AND ID_usuario != ?",
      [Correo, userId]
    );
    if (correoDuplicado.length > 0) {
      return res.status(400).json({ error: "El correo ya está en uso" });
    }

    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    await db.executeQuery(
      `UPDATE users 
         SET Usuario   = ?,
             Correo    = ?,
             Contrasena= ?
       WHERE ID_usuario = ?`,
      [Usuario, Correo, hashedPassword, userId]
    );   
    
    const newToken = jwt.sign(
      { id: userId, email: Correo, user: Usuario },
      SECRET_KEY,
      { expiresIn: "3h" }
    );
    
    res.json({ message: "Usuario actualizado", token: newToken });

  } catch (error) {
    console.error("❌ Error editando usuario:", error.message);
    res.status(401).json({ error: "Token inválido o error al editar usuario" });
  }
};