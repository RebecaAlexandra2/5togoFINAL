const bcrypt = require("bcryptjs"); // sau "bcrypt"
const pool = require("./config/db"); // ajustează path-ul dacă e nevoie

async function resetAdminPass() {
  const nouaParola = "test123"; // SCHIMBĂ aici cu parola dorită!
  const hash = await bcrypt.hash(nouaParola, 10);
  await pool.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hash, "rebeca@example.com"]
  );
  console.log("✅ Parola admin a fost resetată!");
  process.exit();
}
resetAdminPass();
