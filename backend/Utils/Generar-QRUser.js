// AL INICIO del archivo, antes de todo:
require('dotenv').config({ path: '../.env' });
const QRCode = require("qrcode"); 
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("../db");
const open = (...args) => import("open").then(mod => mod.default(...args));

const mysql = require('mysql2');

const dbConfig = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,  
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// Agregar soporte para promises
db.promise = () => {
  return {
    query: (sql, params) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        });
      });
    }
  };
};

const URL_BASE = "http://localhost:3000/login";
const claveTemporal = "temporal123";

// Generar usuario y correo temporales únicos
const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
const usuarioTemporal = "user_temp_" + randomId;
const correo = `temporal_${randomId}@gecko.com`;

const generarQRConTexto = async () => {
  try {
    const hash = await bcrypt.hash(claveTemporal, 10);

    // Insertar usuario en la base de datos
    await db.promise().query(
      "INSERT INTO users (ID_usuario, Usuario, Correo, Contrasena) VALUES (?, ?, ?, ?)",
      [usuarioTemporal, usuarioTemporal, correo, hash]
    );

    const urlLogin = `${URL_BASE}?usuario=${usuarioTemporal}&clave=${claveTemporal}`;
    const outputDir = path.join(__dirname, "../qrs");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const tempQR = path.join(outputDir, `qr_temp.png`);
    const qrFinal = path.join(outputDir, `qr_${usuarioTemporal}.png`);

    // Generar QR sin texto
    await QRCode.toFile(tempQR, urlLogin, {
      color: { dark: "#000", light: "#FFF" }
    });

    // Cargar imagen y añadir texto debajo
    const qrImage = await loadImage(tempQR);
    const canvas = createCanvas(qrImage.width, qrImage.height + 60);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrImage, 0, 0);

    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Gecko House", canvas.width / 2, qrImage.height + 40);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(qrFinal, buffer);

    // Limpiar QR temporal
    fs.unlinkSync(tempQR);

    console.log("Usuario:", usuarioTemporal);
    console.log("Correo:", correo);
    console.log("Contrasena:", claveTemporal);
    console.log("URL:", urlLogin);
    console.log("QR (Imagen):", qrFinal);

    await open(urlLogin);

  } catch (err) {
    console.error("❌ Error generando usuario y QR:", err.message);
  }
};

generarQRConTexto();