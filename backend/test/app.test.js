const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const documentsRepository = require('../src/repositories/documents.repository');

async function withServer(callback) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('caminhos internos rejeitam nomes com path traversal', async () => {
  await assert.rejects(
    documentsRepository.removeStoredFile('../package.json'),
    /Nome interno de armazenamento inválido/
  );
});

test('upload cria metadados e permite baixar o conteúdo', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    formData.append('file', new Blob(['conteúdo de teste']), '../relatorio.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(uploadResponse.status, 201);

    const document = await uploadResponse.json();
    assert.match(document.id, /^[0-9a-f-]{36}$/i);
    assert.strictEqual(document.originalName, 'relatorio.txt');
    assert.strictEqual(Object.hasOwn(document, 'storageName'), false);

    try {
      const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
      assert.strictEqual(downloadResponse.status, 200);
      assert.strictEqual(await downloadResponse.text(), 'conteúdo de teste');
      assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
    } finally {
      await documentsRepository.removeStoredFile(document.id);
    }
  });
});

test('upload sem arquivo retorna erro de validação', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=empty' },
      body: '--empty--\r\n',
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'FILE_REQUIRED');
  });
});

test('upload rejeita excesso de campos multipart', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    for (let index = 0; index < 11; index += 1) {
      formData.append(`field-${index}`, 'valor');
    }

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'FILE_REQUIRED');
  });
});
