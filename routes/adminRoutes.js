const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const verificaAutentificare = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware"); // ✅ Ai nevoie de asta!
const notificariController = require("../controllers/notificariController");

// Notificări
router.get("/notificari", verificaAutentificare, notificariController.getNotificari);
router.get("/notificari/necitite-count", verificaAutentificare, notificariController.countNotificariNecitite);
router.put("/notificari/:id", verificaAutentificare, notificariController.marcheazaNotificare);
router.get("/ingrediente", adminController.getIngrediente);
router.put("/ingrediente/:id", adminController.updateIngredientStoc);
router.get("/locatii", verificaAutentificare, adminController.getLocatii);
router.post("/locatii", verificaAutentificare, adminController.adaugaLocatie);
router.put("/locatii/:id", verificaAutentificare, adminController.updateLocatie);
router.delete("/locatii/:id", verificaAutentificare, adminController.stergeLocatie);
router.get("/comenzi-pending", verificaAutentificare, adminController.getComenziPending);
router.get("/alerte", verificaAutentificare, isAdmin, adminController.getAlerteStoc);
module.exports = router;