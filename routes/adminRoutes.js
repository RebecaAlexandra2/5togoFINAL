const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const verificaAutentificare = require("../middlewares/authMiddleware"); // ✅ Adaugă această linie

router.get("/ingrediente", adminController.getIngrediente);
router.put("/ingrediente/:id", adminController.updateIngredientStoc);
router.get("/locatii", verificaAutentificare, adminController.getLocatii);
router.post("/locatii", verificaAutentificare, adminController.adaugaLocatie);
router.put("/locatii/:id", verificaAutentificare, adminController.updateLocatie);
router.delete("/locatii/:id", verificaAutentificare, adminController.stergeLocatie);

module.exports = router;