const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verificaAutentificare = require("../middlewares/authMiddleware");
const { isAdmin, verificaNuEsteAdmin } = require("../middlewares/adminMiddleware");

// ✅ Ruta POST - doar clientii pot plasa comenzi
router.post(
  "/comanda",
  verificaAutentificare,
  verificaNuEsteAdmin,
  orderController.placeOrder
);

// ✅ Ruta GET - verificare stoc produs
router.get("/verifica-stoc/:productId/:cantitate", orderController.verificaStoc);
router.post("/verifica-stoc-complet", orderController.verificaStocComplet);
router.post("/verifica-stoc-global-detaliat", orderController.verificaStocGlobalDetaliat);
// ✅ Ruta PUT - confirmare comanda de catre admin
router.put(
  "/orders/:order_id/confirm",
  verificaAutentificare,
  isAdmin,
  orderController.confirmOrder
);

module.exports = router;