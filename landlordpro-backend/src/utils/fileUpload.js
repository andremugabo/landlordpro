// src/utils/uploadProof.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const sharp = require('sharp');
const crypto = require('crypto');

// -------------------- CONFIG --------------------
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_DIMENSION = 10000; // Prevent decompression bombs
const IMAGE_QUALITY = 80;
const AVATAR_SIZE = 300;
const PROOF_SIZE = 800;

const UPLOAD_DIR = path.join(__dirname, `../../uploads/${sanitizeFolder(process.env.UPLOAD_FOLDER) || 'payments'}`);
const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');

// -------------------- SECURITY HELPERS --------------------

/**
 * Sanitize folder name to prevent path traversal
 */
function sanitizeFolder(folder) {
  if (!folder) return null;
  // Remove any path separators and special characters
  return folder.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validate UUID format to prevent path traversal
 */
function validateUUID(id) {
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
}

/**
 * Generate secure random filename
 */
function generateSecureFilename(originalExtension) {
  const randomName = crypto.randomBytes(16).toString('hex');
  const sanitizedExt = originalExtension.toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `${Date.now()}-${randomName}${sanitizedExt}`;
}

/**
 * Validate file extension against whitelist
 */
function validateFileExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid file extension');
  }
  return ext;
}

/**
 * Validate image dimensions to prevent decompression bombs
 */
