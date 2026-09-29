const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');
const { storageDirectory } = require('../config/storage');

const defaultMaxFileSizeBytes = 10 * 1024 * 1024;
const configuredMaxFileSizeBytes = Number(
  process.env.DMS_MAX_FILE_SIZE_BYTES || defaultMaxFileSizeBytes
);

if (!Number.isInteger(configuredMaxFileSizeBytes) || configuredMaxFileSizeBytes <= 0) {
  throw new Error('DMS_MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: configuredMaxFileSizeBytes,
    files: 1,
    fields: 10,
    parts: 12,
  },
}).single('file');