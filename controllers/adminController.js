const pool = require("../config/db");

exports.getIngrediente = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, stock_quantity, unit FROM ingredients");
    res.json(rows);
  } catch (err) {
    console.error("EROARE ingrediente:", err);
    res.status(500).json({ message: "Eroare la încărcarea ingredientelor." });
  }
};

exports.updateIngredientStoc = async (req, res) => {
  const { id } = req.params;
  const { cantitateNoua } = req.body;

  try {
    await pool.query("UPDATE ingredients SET stock_quantity = ? WHERE id = ?", [cantitateNoua, id]);
    res.json({ message: "Stoc actualizat cu succes." });
  } catch (err) {
    res.status(500).json({ message: "Eroare la actualizarea stocului." });
  }
};