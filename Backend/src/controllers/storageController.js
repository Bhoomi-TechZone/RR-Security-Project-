import {
  uploadBufferToR2,
  uploadBase64ToR2,
  getFileFromR2,
  deleteFileFromR2
} from '../services/r2StorageService.js';

/**
 * @desc    Upload single file (multipart form-data) directly to Cloudflare R2
 * @route   POST /api/storage/upload
 * @access  Private
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided in request.' });
    }

    const folder = req.body.folder || req.query.folder || 'documents';
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || '';

    const uploaded = await uploadBufferToR2({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder,
      companyId,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'File successfully uploaded to Cloudflare R2',
      file: uploaded
    });
  } catch (error) {
    console.error('uploadFile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to Cloudflare R2',
      error: error.message
    });
  }
};

/**
 * @desc    Upload base64 data directly to Cloudflare R2
 * @route   POST /api/storage/upload-base64
 * @access  Private
 */
export const uploadBase64 = async (req, res) => {
  try {
    const { base64Data, filename, folder } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, message: 'base64Data is required.' });
    }

    const targetFolder = folder || req.query.folder || 'images';
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.user?.companyId || '';

    const uploaded = await uploadBase64ToR2({
      base64Data,
      filename: filename || 'file.png',
      folder: targetFolder,
      companyId,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Base64 image successfully uploaded to Cloudflare R2',
      file: uploaded
    });
  } catch (error) {
    console.error('uploadBase64 error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload base64 to Cloudflare R2',
      error: error.message
    });
  }
};

/**
 * @desc    Stream / View file directly from Cloudflare R2 with high-performance caching
 * @route   GET /api/storage/file/*
 * @access  Public / Authenticated
 */
export const streamFile = async (req, res) => {
  try {
    // Extract key from route param or wildcard
    let rawKey = req.params[0] || req.params.key || req.query.key || '';
    try {
      rawKey = decodeURIComponent(rawKey);
    } catch {
      // Keep as-is if decode fails
    }
    rawKey = rawKey.replace(/^\/+/, '');

    if (!rawKey) {
      return res.status(400).json({ success: false, message: 'Object key is required' });
    }

    const fileData = await getFileFromR2(rawKey);

    // Apply high-performance CDN / Browser caching headers (1 year immutable)
    res.setHeader('Content-Type', fileData.contentType);
    if (fileData.contentLength) {
      res.setHeader('Content-Length', fileData.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Extract filename for display / download
    const filename = rawKey.split('/').pop() || 'file';
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the body to client
    fileData.stream.pipe(res);
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ success: false, message: 'File not found on Cloudflare R2 storage.' });
    }
    console.error('streamFile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve file from Cloudflare R2',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a file from Cloudflare R2
 * @route   DELETE /api/storage/file/*
 * @access  Private
 */
export const deleteFile = async (req, res) => {
  try {
    let rawKey = req.params[0] || req.params.key || req.query.key || '';
    try {
      rawKey = decodeURIComponent(rawKey);
    } catch {
      // Keep as-is if decode fails
    }
    rawKey = rawKey.replace(/^\/+/, '');

    if (!rawKey) {
      return res.status(400).json({ success: false, message: 'Object key is required' });
    }

    await deleteFileFromR2(rawKey);

    return res.status(200).json({
      success: true,
      message: 'File successfully deleted from Cloudflare R2',
      key: rawKey
    });
  } catch (error) {
    console.error('deleteFile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file from Cloudflare R2',
      error: error.message
    });
  }
};

export default {
  uploadFile,
  uploadBase64,
  streamFile,
  deleteFile
};
