# Referência da API

Documentação dos endpoints REST do SindiPro. Todas as rotas têm prefixo `/api/v1`.

> **Documentação interativa:** com a aplicação rodando, acesse [`http://localhost:8080/swagger-ui.html`](http://localhost:8080/swagger-ui.html).

---

## Convenções

### Base URL

| Ambiente     | URL                                        |
|--------------|--------------------------------------------|
| **Local**    | `http://localhost:8080/api/v1`             |
| **Produção** | `https://sindipro-api.onrender.com/api/v1` |

### Autenticação

A maioria dos endpoints exige o header:


#### Authorization: Bearer <JWT>

O token é obtido em `POST /auth/login` e tem validade de **24 horas**.

##### Formato de erro

Todos os erros seguem o mesmo formato (inspirado em RFC 7807):

```json
{
  "timestamp": "2026-11-05T21:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Descrição do erro",
  "path": "/api/v1/reservas",
  "details": ["campo1: mensagem", "campo2: mensagem"]
}
```

| Campo       | Descrição                                      |
|-------------|------------------------------------------------|
| `timestamp` | Momento do erro (UTC)                          |
| `status`    | Código HTTP                                    |
| `error`     | Nome do status HTTP                            |
| `message`   | Mensagem legível                               |
| `path`      | Rota que gerou o erro                          |
| `details`   | Lista de erros de validação (quando aplicável) |

### Códigos HTTP usados

| Status                        | Significado                           | Quando ocorre                             |
|-------------------------------|---------------------------------------|-------------------------------------------|
| `200 OK`                      | Sucesso                               | GET, PUT, PATCH                           |
| `201 Created`                 | Recurso criado                        | POST                                      |
| `204 No Content`              | Sucesso sem body                      | DELETE                                    |
| `400 Bad Request`             | Erro de validação ou regra de negócio | Payload inválido, transição ilegal        |
| `401 Unauthorized`            | Não autenticado                       | Sem token ou token inválido               |
| `403 Forbidden`               | Sem permissão                         | Role insuficiente                         |
| `404 Not Found`               | Recurso inexistente                   | ID não encontrado                         |
| `409 Conflict`                | Conflito com estado atual             | E-mail duplicado, sobreposição de reserva |
| `500 Internal Server Error`   | Erro inesperado                       | Falha no servidor                         |

### Paginação

Endpoints paginados seguem o padrão Spring Data:

**Query params:**
- `page` (default `0`) — número da página (base 0)
- `size` (default `20`) — itens por página
- `sort` (default varia) — ex.: `sort=nome,asc`

**Resposta:**

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

### Datas e horários

- **Datas/horas absolutas** (`Instant`) → ISO-8601 UTC: `"2026-12-25T21:00:00Z"`
- **Datas apenas** (`LocalDate`) → `"2026-12-25"`
- **Horas apenas** (`LocalTime`) → `"22:00:00"`
- **Reservas** → enviar ISO com offset `-03:00` (horário de Brasília): `"2026-12-25T18:00:00-03:00"`

---

## Autenticação

### `POST /auth/login`

Autentica um usuário e retorna JWT.

**Autenticação:** não requer

**Request:**
```json
{
  "email": "admin@condominio.local",
  "senha": "admin123"
}
```

**Resposta 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tipo": "Bearer",
  "id": 1,
  "nome": "Administrador do Sistema",
  "email": "admin@condominio.local",
  "role": "ADMIN_SISTEMA"
}
```

**Erros:**
- `400` — e-mail ou senha em branco
- `401` — credenciais inválidas

**Exemplo:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@condominio.local","senha":"admin123"}'
```

---

### `POST /auth/register`

Cadastra novo usuário. Retorna JWT automaticamente.

**Autenticação:** não requer

**Request:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senhaForte123",
  "role": "MORADOR"
}
```

`role` aceita: `ADMIN_SISTEMA`, `SINDICO`, `MORADOR`, `PORTEIRO`, `ZELADOR`

**Resposta 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tipo": "Bearer",
  "id": 10,
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "role": "MORADOR"
}
```

**Erros:**
- `400` — validação (senha < 6 caracteres, e-mail inválido)
- `409` — e-mail já cadastrado

---

### `GET /auth/me`

Retorna os dados do usuário autenticado.

**Autenticação:** Bearer

**Resposta 200:**
```json
{
  "id": 1,
  "nome": "Administrador do Sistema",
  "email": "admin@condominio.local",
  "role": "ADMIN_SISTEMA"
}
```

**Erros:**
- `401` — token inválido/expirado

**Exemplo:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@condominio.local","senha":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Usuários

### `GET /usuarios`

