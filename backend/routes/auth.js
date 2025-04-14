const express = require("express");
const router = express.Router();
const authController = require("../Controllers/autenticar");

router.post("/login", authController.login);
router.post("/registro", authController.register);
router.post("/edit-user", authController.editUser);

module.exports = router;
