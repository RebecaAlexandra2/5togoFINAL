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
<<<<<<< HEAD
app.use("/user", userRoutes);
=======
app.use("/", userRoutes);
>>>>>>> e8817b7a3a80767db031a71aada6ba58236630bf
app.use("/", productRoutes);
app.use("/", orderRoutes);
app.use("/", raportRoutes);

// ✅ Pornește serverul
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server MySQL rulează pe http://localhost:${PORT}`);
});