Lista usuários paginados.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

**Query params:**
- `role` (opcional) — filtrar por role
- `ativo` (opcional) — `true`/`false`
- `page`, `size`, `sort` — paginação (default: `sort=nome`)

**Resposta 200:**
```json
{
  "content": [
    {
      "id": 1,
      "nome": "Administrador do Sistema",
      "email": "admin@condominio.local",
      "cpf": null,
      "telefone": null,
      "role": "ADMIN_SISTEMA",
      "ativo": true,
      "ultimoLogin": "2026-11-05T21:00:00Z",
      "criadoEm": "2026-10-08T17:50:34Z",
      "atualizadoEm": "2026-11-05T21:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 5,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

**Exemplo:**
```bash
curl "http://localhost:8080/api/v1/usuarios?page=0&size=10&role=MORADOR" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### `GET /usuarios/{id}`

Busca usuário por ID.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

**Erros:** `404` — não encontrado

---

### `POST /usuarios`

Cria usuário (sem retornar token).

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

**Request:**
```json
{
  "nome": "Maria Souza",
  "email": "maria@exemplo.com",
  "senha": "senhaForte123",
  "cpf": "123.456.789-00",
  "telefone": "11999999999",
  "role": "MORADOR"
}
```

**Resposta 201:** dados do usuário criado (sem senha).

**Erros:**
- `400` — validação
- `409` — e-mail ou CPF duplicado

---

### `PUT /usuarios/{id}`

Atualiza usuário (não altera senha).

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

**Request:**
```json
{
  "nome": "Maria Souza",
  "email": "maria@exemplo.com",
  "cpf": "123.456.789-00",
  "telefone": "11999999999",
  "role": "MORADOR"
}
```

**Erros:** `404`, `409` (e-mail em uso)

---

### `PATCH /usuarios/{id}/status?ativo={true|false}`

Ativa ou desativa usuário (soft delete).

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

**Exemplo:**
```bash
curl -X PATCH "http://localhost:8080/api/v1/usuarios/3/status?ativo=false" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### `DELETE /usuarios/{id}`

Soft delete (equivalente a `PATCH /status?ativo=false`).

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

**Resposta:** `204 No Content`

---

### `PUT /usuarios/me/senha`

Altera a própria senha.

**Autenticação:** Bearer (qualquer role)

**Request:**
```json
{
  "senhaAtual": "admin123",
  "novaSenha": "novaSenhaForte456"
}
```

**Erros:**
- `400` — senha atual incorreta
- `400` — nova senha inválida (< 6 chars)

---

## Blocos

### `GET /blocos`

Lista todos os blocos do condomínio (não paginado).

**Autenticação:** Bearer (qualquer role)

**Resposta 200:**
```json
[
  {
    "id": 1,
    "nome": "Bloco A",
    "condominioId": 1,
    "condominioNome": "Condomínio Residencial SindiPro",
    "criadoEm": "2026-10-08T18:00:00Z"
  }
]
```

---

### `POST /blocos`

Cria bloco.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{ "nome": "Bloco B" }
```

**Erros:** `400` — nome duplicado

---

### `PUT /blocos/{id}`

Atualiza nome do bloco.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

---

### `DELETE /blocos/{id}`

Remove bloco (hard delete). Bloqueia se houver unidades vinculadas.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Erros:** `400` — bloco com unidades

---

## Unidades

### `GET /unidades`

Lista unidades.

**Autenticação:** Bearer (qualquer role)

**Query params:**
- `blocoId` (opcional) — filtrar por bloco
- `ativo` (opcional) — `true`/`false`
- `minhas` (opcional) — se `true` e usuário for MORADOR, retorna apenas as unidades vinculadas a ele

**Exemplo (morador vendo só as suas):**
```bash
curl "http://localhost:8080/api/v1/unidades?minhas=true" \
  -H "Authorization: Bearer $TOKEN_MORADOR"
```

---

### `POST /unidades`

Cria unidade.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{
  "blocoId": 1,
  "numero": "101",
  "andar": 1
}
```

**Erros:** `400` — número duplicado no bloco

---

### `PUT /unidades/{id}`

Atualiza unidade.

---

### `PATCH /unidades/{id}/status?ativo={true|false}`

Ativa/desativa unidade.

---

### `DELETE /unidades/{id}`

Soft delete.

---

## Áreas Comuns

### `GET /areas-comuns`

Lista áreas comuns.

**Autenticação:** Bearer (qualquer role)

**Query params:**
- `ativo` (opcional) — `true` (default), `false`

**Resposta 200:**
```json
[
  {
    "id": 1,
    "nome": "Churrasqueira",
    "descricao": "Área com churrasqueira e mesas",
    "capacidade": 20,
    "horarioIni": "10:00:00",
    "horarioFim": "22:00:00",
    "taxa": 50.00,
    "ativo": true
  }
]
```

---

### `POST /areas-comuns`

Cria área comum.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{
  "nome": "Salão de Festas",
  "descricao": "Salão amplo com cozinha equipada",
  "capacidade": 80,
  "horarioIni": "08:00:00",
  "horarioFim": "23:00:00",
  "taxa": 150.00
}
```

