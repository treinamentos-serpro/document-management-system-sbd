# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web que permita ao usuário enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos metadados dos documentos disponíveis na instância.
- Download de um documento pelo identificador.
- Registro de uma identidade de proprietário configurada para a instância.
- Interface React para upload, listagem e download, integrada ao backend pelo proxy `/api` do Vite.

### Fora do escopo

- Armazenamento externo, em nuvem ou serviços de upload de terceiros.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Autenticação, autorização e isolamento seguro entre usuários.
- Persistência durável dos metadados, busca avançada, paginação e classificação por conteúdo.
- Allowlist de formatos de arquivo. O MVP limita o tamanho, mas aceita qualquer tipo de arquivo.

### Premissas e limitações do MVP

- O MVP destina-se a uma instância local ou ambiente confiável de uso simples, não a um serviço multiusuário exposto sem proteção.
- `owner` é preenchido a partir da configuração da instância. Ele é apenas metadado e não comprova a identidade de quem fez a requisição nem controla acesso.
- Os metadados existem somente em memória. Ao reiniciar o processo, eles se perdem; os arquivos continuam no disco e podem ficar órfãos, sem possibilidade de localização pela API.
- O caminho de armazenamento padrão é `backend/storage`. Nenhum provedor remoto ou persistência externa será introduzido.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando `multipart/form-data` no campo `file`. | Uma requisição válida salva o conteúdo localmente e retorna os metadados do documento criado. |
| RF-02 | O sistema rejeita upload sem arquivo, multipart inválido ou arquivo acima do limite configurado. | A requisição recebe o status e o erro JSON definidos na seção de API; nenhum documento parcial fica disponível na listagem. |
| RF-03 | O sistema atribui identificador único, data/hora de upload e `owner` configurado ao documento. | A resposta contém `id` UUID, `uploadedAt` ISO 8601 UTC e o `owner` da instância. |
| RF-04 | O usuário pode listar os metadados disponíveis na instância. | A resposta é uma lista JSON sem paginação, ordenada do upload mais recente ao mais antigo. |
| RF-05 | O usuário pode baixar um documento pelo identificador. | Um ID conhecido retorna o conteúdo binário como anexo; um ID desconhecido retorna `404`. |
| RF-06 | O sistema não expõe o caminho físico nem o nome interno de armazenamento nos metadados públicos. | As respostas de upload e listagem contêm somente os campos públicos definidos na seção 5. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. A perda de metadados após reinício e a possibilidade de arquivos órfãos devem ser tratadas como limitações conhecidas. |
| RNF-03 | A configuração deve seguir 12-Factor e usar variáveis de ambiente para porta, identidade do proprietário e limite de upload. |
| RNF-04 | O tamanho máximo inicial é 10 MiB (10.485.760 bytes) por arquivo, ajustável pela configuração da aplicação. |
| RNF-05 | O nome original deve ser tratado como dado não confiável. O nome físico será gerado pelo servidor; não se deve concatenar entrada do usuário a um caminho de filesystem. |
| RNF-06 | Falhas de validação, leitura ou escrita devem ser convertidas em respostas HTTP previsíveis, sem expor stack traces ou caminhos internos. |
| RNF-07 | O backend deve permanecer em JavaScript CommonJS com Express; o frontend deve permanecer em JavaScript ESM com React e Vite. |
| RNF-08 | Os testes do backend devem usar o runner nativo `node:test`, sem adicionar dependência de teste nesta fase. |

### Configuração do MVP

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `DMS_OWNER_ID` | `local-user` | Valor colocado no campo `owner`; não é mecanismo de autenticação. |
| `DMS_MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho máximo por arquivo, em bytes. Deve ser um inteiro positivo. |

O diretório de armazenamento é `backend/storage`, relativo à raiz do backend, e não é redirecionado a armazenamento externo.

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | UUID gerado pelo servidor e usado nos caminhos da API. |
| `originalName` | string | Nome original informado no upload, preservado como metadado e não usado como caminho físico. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data/hora UTC em formato ISO 8601, por exemplo `2026-09-29T12:00:00.000Z`. |
| `owner` | string | Valor de `DMS_OWNER_ID` para a instância. É informativo e não implica controle de acesso. |

Exemplo da representação pública:

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": "local-user"
}
```

### Dados internos de armazenamento

O repositório mantém, além dos metadados públicos, uma referência interna ao nome/caminho gerado no armazenamento. Essa referência nunca é serializada nas respostas HTTP. O arquivo físico deve receber um nome gerado pelo servidor, sem depender de `originalName`; o UUID do documento pode ser usado como base desse nome.

Os metadados permanecem em uma coleção em memória durante a vida do processo. Não há reconstrução do índice a partir do diretório de arquivos após reinício.

## 6. Contratos de API

### Convenções

- Os caminhos públicos usados pelo frontend incluem o prefixo `/api`.
- No desenvolvimento, o Vite encaminha `/api/*` para `http://localhost:3000` removendo `/api`. Portanto, os caminhos correspondentes no backend não incluem esse prefixo. Em outro ambiente, o proxy equivalente deve ser configurado no servidor web.
- Respostas de metadados usam `application/json`; downloads usam conteúdo binário e `Content-Disposition: attachment`.
- O nome do arquivo no cabeçalho de download deve ser tratado/escapado para não permitir injeção de cabeçalhos. O tipo de conteúdo do download é `application/octet-stream`, sem inferir que o conteúdo foi validado.
- Erros usam o formato `{ "error": { "code": "...", "message": "..." } }`. Mensagens devem ser claras em português e não revelar detalhes internos.
- Não há autenticação, token, filtro de proprietário ou paginação no MVP. A listagem e o download estão acessíveis a qualquer cliente que alcance o backend.

