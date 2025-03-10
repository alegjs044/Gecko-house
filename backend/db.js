require("dotenv").config();
const mysql = require("mysql2");

// Configuración de conexión a la base de datos con SSL
const db = mysql.createConnection({
    host: process.env.DB_HOST || "bibnsazm4qab9oq1jxct-mysql.services.clever-cloud.com",
    user: process.env.DB_USER || "ubpn9ejvew4qdfxt",
    password: process.env.DB_PASSWORD || "mM4h7WbPcthQaUqknkBO",
    database: process.env.DB_NAME || "bibnsazm4qab9oq1jxct",
    port: process.env.DB_PORT || 3306, 
    ssl: { rejectUnauthorized: false } 
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Error al conectar a la base de datos:", err.message);
    } else {
        console.log("✅ Conectado a la base de datos MySQL");
    }
});

module.exports = db;
