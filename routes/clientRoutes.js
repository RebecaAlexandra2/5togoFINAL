const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

router.get("/:id", clientController.afiseazaClient);
router.post("/:id/reward", clientController.confirmareRecompensa);

module.exports = router;