async function validateImageDimensions(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions exceed maximum allowed (${MAX_IMAGE_DIMENSION}px)`);
    }
    return metadata;
  } catch (err) {
    throw new Error('Invalid or corrupted image file');
  }
}

/**
 * Validate file content matches declared MIME type (magic number check)
 */
async function validateFileContent(buffer, declaredMimetype) {
  // Check magic numbers (file signatures)
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  };

  const signature = signatures[declaredMimetype];
  if (!signature) return false;

  // Check if buffer starts with the expected signature
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  // Additional WebP validation (must have WEBP after RIFF)
  if (declaredMimetype === 'image/webp') {
    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
    for (let i = 0; i < webpSignature.length; i++) {
      if (buffer[8 + i] !== webpSignature[i]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Ensure directory exists (async)
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Delete old files in a directory (cleanup)
 */
async function cleanupOldFiles(dir, keepLatest = 1) {
  try {
    const files = await fs.readdir(dir);
    if (files.length <= keepLatest) return;

    // Sort by creation time (newest first)
    const fileStats = await Promise.all(
      files.map(async (file) => ({
        name: file,
        path: path.join(dir, file),
        time: (await fs.stat(path.join(dir, file))).mtime.getTime(),
      }))
    );

    fileStats.sort((a, b) => b.time - a.time);

    // Delete all except the latest N files
    const filesToDelete = fileStats.slice(keepLatest);
    await Promise.all(filesToDelete.map(file => fs.unlink(file.path).catch(() => {})));
  } catch (err) {
    // Silent failure on cleanup - not critical
    console.error('Cleanup error:', err.message);
  }
}

// -------------------- MULTER MEMORY STORAGE --------------------
const storage = multer.memoryStorage();

// -------------------- FILE FILTER --------------------
const fileFilter = (req, file, cb) => {
  try {
    // Validate MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, PDF'));
    }

    // Validate file extension
    validateFileExtension(file.originalname);
    
    cb(null, true);
  } catch (err) {
    cb(err);
  }
};

// -------------------- MULTER UPLOAD --------------------
const uploadProof = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only one file at a time
  },
});

// -------------------- SHARP IMAGE PROCESSING --------------------
const processProof = async (req, res, next) => {
  if (!req.file) return next();

  let proofDir = null;

  try {
    // Validate and sanitize paymentId
    const paymentId = req.params.paymentId || req.body.paymentId || Date.now().toString();
    const sanitizedPaymentId = paymentId.length === 36 ? validateUUID(paymentId) : paymentId;

    // Validate file extension
    const ext = validateFileExtension(req.file.originalname);

    // Validate file content matches MIME type
    const isValidContent = await validateFileContent(req.file.buffer, req.file.mimetype);
    if (!isValidContent) {
      throw new Error('File content does not match declared type');
    }

    // Create directory structure
    proofDir = path.join(UPLOAD_DIR, sanitizedPaymentId);
    await ensureDir(proofDir);

    // Generate secure filename
    const filename = generateSecureFilename(ext);
    const filepath = path.join(proofDir, filename);

    // Process based on file type
    if (ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      // Validate image dimensions
      await validateImageDimensions(req.file.buffer);

      // Process and save image
      await sharp(req.file.buffer)
        .resize(PROOF_SIZE, PROOF_SIZE, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .toFormat(ext === '.png' ? 'png' : 'jpeg', { quality: IMAGE_QUALITY })
        .toFile(filepath);

    } else if (req.file.mimetype === 'application/pdf') {
      // Save PDF with size validation
      if (req.file.buffer.length > MAX_FILE_SIZE) {
        throw new Error('PDF file size exceeds maximum allowed');
      }
      await fs.writeFile(filepath, req.file.buffer);
    }

    // Set file metadata on request object (maintains backward compatibility)
    req.file.filename = filename;
    req.file.path = `/uploads/payments/${sanitizedPaymentId}/${filename}`;
    req.file.secureFilename = filename; // Additional secure reference

    next();
  } catch (err) {
    // Clean up directory if file processing failed
    if (proofDir) {
      try {
        await fs.unlink(path.join(proofDir, req.file.filename)).catch(() => {});
      } catch {}
    }

    // Return user-friendly error
    const userError = new Error('File upload failed: ' + err.message);
    userError.status = 400;
    next(userError);
  }
};

// -------------------- PROFILE PICTURE UPLOAD --------------------
const uploadAvatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    try {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only images allowed for profile picture.'));
      }
      validateFileExtension(file.originalname);
      cb(null, true);
    } catch (err) {
      cb(err);
    }
  },
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
});

const processAvatar = async (req, res, next) => {
  if (!req.file) return next();

  let avatarDir = null;

  try {
    // Validate and sanitize userId
    const userId = req.user?.id || req.params.userId || Date.now().toString();
    const sanitizedUserId = userId.length === 36 ? validateUUID(userId) : userId;

    // Validate file extension
    const ext = validateFileExtension(req.file.originalname);

    // Validate file content matches MIME type
    const isValidContent = await validateFileContent(req.file.buffer, req.file.mimetype);
    if (!isValidContent) {
      throw new Error('File content does not match declared type');
    }

    // Validate image dimensions
    await validateImageDimensions(req.file.buffer);

    // Create directory structure
    avatarDir = path.join(AVATAR_DIR, sanitizedUserId);
    await ensureDir(avatarDir);

    // Clean up old avatars (keep only the latest one)
    await cleanupOldFiles(avatarDir, 0); // Delete all before saving new one

    // Generate secure filename
    const filename = generateSecureFilename(ext);
    const filepath = path.join(avatarDir, filename);

    // Process and save avatar
    await sharp(req.file.buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { 
        fit: 'cover',
        position: 'center'
      })
      .toFormat(ext === '.png' ? 'png' : 'jpeg', { quality: IMAGE_QUALITY })
      .toFile(filepath);

    // Set file metadata on request object (maintains backward compatibility)
    req.file.filename = filename;
    req.file.path = `/uploads/avatars/${sanitizedUserId}/${filename}`;
    req.file.secureFilename = filename; // Additional secure reference

    next();
  } catch (err) {
    // Clean up directory if file processing failed
    if (avatarDir && req.file.filename) {
      try {
        await fs.unlink(path.join(avatarDir, req.file.filename)).catch(() => {});
      } catch {}
    }

    // Return user-friendly error
    const userError = new Error('Avatar upload failed: ' + err.message);
    userError.status = 400;
    next(userError);
  }
};

// -------------------- INITIALIZATION --------------------
// Ensure upload directories exist on module load
(async () => {
  try {
    if (!fsSync.existsSync(UPLOAD_DIR)) {
      await ensureDir(UPLOAD_DIR);
    }
    if (!fsSync.existsSync(AVATAR_DIR)) {
      await ensureDir(AVATAR_DIR);
    }
  } catch (err) {
    console.error('Failed to create upload directories:', err.message);
  }
})();

module.exports = {
  uploadProof,
  processProof,
  uploadAvatar,
  processAvatar,
};