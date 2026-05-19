const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Token missing.",
    });
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Invalid token format.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, function (error, decoded) {
    if (error) {
      return res.status(403).json({
        success: false,
        message: "Forbidden access. Invalid or expired token.",
      });
    }

    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;
