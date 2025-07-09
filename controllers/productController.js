const pool = require("../config/db");

exports.getAllProducts = async (req, res) => {
  try {
    // Ia toate produsele
    const [produse] = await pool.query("SELECT * FROM products");

    // Pentru fiecare produs, atasează reteta (ingredientele)
    for (let produs of produse) {
      const [reteta] = await pool.query(
        `SELECT i.name AS ingredient, r.quantity AS cantitate, i.unit AS unit
         FROM recipes r
         JOIN ingredients i ON r.ingredient_id = i.id
         WHERE r.product_id = ?`,
        [produs.id]
      );
      produs.reteta = reteta;
    }

    res.json(produse);
  } catch (err) {
    console.error("❌ Eroare la getAllProducts:", err);
    res.status(500).json({ error: "Eroare server" });
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
