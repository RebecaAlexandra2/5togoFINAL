
const pool = require("../config/db"); // pentru query-uri cu pool.query(...)

// ======================== INGREDIENTE ========================

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
    console.error("Eroare updateIngredientStoc:", err);
    res.status(500).json({ message: "Eroare la actualizarea stocului." });
  }
};

// ======================== LOCATII ========================

exports.getLocatii = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM locations ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Eroare getLocatii:", err);
    res.status(500).send("Eroare server la locații.");
  }
};

exports.adaugaLocatie = async (req, res) => {
  const { name, address, phone } = req.body;
  try {
    await pool.query(
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
    await pool.query(sql, [valoare, id]);
    res.json({ message: "Locație actualizată." });
  } catch (err) {
    console.error("Eroare updateLocatie:", err);
    res.status(500).send("Eroare la actualizarea locației.");
  }
};

exports.stergeLocatie = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM locations WHERE id = ?", [id]);
    res.json({ message: "Locație ștearsă." });
  } catch (err) {
    console.error("Eroare stergeLocatie:", err);
    res.status(500).send("Eroare la ștergerea locației.");
  }
};

// ======================== COMENZI PENDING ========================

exports.getComenziPending = async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      SELECT a.id, i.name AS ingredient, a.current_stock, a.needed_stock, a.status, a.created_at
      FROM alerts a
      JOIN ingredients i ON a.produs_id = i.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Eroare la preluarea alertelor:", err);
    res.status(500).json({ message: "Eroare la preluarea alertelor." });
  }
};

exports.getCereriAprovizionare = async (req, res) => {
  try {
    const [cereri] = await pool.query(`
      SELECT c.id, c.ingredient_id, i.name AS ingredient, c.cantitate_necesara, 
             c.status, c.data_cerere, c.factura_id
      FROM cereri_aprovizionare c
      JOIN ingredients i ON c.ingredient_id = i.id
      WHERE c.cantitate_necesara > 0
      ORDER BY c.data_cerere DESC
    `);
    res.json(cereri);
  } catch (err) {
    console.error("❌ Eroare la getCereriAprovizionare:", err.message);
    res.status(500).json({ message: "Eroare la încărcarea cererilor." });
  }
};


exports.aprovizioneazaCerere = async (req, res) => {
  const { cerereId, ingredientId, cantitate } = req.body;

  if (cantitate <= 0) {
    return res.status(400).json({ message: "Cantitatea trebuie să fie un număr pozitiv." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Creeaza factura
    const numarFactura = "FTG-" + Date.now();
    const [facturaResult] = await connection.query(`
      INSERT INTO facturi (numar_factura, furnizor_id, total, data_factura)
      VALUES (?, ?, ?, NOW())
    `, [numarFactura, 1, cantitate]);

    const facturaId = facturaResult.insertId;
    if (!facturaId) throw new Error("Factura nu a putut fi generată.");

    // 2. Leaga cererea de factura si setează statusul la FINALIZATA
    await connection.query(`
      UPDATE cereri_aprovizionare
      SET status = 'finalizata', factura_id = ?
      WHERE id = ?
    `, [facturaId, cerereId]);

    // 3. Actualizeaza stocul ingredientului
    await connection.query(`
      UPDATE ingredients
      SET stock_quantity = stock_quantity + ?
      WHERE id = ?
    `, [cantitate, ingredientId]);

    // 4. Adauga linia in factura_produse
    await connection.query(`
      INSERT INTO factura_produse (factura_id, ingredient_id, cantitate)
      VALUES (?, ?, ?)
    `, [facturaId, ingredientId, cantitate]);

    await connection.commit();
    res.json({
      message: "✅ Ingredient aprovizionat și factura generată.",
      factura_id: facturaId
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Eroare la aprovizionare:", err.message);
    res.status(500).json({ message: "Eroare la aprovizionare: " + err.message });
  } finally {
    connection.release();
  }
};


