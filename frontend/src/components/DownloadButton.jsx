export default function DownloadButton({ document }) {
  return (
    <div className="download-control">
      <a
        className="download-button"
        href={`/api/documents/${encodeURIComponent(document.id)}/download`}
        download={document.originalName}
        aria-label={`Baixar ${document.originalName}`}
        title={`Baixar ${document.originalName}`}
      >
        <span aria-hidden="true">↓</span>
        Baixar
      </a>
    </div>
  );
}