import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setLoadError('');

      try {
        const result = await listDocuments();
        if (isCurrent) {
          setDocuments(result);
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(error.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  async function handleUpload(file) {
    const uploadedDocument = await uploadDocument(file);
    setDocuments((currentDocuments) => [
      uploadedDocument,
      ...currentDocuments.filter((document) => document.id !== uploadedDocument.id),
    ]);
    setLoadError('');
    setReloadKey((currentKey) => currentKey + 1);
  }

  const documentCount = documents.length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>Documentos</span>
        </div>
        <div className="instance-label">
          <span className="instance-dot" aria-hidden="true" />
          Instância local
        </div>
      </header>

      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">ESPAÇO DE TRABALHO</p>
          <h1 id="page-title">Seus documentos</h1>
        </div>
        <div className="page-summary" aria-live="polite">
          <strong>{String(documentCount).padStart(2, '0')}</strong>
          <span>{documentCount === 1 ? 'documento armazenado' : 'documentos armazenados'}</span>
        </div>
      </section>

      <div className="workspace-grid">
        <UploadComponent onUpload={handleUpload} />
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          error={loadError}
          onRetry={() => setReloadKey((currentKey) => currentKey + 1)}
        />
      </div>

      <footer className="page-footer">
        <span>Armazenamento no filesystem local</span>
        <span>Metadados disponíveis nesta sessão do servidor</span>
      </footer>
    </main>
  );
}
