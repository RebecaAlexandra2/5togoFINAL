const connection = require("../config/db");

exports.getNotificari = async (req, res) => {
  try {
    const [rows] = await connection.execute(`
      SELECT id, mesaj, status, created_at
      FROM notificari
      ORDER BY created_at DESC
    `);
    res.json(rows); // Deja e array de obiecte
  } catch (err) {
    console.error("Eroare la getNotificari:", err);
    res.status(500).json({ message: "Eroare la notificări." });
  }
};

exports.marcheazaNotificare = async (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  if (!["rezolvat", "in_asteptare", "noua"].includes(status)) {
    return res.status(400).json({ message: "Status invalid." });
  }

  try {
    await connection.execute(`
      UPDATE notificari
      SET status = ?
      WHERE id = ?
    `, [status, id]);

    res.json({ message: "Statusul notificării a fost actualizat." });
  } catch (err) {
    console.error("Eroare la marcheazaNotificare:", err);
    res.status(500).json({ message: "Eroare la actualizare status." });
  }
};

exports.countNotificariNecitite = async (req, res) => {
  try {
    const [rows] = await connection.execute(`
      SELECT COUNT(*) AS necitite
      FROM notificari
      WHERE status = 'noua'
    `);
    res.json({ count: rows[0].necitite });
  } catch (err) {
    console.error("Eroare la countNotificariNecitite:", err);
    res.status(500).json({ message: "Eroare la numărare notificări." });
  }
};