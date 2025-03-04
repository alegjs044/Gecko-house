require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.SECRET_KEY || "clave_secreta_segura";

// **Ruta para iniciar sesión**
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Buscar el usuario en la base de datos
    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario o contraseña incorrectos" });
        }

        const user = results[0];

        // **Comparar la contraseña encriptada con bcrypt**
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
        }

        // **Generar un token JWT**
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });

        res.json({ message: "Inicio de sesión exitoso", token });
    });
});

//  **Iniciar el servidor**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
