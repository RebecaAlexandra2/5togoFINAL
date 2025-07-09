document.addEventListener("DOMContentLoaded", incarcaCereri);

async function incarcaCereri() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id || !user.role) {
    alert("Trebuie să fii autentificat.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`/admin/cereri`, {
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });

    const cereri = await response.json();

    if (!Array.isArray(cereri)) {
      throw new Error("Răspuns invalid de la server.");
    }

    const tbody = document.querySelector('#cereriTable tbody');
    tbody.innerHTML = '';

    cereri.forEach(c => {
      const tr = document.createElement('tr');
      console.log(c);

      tr.innerHTML = `
  <td>${c.id}</td>
  <td>${c.ingredient}</td>
  <td>${c.cantitate_necesara}</td>
  <td>${c.status}</td>
  <td>${new Date(c.data_cerere).toLocaleString()}</td>
<td>
${(c.status || '').trim().toLowerCase() === 'neprocesata'
    ? `<button onclick="aprovizioneaza(${c.id}, ${c.ingredient_id}, ${Number(c.cantitate_necesara)})">✅ Aprovizionează</button>`
    : (c.factura_id
       ? `<form action="/admin/factura/${c.factura_id}" method="GET" target="_blank">
            <button type="submit">📄 Vezi factura</button>
          </form>`
       : '—')
  


}
</td>

`;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Eroare:", err.message);
    alert("Eroare la încărcarea cererilor: " + err.message);
  }
}

async function aprovizioneaza(cerereId, ingredientId, cantitate) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id || !user.role) {
    alert("Trebuie să fii autentificat.");
    window.location.href = "login.html";
    return;
  }

  if (cantitate <= 0) {
    alert("Cantitatea nu poate fi zero sau negativă.");
    return;
  }

  const confirmare = confirm(`Sigur dorești să aprovizionezi ${cantitate} unități?`);
  if (!confirmare) return;

  try {
    const r = await fetch('/admin/cereri/aprovizioneaza', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id,
        "user-role": user.role
      },
      body: JSON.stringify({ cerereId, ingredientId, cantitate })
    });

    const rezultat = await r.json();
    if (!r.ok) throw new Error(rezultat.message);
    alert(rezultat.message || "Actualizare efectuată.");
    incarcaCereri();

  } catch (err) {
    console.error("Eroare:", err.message);
    alert("Eroare la aprovizionare: " + err.message);
  }
}

function deschideFactura(facturaId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== 'admin') {
    alert("Trebuie să fii autentificată ca admin pentru a vedea factura.");
    return;
  }

  // Deschide factura într-un tab nou, cu sesiunea curentă
  window.open(`/admin/factura/${facturaId}`, '_blank');
}
