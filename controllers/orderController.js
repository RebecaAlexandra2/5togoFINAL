const pool = require("../config/db");

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

    // 🔢 Calculează ingredientele totale necesare pentru întreaga comandă
    const totalIngrediente = {};

    for (const produs of produse) {
      const [ingrediente] = await connection.query(
        `SELECT ingredient_id, quantity FROM recipes WHERE product_id = ?`,
        [produs.id]
      );

      for (const ing of ingrediente) {
        const cantitateTotala = ing.quantity * produs.quantity;

        if (!totalIngrediente[ing.ingredient_id]) {
          totalIngrediente[ing.ingredient_id] = 0;
        }
        totalIngrediente[ing.ingredient_id] += cantitateTotala;
      }
    }

    // 🚨 Verifică dacă ingredientele sunt suficiente și rămâne peste minimum_stock
    for (const [ingredientId, necesar] of Object.entries(totalIngrediente)) {
      const [[ingredient]] = await connection.query(
        `SELECT name, stock_quantity, minimum_stock, unit FROM ingredients WHERE id = ?`,
        [ingredientId]
      );

      if (!ingredient) {
        throw new Error(`Ingredientul cu ID ${ingredientId} nu există.`);
      }

      const stocRamas = ingredient.stock_quantity - necesar;

      if (stocRamas < ingredient.minimum_stock) {
        throw new Error(
          `❌ Stoc insuficient pentru ${ingredient.name}:
          • Ai în stoc: ${ingredient.stock_quantity}${ingredient.unit}
          • Comanda cere: ${necesar}${ingredient.unit}
          • Ar rămâne: ${stocRamas}${ingredient.unit}
          • Minim permis: ${ingredient.minimum_stock}${ingredient.unit}`
        );
      }
    }

    // 🧮 Scade din stoc ingredientele necesare
    for (const [ingredientId, cantitate] of Object.entries(totalIngrediente)) {
      await connection.query(
        `UPDATE ingredients SET stock_quantity = stock_quantity - ? WHERE id = ?`,
        [cantitate, ingredientId]
      );
    }

    // 💾 Salvează comanda
    let total = 0;
    for (const p of produse) {
      total += p.price * p.quantity;
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_price, status, created_at, location_id)
       VALUES (?, ?, 'completed', NOW(), ?)`,
      [user_id, total, location_id]
    );

    const order_id = orderResult.insertId;

    // 🛒 Adaugă produsele în order_items
    for (const p of produse) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)`,
        [order_id, p.id, p.quantity]
      );
    }

    // 🎁 Puncte de fidelitate
    const puncte = Math.floor(total);
    await connection.query(
      `UPDATE users SET fidelitate_tranzactii = fidelitate_tranzactii + ? WHERE id = ?`,
      [puncte, user_id]
    );
    await connection.query(
      `INSERT INTO fidelitate_tranzactii (user_id, puncte, descriere)
       VALUES (?, ?, 'Comandă nouă')`,
      [user_id, puncte]
    );

    await connection.commit();
    return res.json({ message: `✅ Comandă plasată! Ai câștigat ${puncte} puncte.` });

  } catch (err) {
    await connection.rollback();
    console.error("❌ Eroare la comanda:", err.message);
    return res.status(400).json({ message: err.message });
  } finally {
    connection.release();
  }
};

// 🔍 Verificare stoc pentru un produs + cantitate (rămâne neschimbată)
exports.verificaStoc = async (req, res) => {
  const { productId, cantitate } = req.params;

  try {
    const ingrediente = await pool.query(
      `SELECT i.name, r.quantity AS cantitate_per_unit, i.stock_quantity, i.minimum_stock, i.unit
       FROM recipes r
       JOIN ingredients i ON r.ingredient_id = i.id
       WHERE r.product_id = ?`,
      [productId]
    );

    for (const ing of ingrediente[0]) {
      const totalNecesar = parseFloat(ing.cantitate_per_unit) * parseFloat(cantitate);
      const stocRamas = parseFloat(ing.stock_quantity) - totalNecesar;

      if (stocRamas < parseFloat(ing.minimum_stock)) {
        return res.status(400).json({
          ok: false,
          message: `Stoc insuficient pentru ingredientul ${ing.name}. 
          Ai ${ing.stock_quantity}${ing.unit}, comanda cere ${totalNecesar}${ing.unit}, 
          dar trebuie să rămână minim ${ing.minimum_stock}${ing.unit}.`
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Eroare la verificarea stocului:", err);
    return res.status(500).json({ ok: false, message: "Eroare server la verificarea stocului." });
  }
};