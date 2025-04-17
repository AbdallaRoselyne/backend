const jwt = require("jsonwebtoken");

const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === requiredRole || decoded.role === "admin") {
        req.user = decoded;
        next();
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = roleMiddleware;