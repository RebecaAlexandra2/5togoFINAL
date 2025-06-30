const pool = require("../config/db");
const fidelitateService = require("./fidelitateService");

const verificaSiGenereazaCerere = async (produsId, cantitateDorita) => {
  try {
    const [ingrediente] = await pool.query(`
      SELECT i.id AS ingredient_id, i.name, i.stock_quantity, i.minimum_stock, r.quantity AS necesar_per_unit
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.product_id = ?
    `, [produsId]);

    for (const ing of ingrediente) {
      const totalNecesar = ing.necesar_per_unit * cantitateDorita;
      const stocRamas = ing.stock_quantity - totalNecesar;

      if (stocRamas < ing.minimum_stock) {
        const cantitateRecomandata = Math.max(ing.minimum_stock * 2, totalNecesar);
        const deAprovizionat = Math.max(0, cantitateRecomandata - ing.stock_quantity);

        if (deAprovizionat <= 0) {
          console.log(`⚠️ Nu se generează cerere pentru ${ing.name}, stocul este suficient.`);
          continue;
        }

        // 🔹 Selectăm furnizorul corect
        const [[furnizor]] = await pool.query(`
          SELECT furnizor_id FROM ingrediente_furnizori WHERE ingredient_id = ?
        `, [ing.ingredient_id]);

        // 🔹 Verificăm dacă există deja o cerere
        const [existente] = await pool.query(`
          SELECT id FROM cereri_aprovizionare
          WHERE ingredient_id = ? AND status = 'neprocesat'
        `, [ing.ingredient_id]);

        if (existente.length > 0) {
          console.log(`🔹 Cerere deja existentă pentru ${ing.name}.`);
          continue;
        }

        // 🔹 Inserăm cererea cu furnizor corect
        await pool.query(
  `INSERT INTO cereri_aprovizionare
   (ingredient_id, furnizor_id, cantitate_necesara, data_cerere, status)
   VALUES (?, ?, ?, NOW(), 'neprocesat')`,
  [ing.ingredient_id, furnizor.furnizor_id, deAprovizionat]
);




        console.log(`✅ Cerere înregistrată pentru ${ing.name}, cantitate: ${deAprovizionat}.`);
      } else {
        console.log(`ℹ️ Ingredient ${ing.name} are stoc suficient (${ing.stock_quantity}), nu se face cerere.`);
      }
    }
  } catch (err) {
    console.error("❌ Eroare la verificarea cererii:", err);
  }
};



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
        await connection.rollback();

        const [[furnizor]] = await connection.query(
          `SELECT furnizor_id FROM ingrediente_furnizori WHERE ingredient_id = ?`,
          [ingredientId]
        );

        const numarFactura = "FTG-" + Date.now();
        const [facturaResult] = await connection.query(
          `INSERT INTO facturi (numar_factura, furnizor_id, total, data_factura)
           VALUES (?, ?, ?, NOW())`,
          [numarFactura, furnizor.furnizor_id, necesar]
        );
        const facturaId = facturaResult.insertId;

        await connection.query(
          `INSERT INTO factura_produse (factura_id, ingredient_id, cantitate)
           VALUES (?, ?, ?)`,
          [facturaId, ingredientId, necesar]
        );

        await connection.query(
          `INSERT INTO cereri_aprovizionare
           (ingredient_id, furnizor_id, cantitate_necesara, data_cerere, status, factura_id)
           VALUES (?, ?, ?, NOW(), 'neprocesat', ?)`,
          [ingredientId, furnizor.furnizor_id, necesar, facturaId]
        );

        const mesajAlert = `Lipsă stoc la ${ingredient.name}. Au rămas ${ingredient.stock_quantity}${ingredient.unit}, dar se cer ${necesar}${ingredient.unit}.`;

        const [existente] = await connection.query(
          `SELECT id FROM notificari 
           WHERE mesaj = ? 
           AND created_at >= NOW() - INTERVAL 10 MINUTE`,
          [mesajAlert]
        );

        if (existente.length === 0) {
          await connection.query(
            `INSERT INTO notificari (mesaj, status, created_at)
             VALUES (?, 'noua', NOW())`,
            [mesajAlert]
          );
        }

        return res.status(400).json({
          message: "Stoc insuficient. Factura și cererea au fost generate, adminul a fost notificat."
        });
      }
    }

    // Dacă stocurile sunt suficiente, actualizezi ingredientele:
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

    const status = "pending";
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
        // 🔔 Adaugă notificare în momentul detecției
        await pool.query(`
          INSERT INTO notificari (mesaj, status, created_at)
          VALUES (?, 'noua', NOW())
        `, [
          `Lipsă stoc la ${ing.name}. Au rămas ${ing.stock_quantity}${ing.unit}, dar se cer ${totalNecesar}${ing.unit}.`
        ]);

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
        totalIngrediente[ing.ingredient_id] =
          (totalIngrediente[ing.ingredient_id] || 0) + cantitateTotala;
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
        return res.status(400).json({
          ok: false,
          message: `Stoc insuficient: ${ingredient.name} – ${ingredient.stock_quantity}${ingredient.unit} în stoc, necesar: ${necesar}${ingredient.unit}.`
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ Eroare la verificarea stocului complet:", err.message);
    return res.status(500).json({
      ok: false,
      message: "Eroare internă la verificarea stocului."
    });
  }
};
  exports.verificaStocGlobalDetaliat = async (req, res) => {
  const { produse } = req.body;
  if (!produse || !Array.isArray(produse)) {
    return res.status(400).json({ succes: false, erori: ["Date invalide"] });
  }

  try {
    const totalIngrediente = {}; // Cheie = ingredient_id, valoare = total necesar

    for (const item of produse) {
      const [ingrediente] = await pool.query(`
        SELECT i.id, i.name AS ingredient, i.stock_quantity, i.minimum_stock, i.unit,
               r.quantity * ? AS necesar
        FROM recipes r
        JOIN ingredients i ON r.ingredient_id = i.id
        WHERE r.product_id = ?
      `, [item.quantity, item.product_id || item.id]);

      for (const ing of ingrediente) {
        if (!totalIngrediente[ing.id]) {
          totalIngrediente[ing.id] = {
            nume: ing.ingredient,
            unit: ing.unit,
            necesar: 0,
            stoc: ing.stock_quantity,
            minim: ing.minimum_stock
          };
        }
        totalIngrediente[ing.id].necesar += ing.necesar;
      }
    }

    const erori = [];

    for (const [id, info] of Object.entries(totalIngrediente)) {
      const ramas = info.stoc - info.necesar;
      if (ramas < info.minim) {
        erori.push({
          ingredient: info.nume,
          necesar: info.necesar,
          stoc: info.stoc,
          unitate: info.unit
        });
      }
    }

   if (erori.length > 0) {
  // ✅ Generează automat cerere de aprovizionare
  for (const item of produse) {
    await verificaSiGenereazaCerere(item.product_id || item.id, item.quantity);
  }

  return res.json({ succes: false, erori });
}


    return res.json({ succes: true });
  } catch (err) {
    console.error("Eroare verificare stoc global detaliat:", err);
    return res.status(500).json({ succes: false, erori: ["Eroare server"] });
  }
};

