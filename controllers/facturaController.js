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
      SELECT i.name AS ingredient, fp.cantitate, i.unit
      FROM factura_produse fp
      JOIN ingredients i ON fp.ingredient_id = i.id
      WHERE fp.factura_id = ?
    `, [id]);

    if (!produse || produse.length === 0) {
      return res.status(404).json({ message: "Factura nu conține produse." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=factura_${factura.id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    const width = doc.page.width;
    const height = doc.page.height;

    // === Siglă sus stânga ===
    const logoPath = path.join(__dirname, '../public/images/logo.jpg');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 80 });
    }

    // === Titlu factură ===
    doc.fontSize(20).font("Helvetica-Bold").text("FACTURĂ FISCALĂ", 0, 50, {
      align: 'center',
      underline: true
    });

    // === Informații furnizor ===
    doc.moveDown(4);
    doc.fontSize(12).font("Helvetica");
    const dataFactura = new Date(factura.data_factura).toLocaleDateString("ro-RO");
    doc.text(`Număr factură: ${factura.numar_factura}`);
    doc.text(`Data: ${dataFactura}`);
    doc.text(`Furnizor: ${factura.furnizor}`);
    doc.text(`Email: ${factura.email}`);
    doc.text(`Telefon: ${factura.telefon}`);
    doc.moveDown(1.5);

    // === Tabel ingrediente ===
    doc.font("Helvetica-Bold").text("Produse aprovizionate:", { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica");

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

    // === Total factură ===
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text(`Total estimat: ${factura.total} RON`, {
      align: 'right',
      underline: true
    });

    // === Footer ===
    doc.moveDown(4);
    doc.fontSize(10).font("Helvetica-Oblique").fillColor("gray");
    doc.text("Mulțumim pentru colaborare!", {
      align: "center"
    });

    doc.end();

  } catch (err) {
    console.error("Eroare generare PDF:", err);
    res.status(500).json({ message: "Eroare la generarea facturii." });
  }
};