**Erros:**
- `400` — horário inválido (fim antes de início)
- `409` — nome duplicado entre áreas ativas

---

### `PUT /areas-comuns/{id}`

Atualiza área.

---

### `PATCH /areas-comuns/{id}/status?ativo={true|false}`

Ativa/desativa área.

---

### `DELETE /areas-comuns/{id}`

Soft delete. Bloqueia se houver reservas **PENDENTE** ou **APROVADA**.

**Erros:** `400` — área com reservas ativas

---

## Comunicados

### `GET /comunicados`

Lista comunicados paginados (ordenados por `fixado DESC, publicadoEm DESC`).

**Autenticação:** Bearer (qualquer role)

**Query params:**
- `categoria` (opcional) — `GERAL`, `MANUTENCAO`, `SEGURANCA`, `EVENTO`, `FINANCEIRO`, `URGENTE`
- `page`, `size` — paginação

**Resposta 200:**
```json
{
  "content": [
    {
      "id": 1,
      "titulo": "Manutenção do elevador",
      "conteudo": "O elevador estará em manutenção...",
      "categoria": "MANUTENCAO",
      "fixado": true,
      "autorId": 2,
      "autorNome": "Carlos Síndico",
      "publicadoEm": "2026-10-20T02:23:08Z",
      "atualizadoEm": "2026-10-20T02:23:08Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

---

### `GET /comunicados/{id}`

Busca comunicado.

---

### `POST /comunicados`

Cria comunicado.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{
  "titulo": "Assembleia geral",
  "conteudo": "Convocação para assembleia no dia 15/12 às 19h.",
  "categoria": "EVENTO",
  "fixado": true
}
```

---

### `PUT /comunicados/{id}`

Atualiza comunicado.

---

### `DELETE /comunicados/{id}`

Hard delete.

---

## Ocorrências

### `GET /ocorrencias`

Lista ocorrências paginadas.

**Comportamento por role:**
- **Morador** vê apenas as suas
- **Admin/Síndico/Zelador/Porteiro** veem todas

**Query params:**
- `status` — `ABERTA`, `EM_ANDAMENTO`, `RESOLVIDA`, `CANCELADA`
- `prioridade` — `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`
- `responsavelId` — filtrar por responsável
- `page`, `size`

---

### `POST /ocorrencias`

Cria ocorrência.

**Autenticação:** Bearer (qualquer role)

**Request:**
```json
{
  "titulo": "Vazamento no banheiro",
  "descricao": "Há um vazamento constante na pia do banheiro social.",
  "prioridade": "ALTA",
  "unidadeId": null
}
```

- `unidadeId` é opcional. Morador sem informar usa a unidade principal.
- Morador só pode informar unidades vinculadas a ele.

**Erros:**
- `400` — morador sem vínculo com a unidade informada

---

### `PATCH /ocorrencias/{id}/status`

Move ocorrência entre estados.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`, `SINDICO`, `ZELADOR` ou `MORADOR` (este último só cancela as suas)

**Request:**
```json
{ "status": "EM_ANDAMENTO" }
```

**Transições válidas:**

```
ABERTA       → EM_ANDAMENTO | CANCELADA
EM_ANDAMENTO → RESOLVIDA    | CANCELADA
RESOLVIDA    → (final)
CANCELADA    → (final)
```

**Efeito:** ao transitar para `RESOLVIDA`, `resolvidoEm` é preenchido automaticamente.

**Erros:**
- `400` — transição inválida
- `400` — morador tentando cancelar ocorrência de outro autor

---

### `PATCH /ocorrencias/{id}/responsavel`

Atribui responsável à ocorrência.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{ "responsavelId": 5 }
```

Responsável deve ser `ZELADOR`, `SINDICO` ou `ADMIN_SISTEMA`.

**Erros:**
- `400` — ocorrência já resolvida/cancelada
- `400` — usuário não elegível como responsável
- `404` — usuário não encontrado

---

### `GET /ocorrencias/responsaveis-elegiveis`

