require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static folders
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Set view engine
app.set("view engine", "ejs");

// Routes
app.use("/api/auth", require("./routes/auth"));      // Auth routes (register, login, OTP)
app.use("/api/upload", require("./routes/upload"));  // File upload routes (if applicable)

// Views
app.get("/", (req, res) => res.render("index"));
app.get("/dashboard", (req, res) => res.render("dashboard"));

// 404 handler (optional)
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
