const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const pool = require("../config/db"); // dacă ai nevoie pentru ruta /locatii

// 🔍 Produse
router.get("/produse", productController.getAllProducts);
router.delete("/produse/:id", productController.deleteProduct);

// 📍 Locații – dacă nu ai alt fișier pentru ele
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

