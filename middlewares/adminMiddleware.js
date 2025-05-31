function isAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next(); // admin valid
  }
  return res.status(403).json({ message: "Acces interzis. Doar adminii pot face această acțiune." });
}

function verificaNuEsteAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return res.status(403).json({ message: "Adminul nu poate plasa comenzi." });
  }
  next();
}

module.exports = { isAdmin, verificaNuEsteAdmin };