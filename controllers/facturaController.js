const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

exports.genereazaFacturaPDF = async (req, res) => {
  const { id } = req.params;

  try {
    const [[factura]] = await pool.query(`
      SELECT f.id, f.numar_factura, f.data_factura, f.total,
             fr.nume_furnizor AS furnizor, fr.email, fr.telefon
      FROM facturi f
      JOIN furnizori fr ON f.furnizor_id = fr.id
      WHERE f.id = ?
    `, [id]);

    if (!factura) return res.status(404).json({ message: "Factura nu există." });

    const [produse] = await pool.query(`
      SELECT i.name AS ingredient, fp.cantitate AS cantitate, i.unit
      FROM factura_produse fp
      JOIN ingredients i ON fp.ingredient_id = i.id
      WHERE fp.factura_id = ?
    `, [id]);

    const [bauturiRows] = await pool.query(`
      SELECT DISTINCT p.name AS bautura
      FROM factura_produse fp
      JOIN recipes r ON fp.ingredient_id = r.ingredient_id
      JOIN products p ON r.product_id = p.id
      WHERE fp.factura_id = ?
    `, [id]);

    const numarProduse = produse.length;
    const bauturiList = bauturiRows.map(b => b.bautura).join(", ");

    if (!produse || produse.length === 0) {
      return res.status(404).json({ message: "Factura nu conține produse." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=factura_${factura.id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    const logoPath = path.join(__dirname, '../public/images/logo.jpg');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 80 });
    }

    doc.fontSize(20).font("./public/fonts/TIMES.TTF").text("FACTURĂ FISCALĂ", { align: 'center', underline: true });

    doc.moveDown(4);
    doc.fontSize(12).font("./public/fonts/TIMES.TTF");
    const dataFactura = new Date(factura.data_factura).toLocaleDateString("ro-RO");
    doc.text(`Număr factură: ${factura.numar_factura}`);
    doc.text(`Data: ${dataFactura}`);
    doc.text(`Furnizor: ${factura.furnizor}`);
    doc.text(`Email: ${factura.email}`);
    doc.text(`Telefon: ${factura.telefon}`);
    doc.moveDown(1.5);

    doc.font("./public/fonts/TIMES.TTF").text("Produse aprovizionate:", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 60;
    const qtyX = 300;
    const unitX = 400;

    doc.fontSize(11).fillColor('#000');
    doc.text("Ingredient", itemX, tableTop);
    doc.text("Cantitate", qtyX, tableTop);
    doc.text("Unitate", unitX, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    produse.forEach(p => {
      doc.text(p.ingredient, itemX, y);
      doc.text(p.cantitate.toFixed(2), qtyX, y);
      doc.text(p.unit, unitX, y);
      y += 20;
    });

    doc.moveDown(2);
    doc.font("./public/fonts/TIMES.TTF").fontSize(13);
    doc.text(`Total estimat: ${factura.total} RON`, {
      align: 'right',
      underline: true
    });

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor("#000").font("./public/fonts/TIMES.TTF");
    doc.text(`Această factură include ${numarProduse} produs${numarProduse !== 1 ? "e" : ""} aprovizionat${numarProduse !== 1 ? "e" : ""}.`);

    doc.moveDown(0.5);
    if (bauturiList) {
      doc.text(`Ingrediente utilizate în: ${bauturiList}.`);
    } else {
      doc.text(`Nu există băuturi asociate direct.`);
    }

    doc.moveDown(4);
    doc.fontSize(10).font("./public/fonts/TIMES.TTF").fillColor("gray");
    doc.text("Mulțumim pentru colaborare!", {
      align: "center"
    });

    doc.end();

  } catch (err) {
    console.error("Eroare generare PDF:", err);
    res.status(500).json({ message: "Eroare la generarea facturii." });
  }
};

exports.getFacturi = async (req, res) => {
  const [facturi] = await pool.query(`
    SELECT f.id, f.numar_factura, f.total, f.data_factura, fr.nume_furnizor
    FROM facturi f
    JOIN furnizori fr ON f.furnizor_id = fr.id
    ORDER BY f.data_factura DESC
  `);
  res.json(facturi);
};
