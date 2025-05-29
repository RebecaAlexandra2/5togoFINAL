const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Rute pentru autentificare și creare cont
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/:id/puncte", userController.getFidelitatePuncte);

module.exports = router;
