function verificaAutentificare(req, res, next) {
    const role = req.headers['user-role'];
    if (role) {
      req.user = { role };
      next();
    } else {
      res.status(401).json({ message: "Nu ești autentificat." });
    }
  }
  
  module.exports = verificaAutentificare;
  