const pool = require("../config/db");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

exports.genereazaRaportEconomic = async (req, res) => {
  const { product_id, cantitate } = req.query;

  if (!product_id || !cantitate) {
    return res.status(400).json({ message: "Lipsește product_id sau cantitate." });
  }

  try {
    // Nume produs
    const [[produs]] = await pool.query(
      "SELECT name FROM products WHERE id = ?",
      [product_id]
    );

    if (!produs) {
      return res.status(404).json({ message: "Produsul nu există." });
    }

    const numeProdus = produs.name;

    // Select ingrediente și calculează costurile
    const [ingrediente] = await pool.query(
      `
      SELECT 
        i.name AS Ingredient,
        r.quantity * ? AS Cantitate_Totala,
        i.unit AS Unitate,
        i.cost_per_unit AS Cost_Per_Unitate,
        ROUND(r.quantity * ? * i.cost_per_unit, 2) AS Cost_Total
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.product_id = ?
      `,
      [cantitate, cantitate, product_id]
    );

    if (!ingrediente.length) {
      return res.status(404).json({ message: "Nu există rețetă pentru acest produs." });
    }

    const totalCost = ingrediente.reduce((acc, i) => acc + parseFloat(i.Cost_Total), 0);

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=raport_${numeProdus}_${cantitate}.pdf`
    );

    doc.pipe(res);

    // Logo
    const logoPath = path.join(__dirname, "../public/images/logo.jpg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 80 });
    }

    doc.fontSize(20).font("Helvetica-Bold").text("5 to go – Raport Economic", {
      align: "center",
      underline: true
    });

    doc.moveDown(2);

    doc.fontSize(12).font("Helvetica");
    doc.text(`Produs: ${numeProdus}`);
    doc.text(`Cantitate: ${cantitate}`);
    doc.text(`Data generare: ${new Date().toLocaleString()}`);
    doc.moveDown(1.5);

    // Tabel ingrediente
    doc.font("Helvetica-Bold").text("Ingrediente utilizate:", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const ingX = 60;
    const qtyX = 250;
    const unitX = 320;
    const costUnitX = 380;
    const costTotalX = 470;

    doc.fontSize(11).fillColor("#000");
    doc.text("Ingredient", ingX, tableTop);
    doc.text("Cantitate", qtyX, tableTop);
    doc.text("Unit", unitX, tableTop);
    doc.text("Cost/unit", costUnitX, tableTop);
    doc.text("Cost total", costTotalX, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

let y = tableTop + 25;
ingrediente.forEach((ing) => {
  const costUnitar = parseFloat(ing.Cost_Per_Unitate) || 0;
  const costTotal = parseFloat(ing.Cost_Total) || 0;

  doc.font("Helvetica").fillColor("#000");
  doc.text(ing.Ingredient, ingX, y);
  doc.text(ing.Cantitate_Totala.toFixed(2), qtyX, y);
  doc.text(ing.Unitate, unitX, y);
  doc.text(`${costUnitar.toFixed(2)} RON`, costUnitX, y);
  doc.text(`${costTotal.toFixed(2)} RON`, costTotalX, y);
  y += 20;
});


    doc.moveDown(2);

    doc.font("Helvetica-Bold").fontSize(13);
    doc.text(`Cost total producție: ${totalCost.toFixed(2)} RON`, {
      align: "right",
      underline: true
    });

    doc.moveDown(4);
    doc.fontSize(10).font("Helvetica-Oblique").fillColor("gray");
    doc.text("Raport generat automat de aplicația 5 to go", {
      align: "center"
    });

    doc.end();

  } catch (err) {
    console.error("Eroare generare raport economic:", err);
    res.status(500).json({ message: "Eroare la generarea raportului." });
  }
};
