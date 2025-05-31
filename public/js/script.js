function afiseazaModalEroare(mesaj) {
  const text = document.getElementById("modal-text");
  const container = document.getElementById("modal-eroare");
  text.innerText = mesaj;
  container.style.display = "flex";
}

function inchideModalEroare() {
  document.getElementById("modal-eroare").style.display = "none";
}

const pozeProduse = {
  "Americano": "images/americano.png",
  "Boba Tea": "images/Bobatea.png",
  "Cappuccino": "images/cappucino.jpeg",
  "Caffe Latte": "images/Latte.jpg",
  "Espresso": "images/espresso.png",
  "Espresso Dublu": "images/espresoodublu.jpg",
  "Flat White": "images/flatwhite.jpeg",
  "Frappe Mare": "images/Frappemare.png",
  "Frappe Mic": "images/FRAPPEmic.png",
  "Iced Coffee Mare": "images/icedcoffeemare.jpeg",
  "Iced Coffee Mic": "images/icedcoffeemic.jpeg",
  "Mr Big": "images/mrbig.jpeg"
};

let produseGlobal = [];
let cos = JSON.parse(localStorage.getItem("cos")) || [];

function salveazaCos() {
  localStorage.setItem("cos", JSON.stringify(cos));
}

function renderCartCount() {
  document.getElementById("cart-count").textContent = cos.reduce((acc, c) => acc + c.cantitate, 0);
}

function renderCos() {
  const cosDiv = document.getElementById("cos-produse");
  if (!cos.length) {
    cosDiv.innerHTML = "<p>Momentan coșul este gol.</p>";
    document.getElementById("cos-total").textContent = "";
    renderCartCount();
    return;
  }
  let total = 0;
  cosDiv.innerHTML = cos.map(item => {
    const produs = produseGlobal.find(p => p.id === item.id);
    if (!produs) return '';
    total += produs.price * item.cantitate;
    return `
      <div class="cos-item">
        <span class="cos-item-name">${produs.name}</span>
        <div class="cos-qty-group">
          <button class="cos-item-btn scade" data-id="${item.id}">-</button>
          <span>${item.cantitate}</span>
          <button class="cos-item-btn adauga" data-id="${item.id}">+</button>
        </div>
        <span>${(produs.price * item.cantitate).toFixed(2)} lei</span>
        <button class="cos-item-btn sterge" data-id="${item.id}" title="Șterge produs">&#10006;</button>
      </div>
    `;
  }).join("");
  document.getElementById("cos-total").textContent = `Total: ${total.toFixed(2)} lei`;
  renderCartCount();

  document.querySelectorAll(".cos-item-btn.adauga").forEach(btn => {
    btn.onclick = () => modificaCantitate(parseInt(btn.dataset.id), 1);
  });
  document.querySelectorAll(".cos-item-btn.scade").forEach(btn => {
    btn.onclick = () => modificaCantitate(parseInt(btn.dataset.id), -1);
  });
  document.querySelectorAll(".cos-item-btn.sterge").forEach(btn => {
    btn.onclick = () => stergeDinCos(parseInt(btn.dataset.id));
  });
}

function modificaCantitate(id, delta) {
  const idx = cos.findIndex(item => item.id === id);
  if (idx !== -1) {
    cos[idx].cantitate += delta;
    if (cos[idx].cantitate <= 0) {
      cos.splice(idx, 1);
    }
    salveazaCos();
    renderCos();
  }
}

function stergeDinCos(id) {
  cos = cos.filter(item => item.id !== id);
  salveazaCos();
  renderCos();
}

async function adaugaInCos(id) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.role === "admin") {
    afiseazaModalEroare("Adminul nu poate adăuga produse în coș.");
    return;
  }

  let cantitateDorita = 1;
  const idx = cos.findIndex(item => item.id === id);
  if (idx !== -1) {
    cantitateDorita = cos[idx].cantitate + 1;
  }

  try {
    const res = await fetch(`/api/verifica-stoc/${id}/${cantitateDorita}`);
    const data = await res.json();

    if (!res.ok || data.ok === false) {
      afiseazaModalEroare(data.message || "Stoc insuficient pentru produs.");
      return;
    }

    if (idx !== -1) {
      cos[idx].cantitate += 1;
    } else {
      cos.push({ id, cantitate: 1 });
    }
    salveazaCos();
    renderCos();
  } catch (err) {
    afiseazaModalEroare("Eroare la verificarea stocului.");
  }
}

