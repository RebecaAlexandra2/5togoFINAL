const mysql = require("mysql2/promise");

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock",
      user: "root",
      password: "root",
      database: "five_to_go"
    });

    const [rows] = await connection.query("SHOW TABLES");
    console.log("✅ Conectat la MySQL prin socket! Tabele:", rows);
    await connection.end();
  } catch (err) {
    console.error("❌ Conexiune eșuată:", err);
  }
}

testConnection();
