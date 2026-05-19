const jwt = require("jsonwebtoken");

function generateToken(user) {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
}

module.exports = generateToken;