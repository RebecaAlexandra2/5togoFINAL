const pool = require("../config/db");

exports.vanzariUltimele30Zile = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE(created_at) AS data,
        COUNT(*) AS numar_comenzi,
        SUM(total_price) AS valoare_totala
      FROM orders
      WHERE created_at >= CURDATE() - INTERVAL 30 DAY
      GROUP BY DATE(created_at)
      ORDER BY data DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Eroare raport 30 zile:", err);
    res.status(500).send("Eroare la generarea raportului.");
  }
};

exports.topProduseVandute = async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          p.name AS produs,
          SUM(oi.quantity) AS total_vandut
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY total_vandut DESC
        LIMIT 5
      `);
      res.json(rows);
    } catch (err) {
      console.error("❌ Eroare top produse:", err);
      res.status(500).send("Eroare la generarea raportului.");
    }
  };
  