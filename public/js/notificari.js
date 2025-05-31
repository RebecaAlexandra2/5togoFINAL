document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "admin") {
    alert("Acces interzis.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("/admin/notificari", {
      headers: {
        "user-id": user.id,
        "user-role": user.role
      }
    });

    if (!res.ok) {
      throw new Error("Eroare la răspunsul serverului");
    }

    const notificari = await res.json();

    if (!notificari.length) {
      document.getElementById("zona-notificari").innerHTML = "<p>Nu există notificări.</p>";
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Mesaj</th>
            <th>Status</th>
            <th>Acțiune</th>
          </tr>
        </thead>
        <tbody>
          ${notificari.map(n => `
            <tr>
              <td>${n.id}</td>
              <td>${n.mesaj}</td>
              <td>${n.status}</td>
              <td>
                <button onclick="marcheazaNotificare(${n.id}, 'rezolvat')">✅ Rezolvat</button>
<button onclick="marcheazaNotificare(${n.id}, 'in_asteptare')">⏳ În așteptare</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.getElementById("zona-notificari").innerHTML = html;
  } catch (err) {
    console.error("Eroare la încărcarea notificărilor:", err);
    document.getElementById("zona-notificari").innerHTML = "<p style='color:red;'>Eroare la încărcarea notificărilor.</p>";
  }
});

async function marcheazaNotificare(id, statusNou) {
  const user = JSON.parse(localStorage.getItem("user"));
  try {
    const res = await fetch(`/admin/notificari/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id,
        "user-role": user.role
      },
      body: JSON.stringify({ status: statusNou })
    });

    const data = await res.json();
    alert(data.message || "Status notificare actualizat.");
    location.reload();
  } catch (err) {
    console.error("Eroare la actualizarea notificării:", err);
    alert("Eroare la actualizarea notificării.");
  }
}