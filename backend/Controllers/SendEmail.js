const nodemailer = require("nodemailer");
const db = require("../db");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "soportegeckohouse@gmail.com",
    pass: "yjjfidezlcplhsgv",
  },
});

// Obtener correo del usuario desde la BD
const obtenerCorreoUsuario = async (idUsuario) => {
  return new Promise((resolve, reject) => {
    const consulta = "SELECT Correo FROM users WHERE ID_usuario = ?";
    db.query(consulta, [Number(idUsuario)], (error, resultados) => {
      if (error) {
        console.error(`❌ Error consultando correo del usuario ${idUsuario}:`, error);
        return reject(error);
      }
      if (!resultados?.length) {
        console.error(`❌ Usuario ${idUsuario} no encontrado en la BD`);
        return reject(new Error(`Usuario ${idUsuario} no encontrado`));
      }
      const correo = resultados[0].Correo;
      console.log(`📧 Correo obtenido para ${idUsuario}: ${correo}`);
      resolve(correo);
    });
  });
};

// Enviar alerta crítica automática
const sendCriticalAlert = async ({ tipo_sensor, zona, valor, limites, usuario }) => {
  if (!usuario || !limites || typeof valor === "undefined") {
    console.error("❌ Faltan datos requeridos para enviar alerta crítica");
    return;
  }

  try {
    const correoDestino = await obtenerCorreoUsuario(usuario);
    const sensorName = tipo_sensor === 'temperatura' 
      ? `Temperatura ${zona}` 
      : tipo_sensor === 'humedad' 
      ? 'Humedad' 
      : 'Luz UV';

    const unit = tipo_sensor === 'temperatura' ? '°C' : tipo_sensor === 'humedad' ? '%' : '';
    const direction = valor > limites.max ? 'ALTA' : 'BAJA';

    const mailOptions = {
      from: `"🦎 Gecko House Alert" <soportegeckohouse@gmail.com>`,
      to: correoDestino,
      subject: `🚨 ALERTA CRÍTICA - ${sensorName} ${direction} 🚨`,
      text: `⚠️ SENSOR: ${sensorName}
📊 VALOR ACTUAL: ${valor}${unit}
📉 RANGO NORMAL: ${limites.min}${unit} - ${limites.max}${unit}
⏰ FECHA: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}

Por favor revisa el terrario inmediatamente.

---
Sistema Gecko House
Soporte: soportegeckohouse@gmail.com`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de alerta enviado a ${correoDestino}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, emailSentTo: correoDestino };
    
  } catch (error) {
    console.error(`❌ Error enviando email de alerta:`, error.message);
    throw error;
  }
};

// Enviar correo desde frontend (manual)
exports.sendEmail = async (req, res) => {
  const { descripcion, valor, tipo, temperatura, humedad, luz_uv } = req.body;

  const tipos = {
    humedad: { valor: humedad || valor, limites: { alto: 50, bajo: 30 } },
    luz_uv: { valor: luz_uv || valor, limites: { alto: 0.7, bajo: 0.4 } },
    temperatura: { valor: temperatura || valor, limites: { alto: 32, bajo: 22 } },
  };

  if (!tipos[tipo]) return res.status(400).json({ message: "Tipo de medición no válido" });

  const current = tipos[tipo];
  const direction = current.valor > current.limites.alto ? "Alta" : current.valor < current.limites.bajo ? "Baja" : null;

  if (!direction) {
    return res.status(400).json({ message: `El nivel de ${tipo} está dentro del rango normal` });
  }

  try {
    const correoDestino = await obtenerCorreoUsuario(1); // ID fijo para pruebas
    const mailOptions = {
      from: `"🦎 Gecko House" <soportegeckohouse@gmail.com>`,
      to: correoDestino,
      subject: `⚠️ Alerta de ${tipo} ${direction} ⚠️`,
      text: `¡Cuidado! El nivel de ${tipo} está ${direction === "Alta" ? "alto" : "bajo"}.\nValor actual: ${current.valor}`,
    };

    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado con éxito", info: info.messageId });
  } catch (error) {
    res.status(500).json({ message: "Error al enviar el correo", error: error.message });
  }
};

exports.sendCriticalAlert = sendCriticalAlert;
