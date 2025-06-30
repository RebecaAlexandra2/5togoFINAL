const express = require("express");
const router = express.Router();
const raportController = require("../controllers/raportController");
const raportEconomicController = require("../controllers/raportEconomicProductie");


router.get("/raport/vanzari-30-zile", raportController.vanzariUltimele30Zile);
router.get("/raport/top-produse", raportController.topProduseVandute); // ✅ Asta trebuie să fie prezentă
router.get("/raport/utilizatori-activi", raportController.utilizatoriActivi);
router.get("/raport/total-venituri", raportController.totalVenituri);
router.get("/raport/dashboard", raportController.dashboardInfo);
router.get("/raport/locatii", raportController.vanzariPeLocatii);
router.get("/raport/vanzari-perioada", raportController.vanzariPerioada);
router.get("/economic-pdf", raportEconomicController.genereazaRaportEconomic);


module.exports = router;
