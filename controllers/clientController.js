const pool = require("../config/db");

exports.afiseazaClient = async (req, res) => {
  const { id } = req.params;
  const [[user]] = await pool.query(
    `SELECT name, fidelitate_tranzactii FROM users WHERE id = ?`,
    [id]
  );

  if (!user) {
    return res.status(404).send("<h2>❌ Utilizator inexistent.</h2>");
  }

  let recompensa = "";
  if (user.fidelitate_tranzactii >= 100) {
    recompensa = "30% reducere la comandă!";
  } else if (user.fidelitate_tranzactii >= 50) {
    recompensa = "1 băutură gratuită!";
  } else {
    recompensa = "Continuă să aduni puncte!";
  }

  res.send(`
    <h2>👤 ${user.name}</h2>
    <p>Puncte de fidelitate: <strong>${user.fidelitate_tranzactii}</strong></p>
    <p>🎁 Recompensă: ${recompensa}</p>
    ${
      user.fidelitate_tranzactii >= 50
        ? `<form method="POST" action="/client/${id}/reward">
             <button type="submit">✅ Confirmă acordarea recompensei</button>
           </form>`
        : ""
    }
  `);
};

exports.confirmareRecompensa = async (req, res) => {
  const { id } = req.params;
  const [[user]] = await pool.query(`SELECT fidelitate_tranzactii FROM users WHERE id = ?`, [id]);

  if (!user || user.fidelitate_tranzactii < 50) {
    return res.send("❌ Utilizatorul nu are suficiente puncte pentru recompensă.");
  }

  const puncteDeScazut = user.fidelitate_tranzactii >= 100 ? 100 : 50;

  await pool.query(
    `UPDATE users SET fidelitate_tranzactii = fidelitate_tranzactii - ? WHERE id = ?`,
    [puncteDeScazut, id]
  );

  await pool.query(
    `INSERT INTO fidelitate_tranzactii (user_id, puncte, descriere) VALUES (?, ?, ?)`,
    [id, -puncteDeScazut, "Recompensă acordată"]
  );

  res.send("✅ Recompensa a fost acordată cu succes și punctele au fost scăzute.");
};