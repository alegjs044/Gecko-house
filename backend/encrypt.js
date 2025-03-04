const bcrypt = require("bcryptjs");

// 🔹 Cambia esta contraseña por la que desees
const password = "1234"; 
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error al encriptar la contraseña:", err);
  } else {
    console.log("Contraseña encriptada:", hash);
  }
});
