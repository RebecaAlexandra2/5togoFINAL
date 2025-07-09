const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// ✅ Rute pentru autentificare si creare cont
router.post("/register", userController.register);
router.post("/login", userController.login);

// ✅ Afișeaza punctele de fidelitate ale unui user
router.get("/:id/puncte", userController.getFidelitatePuncte);

// ✅ Returneaza toti utilizatorii (pentru admin, QR)
router.get("/all", userController.getAllUsers);

// ✅ Consuma puncte dupa aplicarea unei recompense
router.put("/:id/consuma", userController.consumaPuncte);

router.get("/:id/istoric", userController.getIstoricFidelitate);

module.exports = router;