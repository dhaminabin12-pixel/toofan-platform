const router  = require("express").Router();
const multer  = require("multer");
const path    = require("path");
const { authenticate } = require("../middleware/auth.middleware");
const { AppError }     = require("../utils/appError");

router.use(authenticate);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new AppError("Only images allowed.", 400), false);
  },
});

router.post("/image", upload.single("image"), (req, res, next) => {
  if (!req.file) return next(new AppError("No file uploaded.", 400));
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url, filename: req.file.filename } });
});

module.exports = router;
