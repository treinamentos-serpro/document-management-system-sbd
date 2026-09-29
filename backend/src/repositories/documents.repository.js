const fs = require('node:fs');
const { resolveStoredFilePath } = require('../config/storage');

const documents = new Map();

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
    filePath: resolveStoredFilePath(document.storageName),
  };
}

async function removeStoredFile(storageName) {
  const filePath = resolveStoredFilePath(storageName);

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
};