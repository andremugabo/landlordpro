// src/utils/uploadProof.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// -------------------- CONFIG --------------------
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(__dirname, '../../uploads/payments');

// -------------------- MULTER MEMORY STORAGE --------------------
const storage = multer.memoryStorage();

// -------------------- FILE FILTER --------------------
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, PDF'));
};

// -------------------- MULTER UPLOAD --------------------
const uploadProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// -------------------- SHARP IMAGE PROCESSING --------------------
const processProof = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const paymentId = req.params.paymentId || req.body.paymentId || Date.now().toString();
    const proofDir = path.join(UPLOAD_DIR, paymentId);
    fs.mkdirSync(proofDir, { recursive: true });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const filepath = path.join(proofDir, filename);

    if (req.file.mimetype.startsWith('image/')) {
      // Resize & compress image
      await sharp(req.file.buffer)
        .resize(800)
        .toFormat(ext === '.png' ? 'png' : 'jpeg', { quality: 80 })
        .toFile(filepath);
    } else if (req.file.mimetype === 'application/pdf') {
      // Save PDF directly
      fs.writeFileSync(filepath, req.file.buffer);
    }

    req.file.filename = filename;
    req.file.path = `/uploads/payments/${paymentId}/${filename}`;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadProof,
  processProof,
};
