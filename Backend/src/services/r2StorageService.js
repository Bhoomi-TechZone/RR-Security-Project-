import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'rr-security';
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

let s3ClientInstance = null;

export const getR2Client = () => {
  if (!s3ClientInstance) {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.warn('Cloudflare R2 Credentials missing in environment variables.');
    }
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3ClientInstance;
};

/**
 * Sanitizes a filename to safe characters
 */
export const sanitizeFileName = (name = 'file') => {
  return String(name)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');
};

/**
 * Computes URL for accessing the uploaded object
 */
export const getFileAccessUrl = (key, req = null) => {
  const cleanKey = String(key || '').replace(/^\/+/, '');
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${cleanKey}`;
  }
  // Internal high-performance streaming route
  return `/api/storage/file/${cleanKey}`;
};

/**
 * Upload a raw Buffer to Cloudflare R2
 */
export const uploadBufferToR2 = async ({
  buffer,
  originalName = 'upload.bin',
  mimeType = 'application/octet-stream',
  folder = 'documents',
  companyId = '',
  customKey = null,
  req = null
}) => {
  const client = getR2Client();
  const safeName = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '') || 'documents';
  const prefix = companyId ? `${companyId.replace(/[^a-zA-Z0-9_-]/g, '')}/` : '';
  const key = customKey || `${prefix}${cleanFolder}/${timestamp}_${randomSuffix}_${safeName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: {
      originalName: safeName,
      uploadedAt: new Date().toISOString()
    }
  });

  await client.send(command);

  return {
    key,
    fileName: safeName,
    url: getFileAccessUrl(key, req),
    size: buffer.length,
    contentType: mimeType,
    bucket: R2_BUCKET_NAME
  };
};

/**
 * Upload Base64 / Data URL to Cloudflare R2
 */
export const uploadBase64ToR2 = async ({
  base64Data,
  filename = 'file.png',
  folder = 'images',
  companyId = '',
  req = null
}) => {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('Invalid base64 payload provided');
  }

  let mimeType = 'application/octet-stream';
  let cleanBase64 = base64Data;

  // Handle data URI scheme (e.g. data:image/png;base64,iVBORw0KGgo...)
  const match = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    cleanBase64 = match[2];
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  return uploadBufferToR2({
    buffer,
    originalName: filename,
    mimeType,
    folder,
    companyId,
    req
  });
};

/**
 * Stream a file from Cloudflare R2
 */
export const getFileFromR2 = async (key) => {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    etag: response.ETag
  };
};

/**
 * Delete a file from Cloudflare R2
 */
export const deleteFileFromR2 = async (key) => {
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return client.send(command);
};

export default {
  getR2Client,
  uploadBufferToR2,
  uploadBase64ToR2,
  getFileFromR2,
  deleteFileFromR2,
  getFileAccessUrl
};
