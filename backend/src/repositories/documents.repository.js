const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
const defaultMaxFileSizeBytes = 10 * 1024 * 1024;
const configuredMaxFileSizeBytes = Number(
  process.env.DMS_MAX_FILE_SIZE_BYTES || defaultMaxFileSizeBytes
);

if (!Number.isInteger(configuredMaxFileSizeBytes) || configuredMaxFileSizeBytes <= 0) {
  throw new Error('DMS_MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const documents = new Map();

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

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: configuredMaxFileSizeBytes,
    files: 1,
  },
}).single('file');

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

function createDocument(document, storageName) {
  const storedDocument = { ...document, storageName };
  documents.set(document.id, storedDocument);
  return toPublicDocument(storedDocument);
}

function listDocuments() {
  return [...documents.values()].map(toPublicDocument);
}

function findDocument(id) {
  const document = documents.get(id);

  if (!document) {
    return null;
  }

  return {
    document: toPublicDocument(document),
    filePath: path.join(storageDirectory, document.storageName),
  };
}

async function removeStoredFile(storageName) {
  const filePath = path.join(storageDirectory, storageName);

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  createDocument,
  findDocument,
  listDocuments,
  removeStoredFile,
  uploadMiddleware,
};