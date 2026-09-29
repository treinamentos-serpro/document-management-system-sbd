const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');

function getSafeOriginalName(originalName) {
  const normalizedName = path.posix.basename(String(originalName || '').replace(/\\/g, '/'));
  const safeName = normalizedName.replace(/[\u0000-\u001f\u007f]/g, '').trim();

  return safeName || 'document';
}

async function createUploadedDocument(file) {
  const document = {
    id: file.filename,
    originalName: getSafeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: process.env.DMS_OWNER_ID || 'local-user',
  };

  try {
    return documentsRepository.createDocument(document, file.filename);
  } catch (error) {
    await documentsRepository.removeStoredFile(file.filename).catch(() => {});
    throw error;
  }
}

function listDocuments() {
  return documentsRepository.listDocuments().sort((left, right) => {
    const dateOrder = right.uploadedAt.localeCompare(left.uploadedAt);
    return dateOrder || left.id.localeCompare(right.id);
  });
}

function findDocumentForDownload(id) {
  return documentsRepository.findDocument(id);
}

module.exports = {
  createUploadedDocument,
  findDocumentForDownload,
  listDocuments,
};