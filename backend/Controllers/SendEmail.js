const nodemailer = require("nodemailer");
const db = require("../db");
const { Limites } = require("../Const/Limites");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "soportegeckohouse@gmail.com",
    pass: "yjjfidezlcplhsgv",
  },
});

// 📧 Obtener correo del usuario
const obtenerCorreoUsuario = async (idUsuario) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT Correo FROM users WHERE ID_usuario = ?", [Number(idUsuario)], (err, res) => {
      if (err) return reject(err);
      if (!res?.length) return reject(new Error(`Usuario ${idUsuario} no encontrado`));
      resolve(res[0].Correo);
    });
  });
};

// 🚨 Enviar alerta crítica automática
const sendCriticalAlert = async ({ tipo_sensor, zona, valor, limites, usuario }) => {
  if (!usuario || !limites || typeof valor === "undefined") {
    console.error("❌ Faltan datos requeridos para enviar alerta crítica");
    return;
  }

  try {
    const correoDestino = await obtenerCorreoUsuario(usuario);
    const sensorName = tipo_sensor === 'temperatura' ? `Temperatura ${zona}` :
                       tipo_sensor === 'humedad' ? 'Humedad' : 'Luz UV';
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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email de alerta:`, error.message);
    throw error;
  }
};

// 📬 Enviar correo desde frontend/manual
exports.sendEmail = async (req, res) => {
  const { descripcion, valor, tipo, zona = null, ciclo = 'diaam', muda = false } = req.body;
  console.log("📥 Datos recibidos en sendEmail:", req.body);

  let limites;

  if (tipo === "temperatura") {
    const zonaKey = `zona${zona}`;
    if (!zona || !Limites[zonaKey]?.[ciclo]) {
      console.error("📛 Zona o ciclo no válidos:", { zona, zonaKey, ciclo });
      return res.status(400).json({ message: "Zona o ciclo no válidos para temperatura" });
    }
    limites = { ...Limites[zonaKey][ciclo] };
  } else if (tipo === "humedad") {
    limites = { ...Limites.humedad[muda ? "muda" : "normal"] };
  } else if (tipo === "luz_uv") {
    if (!Limites.uvi?.[ciclo]) {
      console.error("📛 Ciclo no válido para luz UV:", ciclo);
      return res.status(400).json({ message: "Ciclo no válido para luz UV" });
    }
    limites = { ...Limites.uvi[ciclo] };
  } else {
    console.error("📛 Tipo de alerta no válido:", tipo);
    return res.status(400).json({ message: "Tipo de alerta no válido" });
  }

  const direction = valor > limites.alto ? "Alta" : valor < limites.bajo ? "Baja" : null;
  if (!direction) {
    return res.status(400).json({ message: `El nivel de ${tipo} está dentro del rango normal` });
  }

  try {
    const correoDestino = await obtenerCorreoUsuario(1); // reemplazar si es dinámico
    const unidad = tipo === "temperatura" ? "°C" : tipo === "humedad" ? "%" : "";

    const mailOptions = {
      from: `"🦎 Gecko House" <soportegeckohouse@gmail.com>`,
      to: correoDestino,
      subject: `⚠️ Alerta de ${tipo} ${direction} ⚠️`,
      text: `⚠️ SENSOR: ${tipo}${zona ? ` ${zona}` : ""}
📊 VALOR ACTUAL: ${valor}${unidad}
📉 RANGO NORMAL: ${limites.bajo}${unidad} - ${limites.alto}${unidad}
⏰ FECHA: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`,
    };

    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado con éxito", info: info.messageId });
  } catch (error) {
    res.status(500).json({ message: "Error al enviar el correo", error: error.message });
  }
};


exports.sendCriticalAlert = sendCriticalAlert;
