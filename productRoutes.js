const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/produse", productController.getAllProducts);
router.post("/adauga-produs", productController.addProduct);
router.delete("/sterge-produs/:id", productController.deleteProduct);

module.exports = router;
