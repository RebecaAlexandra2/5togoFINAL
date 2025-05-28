const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middleware-uri
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ Importă toate rutele
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const raportRoutes = require("./routes/raportRoutes");

// ✅ Înregistrează rutele
app.use("/", userRoutes);
app.use("/", productRoutes);
app.use("/", orderRoutes);
app.use("/", raportRoutes);

// ✅ Pornește serverul
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server MySQL rulează pe http://localhost:${PORT}`);
});
