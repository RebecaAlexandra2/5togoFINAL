const db = require("../config/db"); // ✅ folosește conexiunea mysql2/promise
const pool = require("../config/db"); // pentru query-uri cu pool.query(...)
// ======================== INGREDIENTE ========================

exports.getIngrediente = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, stock_quantity, unit FROM ingredients");
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
    await db.query("UPDATE ingredients SET stock_quantity = ? WHERE id = ?", [cantitateNoua, id]);
    res.json({ message: "Stoc actualizat cu succes." });
  } catch (err) {
    console.error("Eroare updateIngredientStoc:", err);
    res.status(500).json({ message: "Eroare la actualizarea stocului." });
  }
};



// ======================== INGREDIENTE ========================

exports.getIngrediente = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, stock_quantity, unit FROM ingredients");
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
    await db.query("UPDATE ingredients SET stock_quantity = ? WHERE id = ?", [cantitateNoua, id]);
    res.json({ message: "Stoc actualizat cu succes." });
  } catch (err) {
    console.error("Eroare updateIngredientStoc:", err);
    res.status(500).json({ message: "Eroare la actualizarea stocului." });
  }
};

// ======================== LOCAȚII ========================

exports.getLocatii = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM locations ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Eroare getLocatii:", err);
    res.status(500).send("Eroare server la locații.");
  }
};

exports.adaugaLocatie = async (req, res) => {
  const { name, address, phone } = req.body;
  try {
    await db.query(
      "INSERT INTO locations (name, address, phone) VALUES (?, ?, ?)",
      [name, address, phone]
    );
    res.json({ message: "Locație adăugată." });
  } catch (err) {
    console.error("Eroare adaugaLocatie:", err);
    res.status(500).send("Eroare la adăugarea locației.");
  }
};

exports.updateLocatie = async (req, res) => {
  const { id } = req.params;
  const camp = Object.keys(req.body)[0];
  const valoare = Object.values(req.body)[0];
  try {
    const sql = `UPDATE locations SET \`${camp}\` = ? WHERE id = ?`;
    await db.query(sql, [valoare, id]);
    res.json({ message: "Locație actualizată." });
  } catch (err) {
    console.error("Eroare updateLocatie:", err);
    res.status(500).send("Eroare la actualizarea locației.");
  }
};

exports.stergeLocatie = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM locations WHERE id = ?", [id]);
    res.json({ message: "Locație ștearsă." });
  } catch (err) {
    console.error("Eroare stergeLocatie:", err);
    res.status(500).send("Eroare la ștergerea locației.");
  }
};

// ======================== COMENZI PENDING ========================

exports.getComenziPending = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.id, o.total_price, o.status, u.name AS nume_client
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Eroare getComenziPending:", err);
    res.status(500).json({ message: "Eroare la preluarea comenzilor în așteptare." });
  }
};

// ✅ Alerte stoc insuficient
exports.getAlerteStoc = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, current_stock, needed_stock, created_at
      FROM alerts
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Eroare la preluarea alertelor:", err);
    res.status(500).json({ message: "Eroare la preluarea alertelor." });
  }
};