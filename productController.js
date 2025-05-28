const pool = require("../config/db");

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, price, gramaj FROM products");
    res.json(rows);
  } catch (err) {
    console.error("❌ Eroare la getAllProducts:", err);
    res.status(500).send("Eroare server");
  }
};

exports.addProduct = async (req, res) => {
  const { name, price, gramaj } = req.body;
  try {
    await pool.query(
      "INSERT INTO products (name, price, gramaj) VALUES (?, ?, ?)",
      [name, price, gramaj]
    );
    res.send("✅ Produs adăugat!");
  } catch (err) {
    console.error("❌ Eroare la addProduct:", err);
    res.status(500).send("Eroare server");
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    res.send("✅ Produs șters!");
  } catch (err) {
    console.error("❌ Eroare la deleteProduct:", err);
    res.status(500).send("Eroare server");
  }
};