Lista usuários que podem ser atribuídos como responsáveis.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Resposta 200:**
```json
[
  { "id": 2, "nome": "Carlos Síndico", "role": "SINDICO" },
  { "id": 5, "nome": "Pedro Zelador", "role": "ZELADOR" }
]
```

---

### `DELETE /ocorrencias/{id}`

Remove ocorrência.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

Bloqueia se `EM_ANDAMENTO` ou `RESOLVIDA` (histórico).

---

## Reservas

### `GET /reservas`

Lista reservas paginadas.

**Comportamento por role:**
- **Morador** vê apenas as suas
- **Admin/Síndico** veem todas

**Query params:**
- `status` — `PENDENTE`, `APROVADA`, `RECUSADA`, `CANCELADA`, `CONCLUIDA`
- `areaComumId` — filtrar por área
- `unidadeId` — filtrar por unidade
- `page`, `size`

---

### `POST /reservas`

Cria reserva.

**Autenticação:** Bearer (qualquer role com unidade vinculada)

**Request:**
```json
{
  "areaComumId": 1,
  "unidadeId": 1,
  "inicio": "2026-12-25T18:00:00-03:00",
  "fim": "2026-12-25T21:00:00-03:00",
  "observacao": "Confraternização de fim de ano"
}
```

> ⚠️ **Formato da data:** envie ISO com offset `-03:00` (horário de Brasília). O back-end interpreta no fuso `America/Sao_Paulo`.

**Regras validadas:**
1. Área deve existir e estar ativa
2. Unidade deve existir e estar ativa
3. Morador deve ter vínculo com a unidade
4. `fim > inicio`
5. Reserva no mesmo dia
6. Início/fim dentro do horário da área
7. **Sem sobreposição** com outra reserva `PENDENTE` ou `APROVADA`

**Resposta 201:**
```json
{
  "id": 15,
  "areaComumId": 1,
  "areaComumNome": "Churrasqueira",
  "unidadeId": 1,
  "unidadeNumero": "101",
  "blocoNome": "Bloco A",
  "solicitanteId": 3,
  "solicitanteNome": "Maria Moradora",
  "inicio": "2026-12-25T21:00:00Z",
  "fim": "2026-12-26T00:00:00Z",
  "status": "PENDENTE",
  "observacao": "Confraternização de fim de ano",
  "criadoEm": "...",
  "atualizadoEm": "..."
}
```

**Erros:**
- `400` — horário fora da área
- `400` — sobreposição com outra reserva
- `400` — período inválido
- `400` — sem vínculo com unidade
- `404` — área ou unidade não encontrada

---

### `PATCH /reservas/{id}/status`

Move reserva entre estados.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`, `SINDICO` ou `MORADOR` (este último só cancela as suas)

**Request:**
```json
{ "status": "APROVADA" }
```

**Transições válidas:**

```
PENDENTE  → APROVADA | RECUSADA | CANCELADA
APROVADA  → CONCLUIDA | CANCELADA
RECUSADA  → (final)
CANCELADA → (final)
CONCLUIDA → (final)
```

**Efeito especial:** ao aprovar (`APROVADA`), a sobreposição é **revalidada** (proteção contra condição de corrida).

**Erros:**
- `400` — transição inválida
- `400` — morador tentando aprovar/recusar (só pode cancelar)
- `400` — sobreposição detectada na aprovação

---

### `DELETE /reservas/{id}`

Remove reserva.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

Bloqueia se `APROVADA` ou `CONCLUIDA` (histórico).

---

## Financeiro

### `GET /lancamentos`

Lista lançamentos paginados (ordenados por `dataVencimento`).

**Comportamento por role:**
- **Morador** vê apenas lançamentos das suas unidades
- **Admin/Síndico** veem todos

**Query params:**
- `tipo` — `RECEITA`, `DESPESA`
- `status` — `PENDENTE`, `PAGO`, `ATRASADO`, `CANCELADO`
- `unidadeId` — filtrar por unidade
- `page`, `size`, `sort`

**Resposta 200:**
```json
{
  "content": [
    {
      "id": 1,
      "tipo": "RECEITA",
      "categoria": "TAXA_CONDOMINIO",
      "descricao": "Taxa condominial dez/2026 - Apto 101",
      "valor": 450.00,
      "dataVencimento": "2026-12-10",
      "dataPagamento": null,
      "status": "PENDENTE",
      "unidadeId": 1,
      "unidadeNumero": "101",
      "blocoNome": "Bloco A",
      "criadoPorId": 2,
      "criadoPorNome": "Carlos Síndico",
      "criadoEm": "...",
      "atualizadoEm": "..."
    }
  ],
  ...
}
```

---

### `POST /lancamentos`

Cria lançamento.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{
  "tipo": "DESPESA",
  "categoria": "MANUTENCAO",
  "descricao": "Manutenção do elevador - Contrato mensal",
  "valor": 1200.00,
  "dataVencimento": "2026-12-05",
  "unidadeId": null
}
```

