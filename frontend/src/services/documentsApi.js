const API_PREFIX = '/api';

async function ensureSuccessfulResponse(response) {
  if (response.ok) {
    return response;
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const error = new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
  error.status = response.status;
  error.code = payload?.error?.code;
  throw error;
}

export async function listDocuments() {
  const response = await ensureSuccessfulResponse(
    await fetch(`${API_PREFIX}/documents`)
  );
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await ensureSuccessfulResponse(
    await fetch(`${API_PREFIX}/upload`, {
      method: 'POST',
      body: formData,
    })
  );

  return response.json();
}

export async function downloadDocument(id) {
  const response = await ensureSuccessfulResponse(
    await fetch(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`)
  );

  return response.blob();
}