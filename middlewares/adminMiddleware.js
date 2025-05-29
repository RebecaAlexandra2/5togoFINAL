function verificaAdmin(req, res, next) {
    if (req.user && req.user.role === "admin") {
      return res.status(403).json({ message: "Adminul nu poate plasa comenzi." });
    }
    next();
  }
  
  module.exports = verificaAdmin;
  