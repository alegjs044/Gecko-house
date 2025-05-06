// routes/dev.js
const express = require("express");
const router = express.Router();
const { crearUsuarioTemporal } = require("../Controllers/dev");

router.post("/crear-temporal", crearUsuarioTemporal);

module.exports = router;
