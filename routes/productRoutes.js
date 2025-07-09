const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const pool = require("../config/db"); 

// 🔍 Produse
router.get("/produse", productController.getAllProducts);
router.delete("/produse/:id", productController.deleteProduct);

// 📍 Locatii – daca nu ai alt fisier pentru ele
router.get("/locatii", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM locations");
    res.json(rows);
  } catch (err) {
    console.error("❌ Eroare la /locatii:", err);
    res.status(500).send("Eroare la încărcarea locațiilor.");
  }
});

module.exports = router;

