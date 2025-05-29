function getCalendarParams() {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    if (start && end) return `?start_date=${start}&end_date=${end}`;
    return "";
  }
  
  // Vânzări pe perioadă (implicit 30 zile dacă nu selectezi nimic)
  async function incarcaRaport() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă...</p>";
    try {
      const url = "/raport/vanzari-30-zile" + getCalendarParams();
      const raspuns = await fetch(url);
      const date = await raspuns.json();
  
      if (!Array.isArray(date)) throw new Error("Răspuns invalid de la server");
  
      let html = "<table border='1'><tr><th>Data</th><th>Nr. comenzi</th><th>Valoare totală (lei)</th></tr>";
      date.forEach(r => {
        html += `<tr><td>${r.data}</td><td>${r.numar_comenzi}</td><td>${r.valoare_totala} lei</td></tr>`;
      });
      html += "</table>";
  
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea raportului.</p>";
    }
  }
  
  // Top produse vândute
  async function incarcaTopProduse() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă top produse...</p>";
    try {
      const url = "/raport/top-produse" + getCalendarParams();
      const raspuns = await fetch(url);
      const date = await raspuns.json();
  
      let html = "<h3>Top produse vândute</h3><table border='1'><tr><th>Produs</th><th>Bucăți vândute</th></tr>";
      date.forEach(p => {
        html += `<tr><td>${p.produs}</td><td>${p.total_vandut}</td></tr>`;
      });
      html += "</table>";
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea topului.</p>";
    }
  }
  
  // Utilizatori activi
  async function incarcaUtilizatoriActivi() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă utilizatorii activi...</p>";
    try {
      const url = "/raport/utilizatori-activi" + getCalendarParams();
      const raspuns = await fetch(url);
      const date = await raspuns.json();
  
      let html = "<h3>Utilizatori activi</h3><table border='1'><tr><th>ID</th><th>Nume</th><th>Email</th><th>Comenzi</th></tr>";
      date.forEach(u => {
        html += `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.numar_comenzi}</td></tr>`;
      });
      html += "</table>";
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea utilizatorilor.</p>";
    }
  }
  
  // Total venituri
  async function incarcaTotalVenituri() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se calculează venitul total...</p>";
    try {
      const url = "/raport/total-venituri" + getCalendarParams();
      const raspuns = await fetch(url);
      const data = await raspuns.json();
      const total = parseFloat(data.total_venit) || 0;
  
      let html = `<h3>Total venituri</h3>
                  <p style="font-size: 1.5rem; font-weight: bold; color: #6f4e37;">
                    ${total.toFixed(2)} lei
                  </p>`;
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "<p style='color:red;'>Eroare la calculul veniturilor.</p>";
    }
  }
  
  // Dashboard
  async function incarcaDashboard() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă dashboard-ul...</p>";
    try {
      const url = "/raport/dashboard" + getCalendarParams();
      const res = await fetch(url);
      const data = await res.json();
  
      let html = `
        <h3 style="margin-top: 2rem;">📊 Dashboard general</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
          <div class="card-dashboard">💸 <strong>${data.total_venit.toFixed(2)} lei</strong><br/>Total venituri</div>
          <div class="card-dashboard">📦 <strong>${data.total_comenzi}</strong><br/>Total comenzi</div>
          <div class="card-dashboard">👥 <strong>${data.utilizatori_activi}</strong><br/>Utilizatori activi</div>
          <div class="card-dashboard">☕ <strong>${data.top_produs}</strong><br/>Top produs</div>
        </div>
      `;
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea dashboard-ului.</p>";
    }
  }
  
  // Raport pe locații
  async function incarcaRaportLocatii() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă raportul pe locații...</p>";
    try {
      const url = "/raport/locatii" + getCalendarParams();
      const raspuns = await fetch(url);
      const date = await raspuns.json();
  
      let html = "<h3>📍 Vânzări pe locații</h3>";
      html += "<table border='1'><tr><th>Locație</th><th>Nr. comenzi</th><th>Total vânzări (lei)</th></tr>";
      date.forEach(loc => {
        const total = parseFloat(loc.total_vanzari) || 0;
        html += `<tr>
          <td>${loc.locatie}</td>
          <td>${loc.numar_comenzi}</td>
          <td>${total.toFixed(2)}</td>
        </tr>`;
      });
      html += "</table>";
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea raportului pe locații.</p>";
    }
  }
  
  