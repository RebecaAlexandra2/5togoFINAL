const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  port: 3307,
  user: "root",
  password: "",
  database: "5togo",
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
