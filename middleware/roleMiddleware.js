const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

const roleMiddleware = (requiredRole) => {
  return [
    authMiddleware, // First check authentication
    (req, res, next) => {
      // Now check role
      if (req.user.role === requiredRole || req.user.role === "admin") {
        next();
      } else {
        res.status(403).json({ message: "Insufficient privileges" });
      }
    }
  ];
};

module.exports = roleMiddleware;