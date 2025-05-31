const pool = require("../config/db");

function perioadaSQL(req, defaultInterval = "30 DAY") {
  let where = `o.created_at >= CURDATE() - INTERVAL ${defaultInterval}`;
  let params = [];

  // Acceptă și startDate, endDate (camelCase din frontend)
  const { startDate, endDate } = req.query;
  if (startDate && endDate) {
    where = `o.created_at BETWEEN ? AND ?`;
    params = [startDate, endDate];
  }

  return { where, params };
}

// 1. Vânzări
exports.vanzariUltimele30Zile = async (req, res) => {
  try {
    const { where, params } = perioadaSQL(req);
    const [rows] = await pool.query(`
      SELECT 
        DATE(o.created_at) AS data,
        COUNT(*) AS numar_comenzi,
        SUM(o.total_price) AS valoare_totala
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
      GROUP BY DATE(o.created_at)
      ORDER BY data DESC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).send("Eroare la generarea raportului.");
  }
};

// 2. Top produse
exports.topProduseVandute = async (req, res) => {
  try {
    const { where, params } = perioadaSQL(req);
    const [rows] = await pool.query(`
      SELECT 
        p.name AS produs,
        SUM(oi.quantity) AS total_vandut
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
      GROUP BY p.id
      ORDER BY total_vandut DESC
      LIMIT 5
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).send("Eroare la generarea raportului.");
  }
};

// 3. Utilizatori activi
exports.utilizatoriActivi = async (req, res) => {
  try {
    const { where, params } = perioadaSQL(req);
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(o.id) AS numar_comenzi
      FROM users u
      JOIN orders o ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
      GROUP BY u.id
      ORDER BY numar_comenzi DESC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).send("Eroare la generarea raportului.");
  }
};

// 4. Total venituri
exports.totalVenituri = async (req, res) => {
  try {
    const { where, params } = perioadaSQL(req);
    const [rows] = await pool.query(`
      SELECT 
        SUM(o.total_price) AS total_venit
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
    `, params);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send("Eroare la calculul veniturilor.");
  }
};

// 5. Dashboard info
exports.dashboardInfo = async (req, res) => {
  try {
    const { where, params } = perioadaSQL(req);

    const [[venituri]] = await pool.query(`
      SELECT SUM(o.total_price) AS total_venit
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
    `, params);

    const [[comenzi]] = await pool.query(`
      SELECT COUNT(*) AS total_comenzi
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
    `, params);

    const [[utilizatori]] = await pool.query(`
      SELECT COUNT(DISTINCT o.user_id) AS utilizatori_activi
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
    `, params);

    const [[topProdus]] = await pool.query(`
      SELECT p.name AS produs, SUM(oi.quantity) AS total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
      GROUP BY p.id
      ORDER BY total DESC
      LIMIT 1
    `, params);

    res.json({
      total_venit: parseFloat(venituri.total_venit) || 0,
      total_comenzi: comenzi.total_comenzi,
      utilizatori_activi: utilizatori.utilizatori_activi,
      top_produs: topProdus ? topProdus.produs : "–"
    });
  } catch (err) {
    res.status(500).send("Eroare la dashboard.");
  }
};

// 6. Vânzări pe locații
exports.vanzariPeLocatii = async (req, res) => {
  try {
    const { where, params } = perioadaSQL(req);
    const [rows] = await pool.query(`
      SELECT 
        l.name AS locatie,
        COUNT(o.id) AS numar_comenzi,
        SUM(o.total_price) AS total_vanzari
      FROM orders o
      JOIN locations l ON o.location_id = l.id
      JOIN users u ON o.user_id = u.id
      WHERE ${where}
        AND u.role = 'client'
        AND o.status = 'completed'
      GROUP BY l.id
      ORDER BY total_vanzari DESC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).send("Eroare la generarea raportului pe locații.");
  }
};

// 7. Vânzări într-o perioadă selectată (pentru filtrare)
exports.vanzariPerioada = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Datele de început și sfârșit sunt necesare." });
  }

  try {
    const [rows] = await pool.query(`
      SELECT 
        o.created_at AS data,
        COUNT(*) AS numar_comenzi,
        SUM(o.total_price) AS valoare_totala
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.created_at BETWEEN ? AND ?
        AND u.role = 'client'
        AND o.status = 'completed'
      GROUP BY o.created_at
      ORDER BY o.created_at DESC
    `, [startDate, endDate]);

    res.json(rows);
  } catch (err) {
    console.error("Eroare la vanzariPerioada:", err);
    res.status(500).json({ message: "Eroare la filtrarea vânzărilor." });
  }
};
