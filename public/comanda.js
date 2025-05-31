window.onload = async () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user && user.role === "admin") {
    document.querySelectorAll("button[onclick='adaugaInCos()']").forEach(btn => {
      btn.style.display = "none";
    });

    const btnFinalizare = document.getElementById("finalizare-comanda");
    if (btnFinalizare) btnFinalizare.style.display = "none";

    const cosContainer = document.getElementById("cos-container");
    if (cosContainer) {
      const msg = document.createElement("p");
      msg.textContent = "Adminul nu poate face comenzi.";
      msg.style.color = "red";
      msg.style.fontWeight = "bold";
      msg.style.marginBottom = "20px";
      cosContainer.prepend(msg);
    }
  }

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
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id) {
    alert("Nu ești autentificat! Loghează-te pentru a plasa comenzi.");
    window.location.href = "login.html";
    return;
  }

  if (user.role === "admin") {
    alert("Adminul nu poate face comenzi.");
    return;
  }

  const locatieId = parseInt(document.getElementById("selectLocatie").value);
  const cos = JSON.parse(localStorage.getItem("cos")) || [];
  if (!cos.length) {
    alert("Coșul este gol!");
    return;
  }

  let produseGlobal = window.produseGlobal;
  if (!produseGlobal) {
    try {
      const res = await fetch("/produse");
      produseGlobal = await res.json();
    } catch (e) {
      alert("Nu s-au putut obține produsele. Reîncarcă pagina.");
      return;
    }
  }

  const produse = cos.map(item => ({
    id: item.id,
    quantity: item.cantitate,
    price: produseGlobal.find(p => p.id === item.id)?.price || 0
  }));

  // ✅ Verificare stoc înainte de plasare comandă
  try {
    const verificare = await fetch("/verifica-stoc-global", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ produse })
    });

    const rezultatVerificare = await verificare.json();
    if (!verificare.ok) {
      alert("❌ Stoc insuficient: " + rezultatVerificare.message);
      return;
    }
  } catch (err) {
    alert("Eroare la verificarea stocului.");
    console.error("❌ Eroare verificare:", err);
    return;
  }

  // ✅ Trimite comanda dacă totul e OK
  try {
    const raspuns = await fetch("/comanda", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-role": user.role,
        "user-id": user.id
      },
      body: JSON.stringify({
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
    localStorage.removeItem("cos");
    window.location.href = "index.html";
  } catch (err) {
    alert("Eroare la trimiterea comenzii. Verifică consola.");
    console.error("❌ Eroare la fetch:", err);
  }
}

const btnFinal = document.getElementById("finalizare-comanda");
if (btnFinal) {
  btnFinal.onclick = trimiteComanda;
}