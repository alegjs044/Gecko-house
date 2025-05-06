const express = require("express");
const router = express.Router();
const authController = require("../Controllers/autenticar");

router.post("/login", authController.login);
router.post("/edit-user", authController.editUser);

module.exports = router;
