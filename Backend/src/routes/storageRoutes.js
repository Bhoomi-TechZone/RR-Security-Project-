import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  uploadBase64,
  streamFile,
  deleteFile
} from '../controllers/storageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Memory storage keeps file buffers in memory for direct R2 streaming (no disk clutter)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB max file size
  }
});

// Upload multipart form file to Cloudflare R2
router.post('/upload', protect, upload.single('file'), uploadFile);

// Upload base64 encoded data to Cloudflare R2
router.post('/upload-base64', protect, uploadBase64);

// Public / Authenticated stream of any R2 object with permanent browser caching
// Matches /api/storage/file/<key...> including slashes
router.get('/file/*', streamFile);

// Delete file from Cloudflare R2
router.delete('/file/*', protect, deleteFile);

export default router;
