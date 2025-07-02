const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const { uploadFile } = require("../controllers/fileController");

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: "tmp/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

// ✅ Allow all image types and PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
    "application/pdf"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files and PDF allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

router.post("/", auth, upload.single("file"), uploadFile);

module.exports = router;
