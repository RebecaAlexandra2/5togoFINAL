async function trimiteComanda() {
  console.log("➡️ Click pe buton - se trimite comanda...");

  const comanda = {
    user_id: 1, // ID-ul test (Rebeca)
    produse: [
      { id: 1, quantity: 2, price: 7 },  // 2x Cappuccino
      { id: 2, quantity: 1, price: 5 }   // 1x Espresso
    ]
  };

  try {
    const raspuns = await fetch("/comanda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comanda)
    });

    if (!raspuns.ok) {
      throw new Error(`HTTP ${raspuns.status}`);
    }

    const rezultat = await raspuns.json();
    console.log("✅ Răspuns primit:", rezultat);
    alert(rezultat.message);
  } catch (err) {
    console.error("❌ Eroare la fetch:", err);
    alert("❌ Eroare la trimiterea comenzii. Verifică consola.");
  }
}
