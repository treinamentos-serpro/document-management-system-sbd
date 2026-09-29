import DownloadButton from './DownloadButton.jsx';
import formatFileSize from '../utils/formatFileSize.js';

function formatUploadDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  return (
    <section className="documents-panel" aria-labelledby="documents-heading">
      <div className="section-heading document-list-heading">
        <div>
          <p className="eyebrow">ARQUIVO</p>
          <h2 id="documents-heading">Documentos</h2>
        </div>
        <span className="document-count" aria-label={`${documents.length} documentos`}>
          {String(documents.length).padStart(2, '0')}
        </span>
      </div>

      {isLoading ? (
        <div className="list-message" role="status">Carregando documentos...</div>
      ) : error ? (
        <div className="list-message list-error" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-mark" aria-hidden="true">—</span>
          <p>Nenhum documento por aqui.</p>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="document-type" aria-hidden="true">DOC</span>
              <div className="document-details">
                <span className="document-name" title={document.originalName}>
                  {document.originalName}
                </span>
                <span className="document-meta">
                  {formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatUploadDate(document.uploadedAt)}
                </span>
              </div>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}