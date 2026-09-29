---
description: "Gera ou atualiza a documentação da API backend de um recurso com base na implementação existente."
name: documentar-api-recurso
argument-hint: nome do recurso (ex. documents)
agent: agent
---

# Documentar API backend de um recurso

Gere ou atualize a documentação da API backend para o recurso `${input:recurso:nome do recurso}`.

## Inspeção

Antes de escrever, siga o caminho implementado para o recurso, lendo somente os arquivos necessários:

- `backend/src/routes/` para métodos e caminhos definidos;
- `backend/src/app.js` e demais registros de router/middleware para descobrir o caminho efetivamente montado, prefixos, autenticação, validação e tratamento de erros;
- controllers e services para comportamento, validações e respostas;
- repositórios e configuração para persistência, limites e dependências do contrato;
- testes existentes para confirmar casos de sucesso e falha.

Não deduza o contrato apenas pelo nome do recurso, pela especificação futura ou por comentários. A implementação executável e seus testes são a fonte do comportamento atual. Se uma rota estiver ausente ou incompleta, registre isso claramente como não implementado ou não determinado.

## Saída

Crie ou atualize somente `docs/api/${input:recurso}.md`. Não altere arquivos de aplicação, testes, dependências ou outros documentos.

Escreva a documentação em português e use esta estrutura, omitindo uma subseção apenas quando ela não se aplicar:

1. **Visão geral** — responsabilidade do recurso, prefixo/base path efetivamente montado e observações de autenticação/autorização.
2. **Endpoints** — para cada rota, método HTTP e caminho completo, descrição e requisitos de acesso.
3. **Entrada** — parâmetros de path/query, headers, content type e corpo, incluindo campos obrigatórios/opcionais, tipos e limites comprovados.
4. **Respostas** — status HTTP reais, content type e estrutura/campos do corpo; diferencie respostas binárias, vazias e JSON.
5. **Erros** — status, códigos e condições efetivamente tratados, incluindo erros de validação, recursos inexistentes e falhas internas.
6. **Exemplos** — exemplos mínimos e válidos de `curl` para operações relevantes, com valores ilustrativos e sem credenciais reais.
7. **Comportamento e limitações** — regras observadas de persistência, ordenação, efeitos colaterais, configuração e limitações de segurança relevantes.
8. **Lacunas** — pontos do contrato que não podem ser confirmados na implementação ou nos testes. Não os apresente como garantias.

## Regras de precisão

- Documente apenas o comportamento observado no código e confirmado pelos testes disponíveis; não transforme requisitos futuros em funcionalidades atuais.
- Não invente status, formato de erro, autenticação, paginação, validação, valores padrão ou campos de resposta. Quando não houver evidência, escreva “não definido na implementação atual”.
- Descreva os caminhos conforme registrados no Express. Explique separadamente prefixos adicionados por proxy (por exemplo, `/api`) quando houver configuração comprovada.
- Use exemplos que correspondam ao content type e à estrutura realmente aceitos. Nunca inclua segredos ou dados pessoais reais.
- Destaque explicitamente ausência de autenticação/autorização e riscos de exposição quando forem observados.
- Preserve o estilo e a formatação dos documentos existentes em `docs/` quando aplicável.
- Não execute nem altere a API para fazê-la corresponder à documentação. O objetivo é descrever a implementação existente.