import { useState } from 'react';
import formatFileSize from '../utils/formatFileSize.js';

export default function UploadComponent({ onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      form.reset();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ENTRADA</p>
          <h2 id="upload-heading">Adicionar documento</h2>
        </div>
        <span className="section-index" aria-hidden="true">01</span>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker" htmlFor="document-file">
          <span className="file-picker-mark" aria-hidden="true">+</span>
          <span className="file-picker-copy">
            <strong>{selectedFile ? 'Arquivo selecionado' : 'Escolher um arquivo'}</strong>
            <span>{selectedFile ? selectedFile.name : 'Qualquer formato de arquivo'}</span>
          </span>
          <span className="file-picker-action">Procurar</span>
        </label>
        <input
          className="visually-hidden"
          id="document-file"
          name="file"
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
            setError('');
          }}
        />

        <div className="upload-footer">
          <span className="file-size">
            {selectedFile ? formatFileSize(selectedFile.size) : 'Armazenamento local'}
          </span>
          <button className="primary-button" type="submit" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar arquivo'}
            {!isUploading && <span aria-hidden="true">↗</span>}
          </button>
        </div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        {isUploading && <p className="upload-progress" role="status">Enviando arquivo para o armazenamento local...</p>}
      </form>
    </section>
  );
}