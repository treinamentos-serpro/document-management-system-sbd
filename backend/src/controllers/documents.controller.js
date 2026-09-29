const documentsService = require('../services/documents.service');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

async function uploadDocument(req, res) {
  if (!req.is('multipart/form-data')) {
    return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Envie o arquivo usando multipart/form-data.');
  }

  if (!req.file) {
    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    const document = await documentsService.createUploadedDocument(req.file);
    return res.status(201).json(document);
  } catch (error) {
    return sendError(res, 500, 'STORAGE_ERROR', 'Não foi possível salvar o documento.');
  }
}

function listDocuments(req, res) {
  try {
    return res.status(200).json(documentsService.listDocuments());
  } catch (error) {
    return sendError(res, 500, 'DOCUMENT_LIST_ERROR', 'Não foi possível listar os documentos.');
  }
}

function downloadDocument(req, res) {
  let documentRecord;

  try {
    documentRecord = documentsService.findDocumentForDownload(req.params.id);
  } catch (error) {
    return sendError(res, 500, 'FILE_READ_ERROR', 'Não foi possível ler o arquivo.');
  }

  if (!documentRecord) {
    return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return res.download(documentRecord.filePath, documentRecord.document.originalName, (error) => {
    if (error && !res.headersSent) {
      sendError(res, 500, 'FILE_READ_ERROR', 'Não foi possível ler o arquivo.');
    }
  });
}

module.exports = {
  downloadDocument,
  listDocuments,
  uploadDocument,
};