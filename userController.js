const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  const { nume, email, parola } = req.body;
  try {
    const hash = await bcrypt.hash(parola, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [nume, email, hash]
    );
    res.send("✅ Utilizator înregistrat!");
  } catch (err) {
    res.status(500).send("Eroare la înregistrare");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Email inexistent" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Parolă incorectă" });

    res.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).send("Eroare la login");
  }
};
