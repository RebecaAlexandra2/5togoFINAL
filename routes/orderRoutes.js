// orderRoutes.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

const verificaAutentificare = require("../middlewares/authMiddleware");
const verificaAdmin = require("../middlewares/adminMiddleware");

// Ruta POST comanda - utilizator autenticat (dar nu admin)
router.post(
  "/comanda",
  verificaAutentificare,
  async (req, res, next) => {
    // Blochează accesul adminilor la plasarea comenzilor
    if (req.user && req.user.role === "admin") {
      return res.status(403).json({ mesaj: "Doar clienții pot plasa comenzi." });
    }
    next();
  },
  orderController.placeOrder // logica completă de verificare + stoc
);

// Ruta GET pentru verificarea stocului unui produs (opțională)
router.get("/verifica-stoc/:productId/:cantitate", orderController.verificaStoc);

module.exports = router;
