function afiseazaTabel(idContainer, jsonData) {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    document.getElementById(idContainer).innerHTML = "<p>Momentan nu există date de afișat.</p>";
    return;
  }

  const traduceriChei = {
    data: "Data",
    numar_comenzi: "Număr comenzi",
    valoare_totala: "Valoare totală (lei)",
    produs: "Produs",
    total_vandut: "Total vândut",
    id: "ID",
    name: "Nume",
    email: "Email",
    total_venit: "Total venit (lei)",
    total_comenzi: "Total comenzi",
    utilizatori_activi: "Utilizatori activi",
    locatie: "Locație",
    total_vanzari: "Total vânzări (lei)"
  };

  const chei = Object.keys(jsonData[0]);
  let html = "<table><thead><tr>";
  chei.forEach(cheie => {
    const titlu = traduceriChei[cheie] || cheie;
    html += `<th>${titlu}</th>`;
  });
  html += "</tr></thead><tbody>";

  jsonData.forEach(item => {
    html += "<tr>";
    chei.forEach(cheie => {
      if (cheie === "data" && typeof item[cheie] === "string") {
        const doarData = item[cheie].split("T")[0];
        html += `<td>${doarData}</td>`;
      } else {
        html += `<td>${item[cheie]}</td>`;
      }
    });
    html += "</tr>";
  });
  html += "</tbody></table>";

  document.getElementById(idContainer).innerHTML = html;
}

function afiseazaObiect(idContainer, obj) {
  if (!obj) {
    document.getElementById(idContainer).innerHTML = "<p>Nu există date.</p>";
    return;
  }

  const traduceriChei = {
    total_venit: "Venit total (lei)",
    total_comenzi: "Număr total comenzi",
    utilizatori_activi: "Utilizatori activi",
    top_produs: "Cel mai vândut produs"
  };

  let html = `<div class="dashboard-grid">`;
  for (const [key, value] of Object.entries(obj)) {
    const titlu = traduceriChei[key] || key;
    html += `
      <div class="dashboard-card">
        <div class="dashboard-card-title">${titlu}</div>
        <div class="dashboard-card-value">${value}</div>
      </div>
    `;
  }
  html += `</div>`;

  document.getElementById(idContainer).innerHTML = html;
}

async function incarcaRaport() {
  try {
    const res = await fetch("/raport/vanzari-30-zile");
    const data = await res.json();
    afiseazaTabel("raport", data);
  } catch {
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la încărcarea raportului.</p>";
  }
}

async function incarcaTopProduse() {
  try {
    const res = await fetch("/raport/top-produse");
    const data = await res.json();
    afiseazaTabel("raport", data);
  } catch {
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la top produse.</p>";
  }
}

async function incarcaUtilizatoriActivi() {
  try {
    const res = await fetch("/raport/utilizatori-activi");
    const data = await res.json();
    afiseazaTabel("raport", data);
  } catch {
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la utilizatori activi.</p>";
  }
}

async function incarcaTotalVenituri() {
  try {
    const res = await fetch("/raport/total-venituri");
    const data = await res.json();
    afiseazaObiect("raport", data);
  } catch {
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la venituri.</p>";
  }
}

async function incarcaDashboard() {
  try {
    const res = await fetch("/raport/dashboard");
    const data = await res.json();
    afiseazaObiect("raport", data);
  } catch {
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la dashboard.</p>";
  }
}

async function incarcaRaportLocatii() {
  try {
    const res = await fetch("/raport/locatii");
    const data = await res.json();
    afiseazaTabel("raport", data);
  } catch {
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la raport pe locații.</p>";
  }
}

async function incarcaIngrediente() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch("/admin/ingrediente", {
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });
    const ingrediente = await res.json();

    const tabel = document.getElementById("raport");
    tabel.innerHTML = `
      <h3>Gestionare ingrediente</h3>
      <table>
        <tr>
          <th>ID</th>
          <th>Nume</th>
          <th>Stoc curent</th>
          <th>Actualizează stoc</th>
        </tr>
        ${ingrediente.map(ing => `
          <tr>
            <td>${ing.id}</td>
            <td>${ing.name}</td>
            <td>${ing.stock_quantity}</td>
            <td>
              <input type="number" id="nou-${ing.id}" min="0" placeholder="Nou stoc" />
              <button onclick="actualizeazaStoc(${ing.id})">Salvează</button>
            </td>
          </tr>
        `).join("")}
      </table>
    `;
  } catch (err) {
    alert("Eroare la încărcarea ingredientelor.");
    console.error(err);
  }
}

