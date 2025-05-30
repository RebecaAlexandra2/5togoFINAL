function verificaAutentificare(req, res, next) {
  const userId = req.headers["user-id"];
  const userRole = req.headers["user-role"];

  if (!userId || !userRole) {
    return res.status(401).json({ message: "Neautentificat" });
  }

  // poți adăuga validări suplimentare aici dacă vrei
  req.user = { id: parseInt(userId), role: userRole };
  next();
}

module.exports = verificaAutentificare;