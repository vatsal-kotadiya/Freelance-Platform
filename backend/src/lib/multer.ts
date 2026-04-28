import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

export const DELIVERY_ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/octet-stream',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'text/plain',
]);

export const DELIVERY_ALLOWED_EXTS = new Set([
  '.pdf', '.zip', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt',
]);

export const deliveryUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const IMAGE_ALLOWED_MIMES = new Set(['image/jpeg', 'image/png']);
const IMAGE_ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png']);

export const sampleImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (IMAGE_ALLOWED_MIMES.has(file.mimetype) && IMAGE_ALLOWED_EXTS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  },
});
