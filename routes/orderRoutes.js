const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

const verificaAutentificare = require("../middlewares/authMiddleware");
const verificaAdmin = require("../middlewares/adminMiddleware");

// Ruta POST comanda, cu middleware-urile aplicate
router.post("/comanda", verificaAutentificare, verificaAdmin, orderController.createOrder);

module.exports = router;
