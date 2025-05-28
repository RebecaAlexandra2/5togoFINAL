const pool = require("../config/db");

exports.createOrder = async (req, res) => {
  const { user_id, produse } = req.body;

  if (!produse || produse.length === 0) {
    return res.status(400).json({ message: "Comanda nu conține produse." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let total = 0;

    // calculează total comanda
    for (const p of produse) {
      total += p.price * p.quantity;
    }

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_price, status, created_at) VALUES (?, ?, 'completed', NOW())",
      [user_id, total]
    );

    const order_id = orderResult.insertId;

    for (const p of produse) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [order_id, p.id, p.quantity]
      );
    }

    // actualizează puncte fidelitate (1 punct / leu)
    const puncte = Math.floor(total);
    await connection.query(
      "UPDATE users SET fidelitate_puncte = fidelitate_puncte + ? WHERE id = ?",
      [puncte, user_id]
    );

    await connection.query(
      "INSERT INTO fidelitate_tranzactii (user_id, puncte, descriere) VALUES (?, ?, 'Comandă nouă')",
      [user_id, puncte]
    );

    await connection.commit();
    res.json({ message: `✅ Comandă plasată! Ai câștigat ${puncte} puncte.` });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Eroare la comanda:", err);
    res.status(500).send("Eroare la plasarea comenzii.");
  } finally {
    connection.release();
  }
};
