const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verificaAutentificare = require("../middlewares/authMiddleware");
const { isAdmin, verificaNuEsteAdmin } = require("../middlewares/adminMiddleware");

// ✅ Ruta POST - doar clienții pot plasa comenzi
router.post(
  "/comanda",
  verificaAutentificare,
  verificaNuEsteAdmin,
  orderController.placeOrder
);

// ✅ Ruta GET - verificare stoc produs
router.get("/verifica-stoc/:productId/:cantitate", orderController.verificaStoc);

// ✅ Ruta PUT - confirmare comandă de către admin
router.put(
  "/orders/:order_id/confirm",
  verificaAutentificare,
  isAdmin,
  orderController.confirmOrder
);

module.exports = router;