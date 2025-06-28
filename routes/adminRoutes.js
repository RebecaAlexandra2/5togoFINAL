const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const notificariController = require("../controllers/notificariController");
const verificaAutentificare = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");
const pool = require("../config/db");
const facturaController = require("../controllers/facturaController");


// =================== NOTIFICĂRI ===================
router.get("/notificari", verificaAutentificare, notificariController.getNotificari);
router.get("/notificari/necitite-count", verificaAutentificare, notificariController.countNotificariNecitite);
router.put("/notificari/:id", verificaAutentificare, notificariController.marcheazaNotificare);

// =================== INGREDIENTE ===================
router.get("/ingrediente", adminController.getIngrediente);
router.put("/ingrediente/:id", adminController.updateIngredientStoc);

// =================== LOCAȚII ===================
router.get("/locatii", verificaAutentificare, adminController.getLocatii);
router.post("/locatii", verificaAutentificare, adminController.adaugaLocatie);
router.put("/locatii/:id", verificaAutentificare, adminController.updateLocatie);
router.delete("/locatii/:id", verificaAutentificare, adminController.stergeLocatie);

// =================== COMENZI PENDING ===================
router.get("/comenzi-pending", verificaAutentificare, adminController.getComenziPending);

// =================== ALERTE & CERERI ===================
router.get("/alerte", verificaAutentificare, isAdmin, adminController.getAlerteStoc);
router.get("/cereri", verificaAutentificare, isAdmin, adminController.getCereriAprovizionare);

// ✅ NOU: APROVIZIONARE – POST pentru cereri
router.post("/cereri/aprovizioneaza", verificaAutentificare, isAdmin, adminController.aprovizioneazaCerere);

// =================== FACTURE ===================
router.get("/factura/:id", facturaController.genereazaFacturaPDF); // Temporar, fără autentificare

module.exports = router;
