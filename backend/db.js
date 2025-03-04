require("dotenv").config();
const mysql = require("mysql2");

// Configuración de conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "login_db",
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Error al conectar a la base de datos:", err);
    } else {
        console.log("✅ Conectado a la base de datos MySQL");
    }
});

module.exports = db;

  