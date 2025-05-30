document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
  
    if (!user || user.role !== "admin") {
      alert("Acces interzis. Doar adminii pot accesa această pagină.");
      window.location.href = "login.html";
      return;
    }
  
    // Afișează numele adminului
    const h2 = document.querySelector("h2.title");
    if (h2 && user.name) {
      h2.innerHTML += ` — Salut, <strong>${user.name}</strong>`;
    }
  
    incarcaIngrediente();
    incarcaClientiQR();
  });
  
  async function incarcaRaport() {
    try {
      const res = await fetch("/raport");
      const data = await res.text();
      document.getElementById("raport").innerHTML = data;
    } catch {
      document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la încărcarea raportului.</p>";
    }
  }
  
  async function incarcaTopProduse() {
    try {
      const res = await fetch("/raport/top-produse");
      const data = await res.text();
      document.getElementById("raport").innerHTML = data;
    } catch {
      document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la top produse.</p>";
    }
  }
  
  async function incarcaUtilizatoriActivi() {
    try {
      const res = await fetch("/raport/utilizatori");
      const data = await res.text();
      document.getElementById("raport").innerHTML = data;
    } catch {
      document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la utilizatori activi.</p>";
    }
  }
  
  async function incarcaTotalVenituri() {
    try {
      const res = await fetch("/raport/venituri");
      const data = await res.text();
      document.getElementById("raport").innerHTML = data;
    } catch {
      document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la venituri.</p>";
    }
  }
  
  async function incarcaDashboard() {
    try {
      const res = await fetch("/raport/dashboard");
      const data = await res.text();
      document.getElementById("raport").innerHTML = data;
    } catch {
      document.getElementById("raport").innerHTML = "<p style='color:red'>Eroare la dashboard.</p>";
    }
  }
  
  async function incarcaRaportLocatii() {
    try {
      const res = await fetch("/raport/locatii");
      const data = await res.text();
      document.getElementById("raport").innerHTML = data;
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