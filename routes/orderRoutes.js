const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/comanda", orderController.createOrder);

module.exports = router;
