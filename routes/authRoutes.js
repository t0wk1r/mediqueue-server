const express = require("express");
const generateToken = require("../utils/generateToken");

const router = express.Router();

router.post("/jwt", async (req, res) => {
  const user = req.body;

  if (!user?.email) {
    return res.status(400).json({
      success: false,
      message: "User email is required",
    });
  }

  const token = generateToken(user);

  res.json({
    success: true,
    token,
  });
});

module.exports = router;