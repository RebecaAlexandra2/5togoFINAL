

window.onload = async () => {
  // Încarcă locațiile în dropdown la deschidere pagină
  const locatieSelect = document.getElementById("selectLocatie");
  try {
    const res = await fetch("/locatii");
    const locatii = await res.json();
    locatii.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc.id;
      opt.textContent = loc.name;
      locatieSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Nu s-au putut încărca locațiile:", err);
  }
};

async function trimiteComanda() {
  // Ia userul autentificat din localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id) {
    alert("Nu ești autentificat! Loghează-te pentru a plasa comenzi.");
    window.location.href = "login.html";
    return;
  }

  const locatieId = parseInt(document.getElementById("selectLocatie").value);

  // Ia coșul real
  const cos = JSON.parse(localStorage.getItem("cos")) || [];
  if (!cos.length) {
    alert("Coșul este gol!");
    return;
  }

  // Ia prețurile produselor din localStorage (dacă ai salvat acolo) sau preia-le dintr-un array global
  let produseGlobal = window.produseGlobal;
  // Dacă nu ai produseGlobal, poți încărca produsele din backend:
  if (!produseGlobal) {
    try {
      const res = await fetch("/produse");
      produseGlobal = await res.json();
    } catch (e) {
      alert("Nu s-au putut obține produsele. Reîncarcă pagina.");
      return;
    }
  }

  // Construiește array-ul pentru comanda
  const produse = cos.map(item => ({
    id: item.id,
    quantity: item.cantitate,
    price: produseGlobal.find(p => p.id === item.id)?.price || 0
  }));

  try {
    const raspuns = await fetch("/comanda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        location_id: locatieId,
        produse
      })
    });

    const rezultat = await raspuns.json();

    if (!raspuns.ok) {
      alert("Eroare la plasarea comenzii: " + (rezultat.message || "Unknown error"));
      return;
    }

    alert(rezultat.message || "Comanda a fost plasată cu succes!");
    localStorage.removeItem("cos"); // golește coșul după comandă
    window.location.href = "index.html";
  } catch (err) {
    alert("Eroare la trimiterea comenzii. Verifică consola.");
    console.error("❌ Eroare la fetch:", err);
  }
}

// Atașează funcția la butonul de finalizare comandă
document.getElementById("finalizare-comanda").onclick = trimiteComanda;