### `POST /api/upload` (backend: `POST /upload`)

Envia um arquivo e cria um registro de metadados.

**Entrada**

- `Content-Type: multipart/form-data`.
- Um campo de arquivo chamado `file`.
- Um único arquivo por requisição; campos adicionais não são usados para definir metadados.
- Até 10 campos de texto e 12 partes multipart por requisição; exceder esses limites retorna `400 FILE_REQUIRED`.
- Tamanho máximo padrão de 10 MiB, configurável por `DMS_MAX_FILE_SIZE_BYTES`.
- Sem allowlist de extensão ou MIME no MVP.

**Sucesso**

- `201 Created`, `Content-Type: application/json`.
- Corpo: objeto `Document` com os cinco campos públicos da seção 5.
- O conteúdo é gravado primeiro no armazenamento local. O nome original não define o nome físico.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou requisição multipart inválida. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima do limite configurado. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Requisição não enviada como `multipart/form-data`. |
| `500` | `STORAGE_ERROR` | Falha ao gravar o arquivo ou registrar seus metadados. |

### `GET /api/documents` (backend: `GET /documents`)

Lista os metadados conhecidos pelo processo atual.

**Entrada**

- Sem corpo, parâmetros ou filtros definidos.

**Sucesso**

- `200 OK`, `Content-Type: application/json`.
- Corpo: array de objetos `Document`, do mais recente ao mais antigo. Empates em `uploadedAt` são ordenados por `id` em ordem crescente para manter resultado determinístico.
- Sem paginação. Lista vazia é `[]`.

**Erro**

- `500`, código `DOCUMENT_LIST_ERROR`, se a listagem falhar por erro interno.

### `GET /api/documents/:id/download` (backend: `GET /documents/:id/download`)

Transmite o conteúdo do arquivo associado ao ID.

**Entrada**

- `id` UUID do documento.

**Sucesso**

- `200 OK`, resposta binária com `Content-Type: application/octet-stream` e `Content-Disposition: attachment` usando o nome original de forma segura.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `404` | `DOCUMENT_NOT_FOUND` | ID inválido ou sem metadados disponíveis no processo atual. |
| `500` | `FILE_READ_ERROR` | O registro existe, mas não foi possível ler/transmitir o arquivo local. |

### Endpoint operacional existente

`GET /health` permanece como endpoint operacional do backend e retorna `200` com `{ "status": "ok" }`. Ele não substitui os contratos funcionais do DMS.

## 7. Decisões arquiteturais

### Backend

O backend usa Node.js, Express e CommonJS, com responsabilidades separadas em quatro camadas:

- `routes/`: declara os caminhos e encaminha chamadas aos controllers.
- `controllers/`: valida entrada HTTP básica, chama os serviços e traduz resultados/erros para HTTP.
- `services/`: aplica regras de negócio, como limites, geração de metadados e fluxo de upload/download.
- `repositories/`: grava e lê arquivos locais via Multer `diskStorage` e mantém metadados em memória.

Fluxo de dependência permitido: `routes -> controllers -> services -> repositories`. Camadas internas não devem depender do Express. Erros de Multer, filesystem ou entrada HTTP são convertidos nas respostas descritas na seção 6.

### Frontend

O frontend usa React, Vite, componentes funcionais e `fetch`. A comunicação usa o prefixo `/api`; no desenvolvimento o proxy do Vite remove esse prefixo e encaminha ao backend local. A organização segue `components/`, `pages/` e `services/`, evitando duplicação da lógica de chamadas HTTP.

### Armazenamento

O armazenamento de arquivos é exclusivamente local em `backend/storage`, com Multer `diskStorage`. Não incluir bucket, banco de dados, serviço externo de upload ou persistência durável de metadados nesta fase. O nome físico é gerado no servidor; o nome original serve apenas para apresentação e download.

## 8. Plano de execução

As etapas abaixo são um roteiro futuro. Esta entrega é somente esta especificação; nenhuma etapa de código do backend ou frontend faz parte da criação do documento.

1. **Preparar contratos e configuração:** adotar os contratos desta especificação, validar as variáveis de ambiente e garantir a existência/uso seguro do diretório local.
2. **Implementar persistência local e metadados:** configurar Multer `diskStorage`, nome físico gerado pelo servidor e repositório em memória; validar limite, erros e metadados gerados.
3. **Implementar regras e API:** adicionar serviços, controllers e routes nas camadas definidas; cobrir upload, listagem, download e mapeamento de erros com testes `node:test`.
4. **Integrar a interface React:** implementar os fluxos de upload, listagem e download usando `fetch` no prefixo `/api`, incluindo estados de carregamento e erro.
5. **Validar o fluxo completo:** executar testes do backend e verificar manualmente os três fluxos no Vite com proxy; confirmar limites de arquivo, cabeçalhos de download, comportamento após reinício e documentação das limitações.

### Critério de conclusão do MVP

- Upload local dentro do limite cria arquivo e metadados conforme contrato.
- Listagem retorna os documentos da execução atual na ordem definida.
- Download recupera o conteúdo com nome de arquivo seguro; ID desconhecido produz `404`.
- Erros de entrada e filesystem usam o formato e os status definidos.
- A interface usa `/api` e funciona com o proxy configurado.
- Testes e documentação deixam explícitos a ausência de autenticação e o caráter volátil dos metadados.