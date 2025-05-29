const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock", // ← folosește socket
  user: "root",
  password: "root",
  database: "five_to_go",
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
