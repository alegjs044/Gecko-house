require("dotenv").config();
const mysql = require("mysql2");

// Pool de conexiones con configuración SSL
const db = mysql.createPool({
    connectionLimit: 10, // Máximo de conexiones simultáneas
    host: process.env.DB_HOST || "blaynrrtogkqgpd39b0q-mysql.services.clever-cloud.com",
    user: process.env.DB_USER || "ubpn9ejvew4qdfxt",
    password: process.env.DB_PASSWORD || "mM4h7WbPcthQaUqknkBO",
    database: process.env.DB_NAME || "blaynrrtogkqgpd39b0q",
    port: process.env.DB_PORT || 20220,
    ssl: { rejectUnauthorized: false }
});

module.exports = db;
