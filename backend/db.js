// db.js - Configuración segura para MySQL en Clever Cloud
require("dotenv").config(); // Asegúrate de tener esto al inicio

const mysql = require("mysql2");

// ✅ Configuración usando variables de entorno desde .env
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306", 10),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Opciones seguras y compatibles
  charset: "utf8mb4",
  timezone: "-06:00", // 🔧 CAMBIADO: Hora de México (UTC-6)
  dateStrings: true,
  multipleStatements: false,

  // Requerido por Clever Cloud
  ssl: {
    rejectUnauthorized: false,
  },
};

// ✅ Mostrar configuración cargada para depuración
console.log("✅ Configuración de DB cargada:");
console.log({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password ? "***" : "(vacío)",
  database: dbConfig.database,
  port: dbConfig.port,
  timezone: dbConfig.timezone, // 🔧 AGREGADO: Mostrar timezone configurado
});

// ✅ Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// ✅ Función con retry para ejecutar queries
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const maxRetries = 3;
    let retryCount = 0;

    const attempt = () => {
      pool.query(query, params, (error, results) => {
        if (error) {
          const retryable = [
            "ECONNRESET",
            "PROTOCOL_CONNECTION_LOST",
            "ENOTFOUND",
            "ECONNREFUSED",
            "ETIMEDOUT",
          ];
          console.error(`❌ Error en query (intento ${retryCount + 1}):`, error.code);

          if (retryable.includes(error.code) && retryCount < maxRetries - 1) {
            retryCount++;
            const delay = 500 * retryCount;
            console.log(`🔁 Reintentando en ${delay}ms...`);
            setTimeout(attempt, delay);
          } else {
            reject(error);
          }
        } else {
          resolve(results);
        }
      });
    };

    attempt();
  });
};

// ✅ Prueba inicial de conexión
const testConnection = async () => {
  try {
    await executeQuery("SELECT NOW() as hora_servidor, CONVERT_TZ(NOW(), '+00:00', '-06:00') as hora_mexico");
    console.log("✅ Conexión a base de datos exitosa con timezone México");
  } catch (err) {
    console.error("❌ Fallo en conexión a base de datos:", err.message);
  }
};

// ✅ Apagar pool correctamente
const closePool = () => {
  return new Promise((resolve) => {
    pool.end(() => {
      console.log("🔒 Pool de conexiones cerrado");
      resolve();
    });
  });
};

// ✅ Compatibilidad con código que usa callbacks
const legacyQuery = (query, params, callback) => {
  if (typeof params === "function") {
    callback = params;
    params = [];
  }

  executeQuery(query, params)
    .then((results) => callback(null, results))
    .catch((err) => callback(err));
};

// ✅ Conexiones controladas al salir
process.on("SIGINT", () => {
  console.log("🛑 Cerrando aplicación...");
  closePool().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("🛑 Cerrando aplicación...");
  closePool().then(() => process.exit(0));
});

// ✅ Ejecutar prueba de conexión al cargar
testConnection();

module.exports = {
  executeQuery,
  query: legacyQuery,
  promise: () => ({
    query: executeQuery,
  }),
  closePool,
  pool,
};
