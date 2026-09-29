const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');
const { uploadMiddleware } = require('../repositories/documents.repository');

const router = express.Router();

router.post('/upload', uploadMiddleware, documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

router.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o tamanho máximo permitido.' },
      });
    }

    return res.status(400).json({
      error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo válido no campo "file".' },
    });
  }

  if (error.message.startsWith('Multipart:') || error.message === 'Unexpected end of form') {
    return res.status(400).json({
      error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo válido no campo "file".' },
    });
  }

  return res.status(500).json({
    error: { code: 'STORAGE_ERROR', message: 'Não foi possível salvar o documento.' },
  });
});

module.exports = router;