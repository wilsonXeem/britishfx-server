const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const compression = require("compression");

dotenv.config();

const userRoutes = require("./routes/user");

const app = express();

const ALLOWED_ORIGIN = process.env.CLIENT_URL || "https://crestmontapex.us";

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Origin, Accept");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Cache mongoose connection across serverless invocations
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB);
  isConnected = true;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed", type: "error" });
  }
});

app.use("/user", userRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message;
  const type = err.type || "";
  res.status(status).json({ message, status, type });
});

// Export for Vercel — do not call app.listen()
module.exports = app;
