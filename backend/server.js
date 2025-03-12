require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY || "clave_segura";

// LOGIN
app.post("/login", async (req, res) => {
    const { Usuario, Contrasena } = req.body;

    if (!Usuario || !Contrasena) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    db.query("SELECT * FROM users WHERE Usuario = ?", [Usuario], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario o contraseña incorrectos" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(Contrasena, user.Contrasena);
        if (!isMatch) {
            return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
        }

        const token = jwt.sign({ id: user.ID_usuario }, SECRET_KEY, { expiresIn: "2h" });
        res.json({ message: "Inicio de sesión exitoso", token });
    });
});

// 🚀 Esta es la definición correcta del register que también necesitas:
app.post("/register", async (req, res) => {
    const { Usuario, Correo, Contrasena } = req.body;

    if (!Usuario || !Correo || !Contrasena) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const userExists = await new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM users WHERE Usuario = ? OR Correo = ?",
                [Usuario, Correo],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results.length > 0);
                }
            );
        });

        if (userExists) {
            return res.status(400).json({ error: "Usuario o correo ya existen" });
        }

        const hashedPassword = await bcrypt.hash(Contrasena, 10);

        db.query(
            "INSERT INTO users (Usuario, Correo, Contrasena) VALUES (?, ?, ?)",
            [Usuario, Correo, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Error al registrar usuario" });
                }

                res.status(201).json({ message: "Usuario registrado con éxito" });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta básica para verificar servidor
app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente!");
});

v
//---------------------NOTIFICACIONES-------------------------------

// Usa las variables de entorno para la configuración
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.PASS_EMAIL, // La contraseña de aplicación sin espacios
  },
});

app.post("/send-email", async (req, res) => {
  const { temperatura } = req.body;
  
  console.log("Datos recibidos:", req.body);
  
  if (temperatura === undefined || temperatura === null) {
    return res.status(400).json({ message: "No se proporcionó la temperatura" });
  }
  
  console.log("Temperatura recibida:", temperatura);
  
  let subject, text;
  
  // Determinar el tipo de alerta según la temperatura
  if (temperatura > 32) {
    subject = "⚠️ Alerta de Temperatura Alta ⚠️";
    text = `¡Cuidado! La temperatura ha superado los 32°C. Actualmente es de ${temperatura}°C.`;
  } else if (temperatura < 22) {
    subject = "⚠️ Alerta de Temperatura Baja ⚠️";
    text = `¡Cuidado! La temperatura ha descendido por debajo de los 22°C. Actualmente es de ${temperatura}°C.`;
  } else {
    // Esto no debería suceder debido a tu lógica en el frontend
    return res.status(400).json({ message: "La temperatura está dentro del rango normal" });
  }
  
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: process.env.EMAIL_TO,
    subject: subject,
    text: text,
  };
  
  console.log("Opciones de correo configuradas:", mailOptions);
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado exitosamente", info.messageId);
    res.status(200).json({ 
      message: "Correo enviado con éxito",
      info: info.messageId 
    });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    res.status(500).json({ 
      message: "Error al enviar el correo", 
      error: error.message 
    });
  }
});


//  **Iniciar el servidor**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
