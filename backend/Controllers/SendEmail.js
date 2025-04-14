// backend/controllers/SendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.PASS_EMAIL,
  },
});

const getAlertMessage = (tipo, valor, limites) => {
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

  return { error: `El nivel de ${tipo} está dentro del rango normal` };
};

exports.sendEmail = async (req, res) => {
  const { descripcion, valor, tipo, temperatura, humedad, luz_uv } = req.body;

  const tipos = {
    humedad: { valor: humedad || valor, limites: { alto: 50, bajo: 30 } },
    luz_uv: { valor: luz_uv || valor, limites: { alto: 0.7, bajo: 0.4 } },
    temperatura: { valor: temperatura || valor, limites: { alto: 32, bajo: 22 } },
  };

  if (!tipos[tipo]) return res.status(400).json({ message: "Tipo de medición no válido" });

  const alertMessage = getAlertMessage(tipo, tipos[tipo].valor, tipos[tipo].limites);
  if (alertMessage.error) return res.status(400).json({ message: alertMessage.error });

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: process.env.EMAIL_TO,
    subject: alertMessage.subject,
    text: alertMessage.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado con éxito", info: info.messageId });
  } catch (error) {
    res.status(500).json({ message: "Error al enviar el correo", error: error.message });
  }
};