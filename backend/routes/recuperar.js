const express = require("express");
const router = express.Router();
const controller = require("../Controllers/recuperacion");

router.post("/recover-password", controller.recoverPassword);
router.post("/reset-password", controller.resetPassword);

module.exports = router;
