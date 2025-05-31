const pool = require("../config/db");

exports.acordaPuncteFidelitate = async (user_id, total, status) => {
  if (["completed", "paid"].includes(status)) {
    const puncte = Math.floor(total);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE users SET fidelitate_tranzactii = fidelitate_tranzactii + ? WHERE id = ?",
        [puncte, user_id]
      );

      await connection.query(
        "INSERT INTO fidelitate_tranzactii (user_id, puncte, descriere) VALUES (?, ?, 'Comandă nouă')",
        [user_id, puncte]
      );

      await connection.commit();
      return puncte;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  return 0;
};