async function actualizeazaStoc(id) {
  const input = document.getElementById(`nou-${id}`);
  const cantitateNoua = parseFloat(input.value);
  if (isNaN(cantitateNoua) || cantitateNoua < 0) {
    alert("Introduceți o valoare validă pentru stoc.");
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch(`/admin/ingrediente/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id,
        "user-role": user.role
      },
      body: JSON.stringify({ cantitateNoua })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Eroare la actualizarea stocului.");
      return;
    }

    alert("Stoc actualizat cu succes!");
    incarcaIngrediente();
  } catch (err) {
    alert("Eroare la actualizarea stocului.");
    console.error(err);
  }
}

async function incarcaClientiQR() {
  try {
    const res = await fetch("/user/all");
    const clienti = await res.json();

    const zona = document.createElement("div");
    zona.innerHTML = `<h3>🔐 Coduri QR clienți</h3>`;

    clienti.forEach(c => {
      if (c.role === "client") {
        const link = `http://localhost:5002/client/${c.id}`;
        zona.innerHTML += `
          <p><strong>${c.name}</strong> – <a href="${link}" target="_blank">${link}</a></p>
        `;
      }
    });

    document.getElementById("raport").appendChild(zona);
  } catch (err) {
    console.error("Eroare la afișarea codurilor QR:", err);
  }
}

async function incarcaLocatii() {
  try {
    const res = await fetch("/admin/locatii", {
      headers: {
        "user-id": JSON.parse(localStorage.getItem("user")).id,
        "user-role": "admin"
      }
    });
    const locatii = await res.json();

    let html = `
      <h3>📍 Locații active</h3>
      <table>
        <tr>
          <th>ID</th>
          <th>Nume</th>
          <th>Adresă</th>
          <th>Telefon</th>
          <th>Acțiuni</th>
        </tr>
        ${locatii.map(loc => `
          <tr>
            <td>${loc.id}</td>
            <td><input type="text" value="${loc.name}" onchange="modificaCamp(${loc.id}, 'name', this.value)" /></td>
            <td><input type="text" value="${loc.address}" onchange="modificaCamp(${loc.id}, 'address', this.value)" /></td>
            <td><input type="text" value="${loc.phone}" onchange="modificaCamp(${loc.id}, 'phone', this.value)" /></td>
            <td><button onclick="stergeLocatie(${loc.id})">❌ Șterge</button></td>
          </tr>
        `).join("")}
      </table>

      <h4>➕ Adaugă locație</h4>
      <input type="text" id="numeNou" placeholder="Nume" />
      <input type="text" id="adresaNoua" placeholder="Adresă" />
      <input type="text" id="telefonNou" placeholder="Telefon" />
      <button onclick="adaugaLocatie()">✅ Adaugă</button>
    `;

    document.getElementById("raport").innerHTML = html;
  } catch (err) {
    console.error("Eroare la afișarea locațiilor:", err);
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la afișarea locațiilor.</p>";
  }
}

async function adaugaLocatie() {
  const name = document.getElementById("numeNou").value;
  const address = document.getElementById("adresaNoua").value;
  const phone = document.getElementById("telefonNou").value;

  if (!name || !address || !phone) {
    alert("Completează toate câmpurile.");
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch("/admin/locatii", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id,
        "user-role": user.role
      },
      body: JSON.stringify({ name, address, phone })
    });

    const data = await res.json();
    alert(data.message || "Locație adăugată.");
    incarcaLocatii();
  } catch (err) {
    console.error("Eroare la adăugare:", err);
    alert("Eroare la adăugarea locației.");
  }
}

async function modificaCamp(id, camp, valoare) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    await fetch(`/admin/locatii/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id,
        "user-role": user.role
      },
      body: JSON.stringify({ [camp]: valoare })
    });
  } catch (err) {
    console.error("Eroare la modificare:", err);
    alert("Eroare la modificarea locației.");
  }
}

async function stergeLocatie(id) {
  const confirm1 = confirm("Sigur vrei să ștergi această locație?");
  if (!confirm1) return;

  const confirm2 = prompt("Tastează cuvântul 'ȘTERGE' pentru confirmare:");
  if (confirm2 !== "ȘTERGE") {
    alert("Ștergerea a fost anulată.");
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    await fetch(`/admin/locatii/${id}`, {
      method: "DELETE",
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });

    alert("Locație ștearsă.");
    incarcaLocatii();
  } catch (err) {
    console.error("Eroare la ștergere:", err);
    alert("Eroare la ștergerea locației.");
  }
}

async function filtreazaVanzari() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!startDate || !endDate) {
    alert("Te rog să selectezi ambele date.");
    return;
  }

  // Adaugă ora 00:00:00 și 23:59:59 în stringul trimis
  const start = `${startDate} 00:00:00`;
const end = `${endDate} 23:59:59`;

  try {
    const res = await fetch(`/raport/vanzari-perioada?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
    const data = await res.json();
    afiseazaTabel("raport", data);
  } catch (err) {
    console.error("Eroare la filtrare:", err);
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la filtrarea vânzărilor.</p>";
  }
}

