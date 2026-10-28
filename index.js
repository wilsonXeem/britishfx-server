const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const compression = require("compression");

// Configure dotenv
dotenv.config();

// Get routes
const userRoutes = require("./routes/user");

const app = express();

app.use(compression());

// Parsing incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set headers
app.use((req, res, next) => {
  // TODO: In production, restrict CORS to https://www.crestmontapex.com
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, , X-Requested-With, Origin, Accept",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use("/user", userRoutes);

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode,
    message = err.message,
    type = err.type || "";
  res.status(status).json({ message, status, type });
});

mongoose
  .connect(process.env.MONGODB)
  .then(() => {
    console.log("Database connected — crestmontapex (local)");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });

app.listen(process.env.PORT, () => console.log("Server has started"));
