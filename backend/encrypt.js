const bcrypt = require("bcryptjs");

const password = "S#cUr3P@ssw0rd!92"; // Cámbiala por algo fuerte
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error al encriptar:", err);
  } else {
    console.log("Hash generado:", hash);
  }
});
