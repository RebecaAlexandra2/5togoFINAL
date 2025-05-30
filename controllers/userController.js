const pool = require("../config/db");
const bcrypt = require("bcryptjs"); // folosește bcryptjs pentru compatibilitate

// ✅ Înregistrare
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Completează toate câmpurile!" });

  try {
    const [exist] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exist.length)
      return res.status(409).json({ error: "Email deja folosit!" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role, fidelitate_tranzactii) VALUES (?, ?, ?, 'client', 0)",
      [username, email, hash]
    );
    res.json({ success: true, message: "Utilizator creat cu succes!" });
  } catch (err) {
    console.error("Eroare la înregistrare:", err);
    res.status(500).json({ error: "Eroare la înregistrare" });
  }
};

// ✅ Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Completează toate câmpurile!" });

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Email sau parolă greșită!" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Email sau parolă greșită!" });

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Eroare la login:", err);
    res.status(500).json({ error: "Eroare la login" });
  }
};

// ✅ Obține punctele de fidelitate pentru un client
exports.getFidelitatePuncte = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT name, fidelitate_tranzactii FROM users WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ name: rows[0].name, puncte: rows[0].fidelitate_tranzactii });
  } catch (err) {
    res.status(500).json({ error: "Eroare la citirea punctelor de fidelitate" });
  }
};

// ✅ Obține toți userii (pentru admin - coduri QR)
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, role FROM users WHERE role = 'client'");
    res.json(rows);
  } catch (err) {
    console.error("Eroare la getAllUsers:", err);
    res.status(500).json({ message: "Eroare la încărcarea utilizatorilor." });
  }
};

// ✅ Scade puncte după aplicarea unei recompense
exports.consumaPuncte = async (req, res) => {
  const { id } = req.params;
  const { puncte } = req.body;

  if (!puncte || puncte <= 0)
    return res.status(400).json({ message: "Puncte invalide." });

  try {
    const [userRows] = await pool.query("SELECT fidelitate_tranzactii FROM users WHERE id = ?", [id]);
    if (!userRows.length) return res.status(404).json({ message: "User inexistent." });

    const actuale = userRows[0].fidelitate_tranzactii;
    if (puncte > actuale)
      return res.status(400).json({ message: "Nu ai suficiente puncte." });

    // Scade punctele
    await pool.query("UPDATE users SET fidelitate_tranzactii = fidelitate_tranzactii - ? WHERE id = ?", [puncte, id]);

    // Înregistrează tranzacția în istoricul de fidelitate
    await pool.query(
      "INSERT INTO fidelitate_tranzactii (user_id, puncte, descriere) VALUES (?, ?, ?)",
      [id, -puncte, "Puncte consumate pentru recompensă"]
    );

    res.json({ message: "Punctele au fost scăzute și înregistrate." });
  } catch (err) {
    console.error("Eroare la consumaPuncte:", err);
    res.status(500).json({ message: "Eroare server." });
  }
};

// ✅ Returnează istoricul punctelor/recompenselor clientului
exports.getIstoricFidelitate = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, puncte, descriere, data FROM fidelitate_tranzactii 
       WHERE user_id = ? ORDER BY data DESC LIMIT 10`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Eroare la getIstoricFidelitate:", err);
    res.status(500).json({ message: "Eroare server la istoric." });
  }
};