const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Check for token in Authorization header or cookies
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Check if token is expired
    const now = Date.now().valueOf() / 1000;
    if (decoded.exp < now) {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
    
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;