- `unidadeId` é opcional. `null` = despesa geral do condomínio.

**Erros:**
- `400` — valor ≤ 0
- `404` — unidade não encontrada

---

### `PUT /lancamentos/{id}`

Atualiza lançamento. **Bloqueado** se status for `PAGO` ou `CANCELADO`.

**Erros:** `400` — lançamento pago/cancelado

---

### `PATCH /lancamentos/{id}/pagamento`

Registra pagamento.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Request:**
```json
{ "dataPagamento": "2026-11-15" }
```

- `dataPagamento` deve ser **passada ou presente** (`@PastOrPresent`)

**Efeito:** status passa para `PAGO`.

**Erros:**
- `400` — lançamento já pago/cancelado
- `400` — data futura

---

### `PATCH /lancamentos/{id}/cancelar`

Cancela lançamento.

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA` ou `SINDICO`

**Efeito:** status passa para `CANCELADO`. Só funciona em `PENDENTE` ou `ATRASADO`.

---

### `DELETE /lancamentos/{id}`

Remove lançamento (hard delete).

**Autenticação:** Bearer · **Role:** `ADMIN_SISTEMA`

Bloqueia se status != `PENDENTE`.

---

## Dashboard

### `GET /dashboard/resumo`

Retorna resumo polimórfico por perfil.

**Autenticação:** Bearer (qualquer role)

**Resposta para ADMIN/SÍNDICO:**
```json
{
  "comunicados": { "total": 12 },
  "ocorrencias": {
    "abertas": 3,
    "emAndamento": 2,
    "resolvidas": 15,
    "canceladas": 1,
    "total": 21
  },
  "reservas": {
    "pendentes": 2,
    "aprovadas": 5,
    "proximas": [
      {
        "id": 15,
        "areaComumNome": "Churrasqueira",
        "inicio": "2026-12-25T21:00:00Z",
        "fim": "2026-12-26T00:00:00Z",
        "status": "APROVADA"
      }
    ]
  },
  "financeiro": {
    "mesAtual": {
      "receitasPagas": 5000.00,
      "despesasPagas": 3200.00,
      "saldo": 1800.00
    },
    "emAberto": {
      "quantidade": 3,
      "valor": 2100.00
    }
  }
}
```

**Resposta para MORADOR:** mesmos campos, mas números **restritos ao próprio usuário**.

**Resposta para PORTEIRO/ZELADOR:** **sem o campo `financeiro`** (omitido, não `null`).

---

## Códigos de erro — exemplos

### 400 — Validação de bean

```json
{
  "timestamp": "2026-11-05T21:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validação",
  "path": "/api/v1/reservas",
  "details": [
    "areaComumId: must not be null",
    "inicio: must not be null"
  ]
}
```

### 400 — Regra de negócio

```json
{
  "timestamp": "2026-11-05T21:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Já existe reserva no período informado para essa área",
  "path": "/api/v1/reservas",
  "details": null
}
```

### 403 — Acesso negado

```json
{
  "timestamp": "2026-11-05T21:30:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Acesso negado: você não tem permissão para acessar este recurso",
  "path": "/api/v1/usuarios",
  "details": null
}
```

### 409 — Conflito

```json
{
  "timestamp": "2026-11-05T21:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "E-mail já cadastrado",
  "path": "/api/v1/usuarios",
  "details": null
}
```

---

## Script rápido — testar todos os endpoints

```bash
#!/bin/bash
# test-api.sh — obtém tokens e roda uma sequência de testes

BASE=http://localhost:8080/api/v1

# Login
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@condominio.local","senha":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:30}..."

# Me
echo -e "\n--- /me ---"
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN"

# Usuários
echo -e "\n--- /usuarios ---"
curl -s "$BASE/usuarios?size=3" -H "Authorization: Bearer $TOKEN"

# Comunicados
echo -e "\n--- /comunicados ---"
curl -s "$BASE/comunicados?size=2" -H "Authorization: Bearer $TOKEN"

# Dashboard
echo -e "\n--- /dashboard/resumo ---"
curl -s $BASE/dashboard/resumo -H "Authorization: Bearer $TOKEN"
```

---

## Recursos adicionais

- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`
- **Arquitetura:** [`arquitetura.md`](arquitetura.md)
- **Decisões:** [`decisoes.md`](decisoes.md)

---

**Última atualização:** Novembro/2026
```