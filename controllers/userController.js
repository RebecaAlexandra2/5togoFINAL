const pool = require("../config/db");
const bcrypt = require("bcryptjs"); // folosește bcryptjs pentru compatibilitate

exports.register = async (req, res) => {
  // La frontend trimitem { username, email, password }
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Completează toate câmpurile!" });

  try {
    // Verifică dacă email-ul există deja
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

exports.login = async (req, res) => {
  // La frontend trimitem { email, password }
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

    // Returnează userul, fără parolă
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Eroare la login:", err);
    res.status(500).json({ error: "Eroare la login" });
  }
};
exports.getFidelitatePuncte = async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT fidelitate_tranzactii FROM users WHERE id = ?",
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "User not found" });
      res.json({ puncte: rows[0].fidelitate_tranzactii });
    } catch (err) {
      res.status(500).json({ error: "Eroare la citirea punctelor de fidelitate" });
    }
  };
  
