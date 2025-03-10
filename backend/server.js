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

// Ruta para iniciar sesión
app.post("/login", (req, res) => {
    const { Usuario, Contrasena } = req.body;

    if (!Usuario || !Contrasena) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    db.query("SELECT * FROM users WHERE Usuario = ?", [Usuario], async (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario o contraseña incorrectos" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(Contrasena, user.Contrasena);
        if (!isMatch) {
            return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });
        res.json({ message: "Inicio de sesión exitoso", token });
    });
});

// Ruta para registrar usuarios
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
            return res.status(400).json({ error: "El usuario o correo ya existen" });
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

// 🚩 Ruta básica para verificar servidor
app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente!");
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
