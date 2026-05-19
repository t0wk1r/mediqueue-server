require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const tutorRoutes = require("./routes/tutorRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// default route
app.get("/", (req, res) => {
  res.send("MediQueue Server is running");
});

// health route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

// api routes
app.use("/", authRoutes);
app.use("/", tutorRoutes);
app.use("/", bookingRoutes);

// server start
async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`MediQueue server is running on port ${port}`);
  });
}

startServer();