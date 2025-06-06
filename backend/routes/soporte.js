const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send-complaint", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Email y mensaje son requeridos." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASS_EMAIL,
      },
    });

    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: process.env.EMAIL_TO,
      subject: "Soporte a usuario | GeckoHouse",
      text: `Mensaje del usuario:\n\n${message}\n\nCorreo: ${email}`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "No se pudo enviar el correo." });
  }
});

module.exports = router;
