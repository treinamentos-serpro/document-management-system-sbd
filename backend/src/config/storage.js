const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const storageNamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveStoredFilePath(storageName) {
  if (typeof storageName !== 'string' || !storageNamePattern.test(storageName)) {
    throw new Error('Nome interno de armazenamento inválido.');
  }

  const filePath = path.resolve(storageDirectory, storageName);
  if (path.dirname(filePath) !== storageDirectory) {
    throw new Error('Caminho de armazenamento inválido.');
  }

  return filePath;
}

module.exports = {
  resolveStoredFilePath,
  storageDirectory,
};