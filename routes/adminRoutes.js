const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/ingrediente", adminController.getIngrediente);
router.put("/ingrediente/:id", adminController.updateIngredientStoc);

module.exports = router;