// Verifică toate ingredientele cu stoc sub minim și creează cerere aprovizionare
async function verificaSiCreeazaCereriAprovizionare() {
  try {
    // 1. Selectează toate ingredientele sub stoc minim
    const [ingrediente] = await pool.query(`
      SELECT i.id, i.name, i.stock_quantity, i.minimum_stock, f.furnizor_id, fr.nume_furnizor
      FROM ingredients i
      JOIN ingrediente_furnizori f ON i.id = f.ingredient_id
      JOIN furnizori fr ON f.furnizor_id = fr.id
      WHERE i.stock_quantity <= i.minimum_stock
    `);

    // 2. Dacă nu e nimic de aprovizionat, ieșim
    if (ingrediente.length === 0) {
      console.log("Nu există ingrediente sub stoc minim.");
      return;
    }

    // 3. Pentru fiecare ingredient, creăm cerere
    for (const ing of ingrediente) {
      // Opțional: verificăm dacă există deja o cerere neprocesată
      const [existente] = await pool.query(
        `SELECT id FROM cereri_aprovizionare
         WHERE ingredient_id = ? AND status = 'neprocesat'`,
        [ing.id]
      );
      if (existente.length > 0) {
        console.log(`Există deja o cerere pentru ${ing.name}.`);
        continue;
      }

      // 4. Insert cerere aprovizionare
    await pool.query(`
  INSERT INTO cereri_aprovizionare
  (ingredient_id, furnizor_id, cantitate_necesara, data_cerere, status)
  VALUES (?, ?, ?, NOW(), 'neprocesat')
`, [ing.id, ing.furnizor_id, ing.minimum_stock * 2]);



      console.log(`Cerere aprovizionare creată pentru ${ing.name}.`);

      // 5. Insert notificare
      await pool.query(
        `INSERT INTO notificari
         (mesaj, tip, citita, data)
         VALUES (?, 'aprovizionare', 0, NOW())`,
        [`Stoc redus: ${ing.name}. A fost generată cererea de aprovizionare.`]
      );
    }
  } catch (err) {
    console.error("Eroare la verificarea stocurilor:", err);
  }
}

exports.confirmareAprovizionare = async (req, res) => {
  const { id } = req.params;
  await pool.query(`
    UPDATE cereri_aprovizionare SET status='procesat'
    WHERE id=?
  `, [id]);
  res.json({ message: "Cererea a fost procesată." });
};