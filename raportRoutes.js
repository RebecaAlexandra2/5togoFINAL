const express = require("express");
const router = express.Router();
const raportController = require("../controllers/raportController");

router.get("/raport/vanzari-30-zile", raportController.vanzariUltimele30Zile);
router.get("/raport/top-produse", raportController.topProduseVandute); // ✅ Asta trebuie să fie prezentă

module.exports = router;
