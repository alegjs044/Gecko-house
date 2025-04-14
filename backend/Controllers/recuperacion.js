const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET;
const USER_EMAIL = process.env.USER_EMAIL;
const PASS_EMAIL = process.env.PASS_EMAIL;

// nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: USER_EMAIL,
    pass: PASS_EMAIL,
  },
/*************  ✨ Codeium Command ⭐  *************/
/**
 * Handles password recovery by generating a reset token and sending an email to the user.
 *
 * @param {Object} req - The request object containing the user's email in the body.
 * @param {Object} res - The response object used to send back the appropriate HTTP response.
 *
 * This function performs the following actions:
 * 1. Checks if the given email is registered in the database.
 * 2. If registered, generates a JWT token with a 1-hour expiration time.
 * 3. Updates the user's record in the database with the reset token.
 * 4. Sends an email to the user with a link containing the reset token.
 *
 * If the email is not registered, it returns a 404 status with an error message.
 * In case of any server error, it logs the error and returns a 500 status.
 */

/******  89fcde53-039f-463e-824e-860dd7facfbb  *******/});

// Verificacion de respuesta
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error al configurar el correo:", error.message);
  } else {
    console.log("✅ Correo listo para enviar.");
  }
});

// Enviar correo con enlace de recuperación
exports.recoverPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ msg: "Correo es requerido." });

  try {
    const [users] = await db.promise().query(
      "SELECT ID_usuario FROM users WHERE Correo = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ msg: "Correo no registrado" });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

    await db.promise().query(
      "UPDATE users SET reset_token = ? WHERE Correo = ?",
      [token, email]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Soporte - GECKO HOUSE 🦎" <${USER_EMAIL}>`,
      to: email,
      subject: "Recuperación de contraseña - Gecko House",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="color: #4b3f2f;">Recuperación de Contraseña</h2>
            <p style="color: #333;">Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este mensaje.</p>
            <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 25px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Restablecer contraseña
            </a>
            <p style="color: #555;">Este enlace expirará en 1 hora.</p>
            <hr style="margin: 30px 0;" />
            <p style="font-size: 12px; color: #999;">
              © 2024 Gecko House | Este correo fue enviado automáticamente. No respondas a este mensaje.
            </p>
          </div>
        </div>
      `,
    });
    

    res.json({ msg: "Correo enviado con el enlace de recuperación" });
  } catch (error) {
    console.error(" Error en recuperación:", error.message);
    res.status(500).json({ msg: "Error. Verifica la configuración del correo." });
  }
};

// Procesar nueva contraseña
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ msg: "Token y nueva contraseña requeridos." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const [rows] = await db.promise().query(
      "SELECT ID_usuario FROM users WHERE Correo = ? AND reset_token = ?",
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.promise().query(
      "UPDATE users SET Contrasena = ?, reset_token = NULL WHERE Correo = ?",
      [hashedPassword, email]
    );

    res.json({ msg: "Contraseña restablecida con éxito" });
  } catch (error) {
    console.error(" Error al restablecer:", error.message);
    res.status(500).json({ msg: "Error al procesar el cambio de contraseña" });
  }
};