function updateNavUserState() {
  const user = JSON.parse(localStorage.getItem("user"));

  const adminLink = document.getElementById("admin-link");
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutLink = document.getElementById("logout-link");
  const userName = document.getElementById("user-name");
  const userPuncte = document.getElementById("user-puncte");
  const comandaLink = document.getElementById("comanda-link"); // 🔸 AICI

  if (adminLink) adminLink.style.display = "none";
  if (loginLink) loginLink.style.display = "inline";
  if (registerLink) registerLink.style.display = "inline";
  if (logoutLink) logoutLink.style.display = "none";
  if (userName) userName.textContent = "";
  if (userPuncte) userPuncte.style.display = "none";
  if (comandaLink) comandaLink.style.display = "inline"; // 🔸 default

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "inline";
    if (userName) userName.textContent = `Salut, ${user.name}!`;

    if (user.role === "admin") {
      if (adminLink) adminLink.style.display = "inline";
      if (comandaLink) comandaLink.style.display = "none"; // 🔒 Ascunde pentru admin
    } else {
      if (userPuncte) userPuncte.style.display = "inline";
    }
  }

  if (logoutLink) {
    logoutLink.onclick = function(e) {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.reload();
    };
  }
}

async function updatePuncteFidelitate() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;
  try {
    const res = await fetch(`/user/${user.id}/puncte`);
    if (!res.ok) return;
    const data = await res.json();

    if (user.role !== "admin") {
      document.getElementById("user-puncte").textContent = `Puncte: ${data.puncte}`;
    }
  } catch (err) {}
}

function ascundeButoaneAdmin() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.role === "admin") {
    document.querySelectorAll("button.adauga-cos").forEach(btn => {
      btn.style.display = "none";
    });

    const btnFinalizare = document.getElementById("finalizare-comanda");
    if (btnFinalizare) btnFinalizare.style.display = "none";

    const mesajContainer = document.getElementById("admin-mesaj");
    if (mesajContainer) {
      mesajContainer.style.display = "block";
      mesajContainer.textContent = "Adminul nu poate face comenzi.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavUserState();
  updatePuncteFidelitate();
});

window.onload = async () => {
  const meniuDiv = document.getElementById("meniu");
  try {
    const res = await fetch("/produse");
    let produse = await res.json();
    produse = produse.map(p => ({ ...p, price: parseFloat(p.price) }));
    produseGlobal = produse;

    for (let i = 0; i < produse.length; i += 4) {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      for (let j = i; j < i + 4 && j < produse.length; j++) {
        const p = produse[j];
        const img = pozeProduse[p.name] || "https://via.placeholder.com/100";
        let ingrediente = "";
        if (Array.isArray(p.reteta)) {
          ingrediente = p.reteta.map(r =>
            `${r.ingredient} (${r.cantitate} ${r.unit})`
          ).join(", ");
        } else if (typeof p.ingrediente === "string") {
          ingrediente = p.ingrediente;
        }
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <img src="${img}" alt="${p.name}" class="product-image" />
          <h3>${p.name}</h3>
          ${ingrediente ? `<p>${ingrediente}</p>` : ""}
          <p>${p.gramaj} ml – ${p.price.toFixed(2)} lei</p>
          <button class="adauga-cos" data-id="${p.id}">Adaugă în coș</button>
        `;
        slide.appendChild(card);
      }
      meniuDiv.appendChild(slide);
    }

    ascundeButoaneAdmin();

    const user = JSON.parse(localStorage.getItem("user"));
    const btnsAdaugaCos = document.querySelectorAll("button.adauga-cos");

    if (user && user.role !== "admin") {
      btnsAdaugaCos.forEach(btn => {
        btn.onclick = function() {
          adaugaInCos(parseInt(btn.dataset.id));
        };
      });
    }

    renderCos();

    new Swiper('.swiper', {
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      slidesPerView: 1,
      autoHeight: true,
      spaceBetween: 20,
      watchOverflow: true
    });

    document.getElementById("finalizare-comanda").onclick = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) {
        afiseazaModalEroare("Trebuie să fii autentificat pentru a plasa o comandă!");
        window.location.href = "login.html";
        return;
      }

      if (user.role === "admin") {
        afiseazaModalEroare("Adminul nu poate face comenzi.");
        return;
      }

      if (!cos.length) {
        afiseazaModalEroare("Coșul este gol!");
        return;
      }

      const produse = cos.map(item => ({
        id: item.id,
        quantity: item.cantitate,
        price: produseGlobal.find(p => p.id === item.id)?.price || 0
      }));

      let location_id = 1;
      const selectLoc = document.getElementById("selectLocatie");
      if (selectLoc) location_id = parseInt(selectLoc.value);

      try {
        const res = await fetch("/comanda", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": user.id,
            "user-role": user.role
          },
          body: JSON.stringify({ location_id, produse })
        });

        const data = await res.json();

        if (!res.ok) {
          const mesaj = data.message || "Eroare la plasarea comenzii!";
          afiseazaModalEroare(mesaj);
          return;
        }

        alert(data.message || "Comanda a fost plasată cu succes!");
        cos = [];
        salveazaCos();
        renderCos();
        window.updateCartCount && window.updateCartCount();
        updatePuncteFidelitate && updatePuncteFidelitate();
      } catch (err) {
        afiseazaModalEroare("Eroare server la plasarea comenzii.");
      }
    };
  } catch (err) {
    console.error("❌ Eroare meniu:", err);
    meniuDiv.innerHTML = "<p style='color:red;'>Eroare la încărcarea produselor din meniu.</p>";
  }
};