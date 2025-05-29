async function incarcaRaport() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă...</p>";
  
    try {
      const raspuns = await fetch("/raport/vanzari-30-zile");
      const date = await raspuns.json();
  
      if (!Array.isArray(date)) {
        throw new Error("Răspuns invalid de la server");
      }
  
      let html = "<table border='1'><tr><th>Data</th><th>Nr. comenzi</th><th>Valoare totală (lei)</th></tr>";
      date.forEach(r => {
        html += `<tr><td>${r.data}</td><td>${r.numar_comenzi}</td><td>${r.valoare_totala} lei</td></tr>`;
      });
      html += "</table>";
  
      container.innerHTML = html;
    } catch (err) {
      console.error("❌ Eroare raport:", err);
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea raportului.</p>";
    }
  }
  async function incarcaTopProduse() {
    const container = document.getElementById("raport");
    container.innerHTML = "<p>Se încarcă top produse...</p>";
  
    try {
      const raspuns = await fetch("/raport/top-produse");
      const date = await raspuns.json();
  
      let html = "<h3>Top produse vândute</h3><table border='1'><tr><th>Produs</th><th>Bucăți vândute</th></tr>";
      date.forEach(p => {
        html += `<tr><td>${p.produs}</td><td>${p.total_vandut}</td></tr>`;
      });
      html += "</table>";
  
      container.innerHTML = html;
    } catch (err) {
      console.error("❌ Eroare top produse:", err);
      container.innerHTML = "<p style='color:red;'>Eroare la încărcarea topului.</p>";
    }
  }
  