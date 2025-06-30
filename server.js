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
const adminRoutes = require("./routes/adminRoutes");
const verificaAutentificare = require("./middlewares/authMiddleware");

// ✅ Rute
app.use("/user", userRoutes);
app.use("/", userRoutes);
app.use("/", productRoutes);
app.use("/api", orderRoutes);
app.use(orderRoutes);
app.use("/", raportRoutes);
app.use("/admin", adminRoutes);
app.use("/raport", require("./routes/raportRoutes"));


// ✅ Servește pagina client la accesarea linkului QR
app.get("/client/:id", (req, res) => {
  res.sendFile(__dirname + "/public/client.html");
});

// ✅ Pornește serverul
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server MySQL rulează pe http://localhost:${PORT}`);
});
