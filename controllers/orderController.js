const pool = require("../config/db");
const fidelitateService = require("./fidelitateService");

// ✅ Comandă cu verificare și scădere stoc
exports.placeOrder = async (req, res) => {
  const user_id = req.user.id;
  const { produse, location_id } = req.body;

  if (!produse || produse.length === 0) {
    return res.status(400).json({ message: "Comanda nu conține produse." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const totalIngrediente = {};

    for (const produs of produse) {
      const [ingrediente] = await connection.query(
        "SELECT ingredient_id, quantity FROM recipes WHERE product_id = ?",
        [produs.id]
      );

      for (const ing of ingrediente) {
        const cantitateTotala = ing.quantity * produs.quantity;
        totalIngrediente[ing.ingredient_id] = (totalIngrediente[ing.ingredient_id] || 0) + cantitateTotala;
      }
    }

    for (const [ingredientId, necesar] of Object.entries(totalIngrediente)) {
      const [[ingredient]] = await connection.query(
        "SELECT name, stock_quantity, minimum_stock, unit FROM ingredients WHERE id = ?",
        [ingredientId]
      );

      if (!ingredient) {
        throw new Error(`Ingredientul cu ID ${ingredientId} nu există.`);
      }

      const stocRamas = ingredient.stock_quantity - necesar;

      if (stocRamas < ingredient.minimum_stock) {
        // Salvează alertă pentru admin, dar NU trimite detalii clientului
        await connection.query(
          `INSERT INTO alerts (ingredient_id, name, current_stock, needed_stock, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [ingredientId, ingredient.name, ingredient.stock_quantity, necesar]
        );

        // Aruncă doar mesaj generic pentru client
        throw new Error("Stoc insuficient pentru unul dintre produsele selectate. Adminul a fost notificat.");
      }
    }

    for (const [ingredientId, cantitate] of Object.entries(totalIngrediente)) {
      await connection.query(
        "UPDATE ingredients SET stock_quantity = stock_quantity - ? WHERE id = ?",
        [cantitate, ingredientId]
      );
    }

    let total = 0;
    for (const p of produse) {
      total += p.price * p.quantity;
    }

    const status = "pending"; // Nu "completed"
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_price, status, created_at, location_id) VALUES (?, ?, ?, NOW(), ?)",
      [user_id, total, status, location_id]
    );

    const order_id = orderResult.insertId;

    for (const p of produse) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [order_id, p.id, p.quantity]
      );
    }

    await fidelitateService.acordaPuncteFidelitate(user_id, total, status);

    await connection.commit();
    return res.json({ message: `✅ Comandă plasată!` });

  } catch (err) {
    await connection.rollback();
    console.error("❌ Eroare la comanda:", err.message);
    return res.status(400).json({ message: err.message });
  } finally {
    connection.release();
  }
};

// 🔍 Verificare stoc
exports.verificaStoc = async (req, res) => {
  const { productId, cantitate } = req.params;

  try {
    const [ingrediente] = await pool.query(
      `SELECT i.name, r.quantity AS cantitate_per_unit, i.stock_quantity, i.minimum_stock, i.unit
       FROM recipes r
       JOIN ingredients i ON r.ingredient_id = i.id
       WHERE r.product_id = ?`,
      [productId]
    );

    for (const ing of ingrediente) {
      const totalNecesar = parseFloat(ing.cantitate_per_unit) * parseFloat(cantitate);
      const stocRamas = parseFloat(ing.stock_quantity) - totalNecesar;

      if (stocRamas < parseFloat(ing.minimum_stock)) {
        return res.status(400).json({ ok: false });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Eroare la verificarea stocului:", err);
    return res.status(500).json({ ok: false });
  }
};

exports.confirmOrder = async (req, res) => {
  const { order_id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query("SELECT user_id, total_price, status FROM orders WHERE id = ?", [order_id]);

    if (!order) {
      throw new Error("Comanda nu a fost găsită.");
    }

    if (["paid", "completed"].includes(order.status)) {
      return res.status(400).json({ message: "Comanda a fost deja confirmată." });
    }

    await connection.query("UPDATE orders SET status = 'paid' WHERE id = ?", [order_id]);

    await fidelitateService.acordaPuncteFidelitate(order.user_id, order.total_price, "paid");

    await connection.commit();
    return res.json({ message: "✅ Comanda a fost confirmată și punctele au fost acordate." });

  } catch (err) {
    await connection.rollback();
    console.error("Eroare la confirmarea comenzii:", err);
    return res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
};

exports.verificaStocComplet = async (req, res) => {
  const { produse } = req.body;

  if (!produse || produse.length === 0) {
    return res.status(400).json({ message: "Coșul este gol." });
  }

  try {
    const totalIngrediente = {};

    for (const produs of produse) {
      const [ingrediente] = await pool.query(
        "SELECT ingredient_id, quantity FROM recipes WHERE product_id = ?",
        [produs.id]
      );

      for (const ing of ingrediente) {
        const cantitateTotala = ing.quantity * produs.quantity;
        totalIngrediente[ing.ingredient_id] = (totalIngrediente[ing.ingredient_id] || 0) + cantitateTotala;
      }
    }

    for (const [ingredientId, necesar] of Object.entries(totalIngrediente)) {
      const [[ingredient]] = await pool.query(
        "SELECT name, stock_quantity, minimum_stock, unit FROM ingredients WHERE id = ?",
        [ingredientId]
      );

      if (!ingredient) continue;

      const stocRamas = ingredient.stock_quantity - necesar;

      if (stocRamas < ingredient.minimum_stock) {
        return res.status(400).json({ ok: false });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Eroare la comanda:", err.message);
    return res.status(400).json({ message: err.message }); // Asta păstrăm dinamic
  }
};