async function confirmaComanda(orderId) {
  const confirm1 = confirm("Ești sigur că vrei să confirmi această comandă?");
  if (!confirm1) return;

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch(`/orders/${orderId}/confirm`, {
      method: "PUT",
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });

    const data = await res.json();
    alert(data.message || "Comanda a fost confirmată.");
    incarcaComenziPendiente(); // funcție de refresh, vezi mai jos
  } catch (err) {
    console.error("Eroare la confirmare:", err);
    alert("Eroare la confirmarea comenzii.");
  }
}

async function incarcaComenziPendiente() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch("/admin/comenzi-pending", {
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });

    const comenzi = await res.json();

    let html = `
      <h3>🕓 Comenzi în așteptare</h3>
      <table>
        <thead>
          <tr>
            <th>ID Comandă</th>
            <th>Client</th>
            <th>Total (lei)</th>
            <th>Status</th>
            <th>Confirmare</th>
          </tr>
        </thead>
        <tbody>
          ${comenzi.map(c => `
            <tr class="comanda-pending">
              <td>${c.id}</td>
              <td>${c.nume_client}</td>
              <td>${c.total_price}</td>
              <td>${c.status}</td>
              <td>
                <button onclick="confirmaComanda(${c.id})" title="Confirmă comanda">
                  ✅ Confirmă
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.getElementById("raport").innerHTML = html;
  } catch (err) {
    console.error("Eroare la încărcarea comenzilor pending:", err);
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la comenzile pending.</p>";
  }
}

async function incarcaAlerte() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch("/admin/alerte", {
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });
    const alerte = await res.json();

    if (!alerte.length) {
      document.getElementById("raport").innerHTML = `
        <div class="dashboard-summary alerta-verde">
          ✅ Nu există alerte active.
        </div>
      `;
      return;
    }

    let html = `
      <h3>📢 Alerte ingrediente sub stoc minim</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Ingredient</th>
            <th>În stoc</th>
            <th>Cerut</th>
            <th>Data alertă</th>
          </tr>
        </thead>
        <tbody>
          ${alerte.map(a => `
            <tr>
              <td>${a.id}</td>
              <td>${a.ingredient}</td>
              <td>${a.current_stock}</td>
              <td>${a.needed_stock}</td>
              <td>${new Date(a.created_at).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.getElementById("raport").innerHTML = html;
  } catch (err) {
    console.error("Eroare la încărcarea alertelor:", err);
    document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la încărcarea alertelor.</p>";
  }
}

async function deschideNotificari() {
  const dropdown = document.getElementById("notificariDropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";

  if (dropdown.style.display === "block") {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await fetch("/admin/notificari", {
        headers: {
          "user-id": user.id,
          "user-role": user.role
        }
      });
      const notificari = await res.json();

      if (!notificari.length) {
        dropdown.innerHTML = "<p style='padding:10px;'>Nu sunt notificări.</p>";
        return;
      }

      dropdown.innerHTML = notificari.slice(0, 5).map(n => `
        <div class="notificare-item" onclick="location.href='/notificari.html'">
          ${n.status === "noua" ? `<span class='necitita'>●</span>` : ""}
          ${n.mesaj}
        </div>
      `).join("");
    } catch (err) {
      console.error("Eroare la notificări:", err);
      dropdown.innerHTML = "<p style='padding:10px;color:red'>Eroare la notificări.</p>";
    }
  }
}
window.addEventListener("click", (e) => {
  if (!e.target.closest(".notificari-wrapper")) {
    document.getElementById("notificariDropdown").style.display = "none";
  }
});

async function updateBadgeNotificari() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch("/admin/notificari/necitite-count", {
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });
    const { count } = await res.json();
    const badge = document.getElementById("badge");
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-block" : "none";
  } catch (err) {
    console.warn("Nu s-a putut actualiza badge-ul notificărilor.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "admin") {
    alert("Acces interzis. Doar adminii pot accesa această pagină.");
    window.location.href = "login.html";
    return;
  }

  const h2 = document.querySelector("h2.title");
  if (h2 && user.name) {
    h2.innerHTML += ` — Salut, <strong>${user.name}</strong>`;
  }

  incarcaIngrediente();
  incarcaClientiQR();
  updateBadgeNotificari(); // ← aici se apelează badge-ul
});

document.getElementById("btnRaportEconomicNav").addEventListener("click", () => {
  const produsId = document.getElementById("selectProdusNav").value;
  const cantitate = document.getElementById("cantitateProdusNav").value;

  if (!produsId || !cantitate || cantitate <= 0) {
    alert("Selectează produsul și introdu o cantitate validă.");
    return;
  }

  const url = `/raport/economic-pdf?product_id=${produsId}&cantitate=${cantitate}`;
  window.open(url, "_blank");
});
