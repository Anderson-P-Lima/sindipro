# 🏗 Arquitetura do SindiPro

Documento técnico descrevendo a arquitetura, os fluxos de dados e as decisões estruturais do sistema. Para decisões pontuais, consulte [`decisoes.md`](decisoes.md). Para referência de endpoints, consulte [`api.md`](api.md).

---

## 1. Visão geral

O SindiPro é uma aplicação **full-stack desacoplada** (SPA + API REST) que segue o padrão cliente-servidor com comunicação via JSON sobre HTTPS.

┌─────────────────────────────────────────────────────────────────────┐
│                       NAVEGADOR (Cliente)                           │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ React SPA (Vite)                                                │ │
│ │ ─────────────────────────────────────────────────────────────── │ │
│ │ • Context API (autenticação)                                    │ │
│ │ • Hooks de dados (useComunicados, useReservas, etc.)            │ │
│ │ • Axios com interceptor JWT                                     │ │
│ │ • React Router (rotas protegidas por perfil)                    │ │
│ │ • Bootstrap 5 (UI responsiva e acessível)                       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                   │ │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS + JSON
                               │ Authorization: Bearer <JWT>
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVIDOR (Back-end)                           │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Spring Boot API                                                 │ │
│ │ ─────────────────────────────────────────────────────────────── │ │
│ │ • Spring Security + JWT (stateless)                             │ │
│ │ • Controllers (REST)                                            │ │
│ │ • Services (regras de negócio)                                  │ │
│ │ • Repositories (Spring Data JPA)                                │ │
│ │ • Flyway (migrations)                                           │ │
│ │ • Springdoc OpenAPI (Swagger)                                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ JDBC
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BANCO DE DADOS (PostgreSQL 16)                                      │
│                                                                     │
│ • 11 tabelas                                                        │
│ • 5 triggers (auditoria)                                            │
│ • Índices únicos parciais (soft delete)                             │
│ • Migrations versionadas (V1, V2)                                   │
└─────────────────────────────────────────────────────────────────────┘


**Princípios aplicados:**

| Princípio                                         | Como foi implementado                                                                  |
|---------------------------------------------------|----------------------------------------------------------------------------------------|
| **Separação de responsabilidades**                | Front e back independentes; comunicação apenas via contrato JSON                       |
| **Stateless**                                     | JWT elimina estado no servidor; escala horizontal trivial                              |
| **Autorização em camadas**                        | `@PreAuthorize` (controller) + validação de domínio (service) + UI condicional (front) |
| **Contrato explícito**                            | DTOs de entrada/saída; entidades JPA nunca expostas diretamente                        |
| **Migrações versionadas**                         | Flyway garante schema reproduzível entre ambientes                                     |

---

## 2. Back-end — arquitetura em camadas

O back-end segue o padrão **Controller → Service → Repository**, com DTOs como contrato e configurações transversais isoladas.

```
┌──────────────────────────────────────────────────────────────────┐
│                       CAMADA DE APRESENTAÇÃO                     │
│                                                                  │
│ Controllers (@RestController)                                    │
│ ──────────────────────────────────────────────────────────────── │
│ • Recebem HTTP request                                           │
│ • Validam payload com @Valid                                     │
│ • Aplicam @PreAuthorize (autorização)                            │
│ • Convertem entrada → DTO                                        │
│ • Chamam Service                                                 │
│ • Retornam ResponseEntity<DTO>                                   │
│                                                                  │
│ Exception Handler (@RestControllerAdvice)                        │
│ ──────────────────────────────────────────────────────────────── │
│ • Captura exceções de domínio                                    │
│ • Mapeia para status HTTP (400, 403, 404, 409, 500)              │
│ • Formato padronizado (ErrorResponse)                            │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       CAMADA DE NEGÓCIO                          │
│                                                                  │
│ Services (@Service)                                              │
│ ──────────────────────────────────────────────────────────────── │
│ • Regras de negócio (validações, transições)                     │
│ • Orquestração de repositories                                   │
│ • Transações (@Transactional)                                    │
│ • Lançamento de exceções de domínio                              │
│ • Conversão Entidade → DTO                                       │
│                                                                  │
│ Principais services:                                             │
│ • AuthService → login, registro                                  │
│ • UsuarioService → CRUD de usuários                              │
│ • OcorrenciaService → máquina de estados                         │
│ • ReservaService → validação de sobreposição                     │
│ • LancamentoFinanceiroService → transições de status             │
│ • DashboardService → agregações por perfil                       │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       CAMADA DE PERSISTÊNCIA                     │
│                                                                  │
│ Repositories (Spring Data JPA)                                   │
│ ──────────────────────────────────────────────────────────────── │
│ • JpaRepository<Entidade, Long>                                  │
│ • JpaSpecificationExecutor (filtros dinâmicos)                   │
│ • @Query para queries customizadas                               │
│ • Paginação e ordenação nativas                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                           BANCO                                  │
│                       PostgreSQL 16                              │
│ • Schema gerenciado por Flyway                                   │
│ • 11 tabelas + 5 triggers + índices                              │
│ • Auditoria automática (created_em, atualizado_em)               │
└──────────────────────────────────────────────────────────────────┘
```

### Estrutura de pacotes (back-end)

```
com.sindipro.api
│
├── ApiApplication.java ← Entry point
│
├── config/ ← Configurações globais
│ ├── SecurityConfig.java ← Spring Security + JWT + CORS
│ ├── OpenApiConfig.java ← Swagger UI
│ └── DataSeeder.java ← Seed de dev (perfil !prod)
│
├── security/ ← Autenticação
│ ├── JwtService.java ← Geração e validação de tokens
│ ├── JwtAuthenticationFilter.java ← Intercepta requests, valida JWT
│ ├── CustomUserDetailsService.java← Carrega usuário por email
│ └── SecurityUser.java ← Adapter Usuario → UserDetails
│
├── auth/ ← Endpoints de autenticação
│ ├── AuthController.java ← /login, /register, /me
│ ├── AuthService.java ← Regras de autenticação
│ └── dto/
│ ├── LoginRequest.java
│ ├── RegisterRequest.java
│ └── AuthResponse.java
│
├── usuario/ ← Domínio: Usuário
├── condominio/ ← Domínio: Condomínio
├── bloco/ ← Domínio: Bloco
├── unidade/ ← Domínio: Unidade
├── area/ ← Domínio: Área Comum
├── comunicado/ ← Domínio: Comunicado
├── ocorrencia/ ← Domínio: Ocorrência
├── reserva/ ← Domínio: Reserva
├── financeiro/ ← Domínio: Lançamento Financeiro
│
├── dashboard/ ← Agregações por perfil
│ ├── DashboardController.java
│ ├── DashboardService.java
│ └── dto/DashboardResponse.java
│
└── shared/ ← Transversal
├── dto/PageResponse.java ← Wrapper de paginação
└── exception/
├── BusinessException.java → 400
├── ResourceNotFoundException.java → 404
├── ResourceConflictException.java → 409
├── ErrorResponse.java ← Formato padronizado
└── GlobalExceptionHandler.java ← @RestControllerAdvice
```

> **Padrão por feature:** cada domínio (ex.: `reserva/`) contém `Controller`, `Service`, `Repository`, `Entidade` e `dto/`. Isso **reduz acoplamento** entre domínios e facilita localização de código.

---

## 3. Fluxo de autenticação JWT

O SindiPro usa autenticação **stateless** via JWT. O token é emitido no login e enviado pelo front em todas as requisições subsequentes.

### Diagrama de sequência — Login

```
┌─────────┐         ┌───────────────┐    ┌──────────────┐         ┌────────────┐
│ Cliente │         │ AuthController│    │ AuthService  │         │ Repositório│
│ (React) │         │               │    │              │         │ (JPA)      │
└────┬────┘         └──────┬────────┘    └──────┬───────┘         └─────┬──────┘
     │                     │                    │                       │
     │ POST /auth/login    │                    │                       │
     │ {email, senha}      │                    │                       │
     ├────────────────────►│                    │                       │
     │                     │                    │                       │
     │                     │ @Valid valida DTO  │                       │
     │                     ├───────────────────►│                       │
     │                     │                    │                       │
     │                     │                    │ AuthenticationManager │
     │                     │                    │ .authenticate()       │
     │                     │                    ├──────────────────────►│
     │                     │                    │                       │
     │                     │                    │ findByEmail(email)    │
     │                     │                    │◄──────────────────────┤
     │                     │                    │                       │
     │                     │                    │ BCrypt.matches()      │
     │                     │                    │ (valida senha)        │
     │                     │                    │                       │
     │                     │                    │ JwtService            │
     │                     │                    │ .gerarToken(user)     │
     │                     │                    │                       │
     │                     │                    │ UPDATE ultimo_login   │
     │                     │                    ├──────────────────────►│
     │                     │                    │                       │
     │                     │◄───────────────────┤                       │
     │◄────────────────────┤ {token, user}      │                       │
     │ 200 OK              │                    │                       │
     │                     │                    │                       │
```

### Diagrama de sequência — Requisição autenticada

```
┌─────────┐     ┌────────────────────┐              ┌──────────┐   ┌─────────┐
│ Cliente │     │JwtAuthentication   │              │Controller│   │ Service │
│ (React) │     │Filter              │              │          │   │         │
└────┬────┘     └─────────┬──────────┘              └────┬─────┘   └────┬────┘
     │                    │                              │              │
     │ GET /comunicados   │                              │              │
     │ Authorization:     │                              │              │
     │ Bearer <token>     │                              │              │
     ├───────────────────►│                              │              │
     │                    │                              │              │
     │                    │ 1. Extrai token              │              │
     │                    │ 2. Valida assinatura         │              │
     │                    │ 3. Verifica expiração        │              │
     │                    │ 4. Carrega SecurityUser      │              │
     │                    │ 5. Popula SecurityContext    │              │
     │                    │                              │              │
     │                    ├─────────────────────────────►│              │
     │                    │                              │              │
     │                    │                              │ @PreAuthorize│
     │                    │                              │ valida role  │
     │                    │                              │              │
     │                    │                              ├─────────────►│
     │                    │                              │              │
     │                    │                              │◄─────────────┤
     │                    │                              │              │
     │◄───────────────────┴──────────────────────────────┤ DTO          │
     │ 200 OK { content: [...] }                         │              │
     │                                                   │              │
```

### Onde o token é armazenado

| Local                     | Armazena   | Expõe a XSS | Expõe a CSRF                 |
|---------------------------|------------|-------------|------------------------------|
| **localStorage** (atual)  | JWT de 24h | Sim         | Não (sem cookie)             |
| sessionStorage            | JWT de 24h | Sim         | Não                          |
| Cookie `HttpOnly`         | JWT de 24h | Não         | Sim (mitigável com SameSite) |

**Decisão:** `localStorage` pela simplicidade no MVP. O trade-off (vulnerabilidade a XSS) é mitigado por:
- Sanitização de conteúdo (Bootstrap escapa por padrão)
- Nenhuma injeção de HTML dinâmico (`dangerouslySetInnerHTML` não é usado)
- Política CSP pode ser adicionada em produção (roadmap)

> 📘 Detalhes completos em [ADR-003 — JWT stateless](decisoes.md#adr-003).

---

## 4. Ciclo de vida de uma requisição (reserva com sobreposição)

Exemplo real: **morador solicita reserva de churrasqueira**.

1. FRONT-END (React)
└── Morador preenche formulário
└── ReservaFormModal valida client-side
├── horário coerente (fim > início)
├── dentro do horário da área (10:00 – 22:00)
└── campos obrigatórios
└── ReservaService (front) → Axios POST /reservas

2. INTERCEPTOR AXIOS
└── Adiciona header Authorization: Bearer <JWT>

3. BACK-END — FILTRO JWT
└── JwtAuthenticationFilter
├── Valida assinatura do token
├── Verifica expiração
├── Carrega SecurityUser do banco
└── Popula SecurityContext

4. BACK-END — CONTROLLER
└── ReservaController.criar(@Valid ReservaRequest, @AuthenticationPrincipal)
└── @Valid valida campos do DTO

5. BACK-END — SERVICE
└── ReservaService.criar(req, solicitante)
├── 1. Valida se a área existe e está ativa
├── 2. Valida se a unidade existe e está ativa
├── 3. Se morador: valida vínculo (morador_unidade)
├── 4. Valida período (fim > início, mesmo dia, dentro do horário)
├── 5. Consulta sobreposição:
│ SELECT * FROM reserva
│ WHERE area_comum_id = :areaId
│ AND status IN ('PENDENTE','APROVADA')
│ AND inicio < :fim
│ AND fim > :inicio
├── 6. Se conflito → throw BusinessException (400)
└── 7. Persiste (status = PENDENTE)

6. BANCO DE DADOS
└── INSERT INTO reserva (area_comum_id, unidade_id, solicitante_id,
inicio, fim, status, observacao, criado_em)
└── Trigger atualiza automaticamente criado_em / atualizado_em

7. BACK-END — RESPOSTA
└── ReservaResponse.from(entidade)
└── ResponseEntity.status(201).body(dto)

8. FRONT-END
└── Modal fecha, lista recarrega, toast de sucesso


### Tratamento de erros no fluxo

| Cenário                 | Exception lançada           | Status HTTP | Resposta                                        |
|-------------------------|-----------------------------|-------------|-------------------------------------------------|
| Token expirado          | `JwtException` (filtro)     | 401         | `{ "message": "Não autenticado" }`              |
| Role insuficiente       | `AccessDeniedException`     | 403         | `{ "message": "Acesso negado..." }`             |
| Área não encontrada     | `ResourceNotFoundException` | 404         | `{ "message": "Área comum não encontrada" }`    |
| Sobreposição de horário | `BusinessException`         | 400         | `{ "message": "Já existe reserva no período" }` |
| E-mail duplicado        | `ResourceConflictException` | 409         | `{ "message": "E-mail já cadastrado" }`         |
| Erro inesperado         | `Exception`                 | 500         | `{ "message": "Erro interno" }`                 |

---

## 5. Modelo de dados (ERD simplificado)

```
┌──────────────┐        ┌──────────────┐       ┌──────────────┐
│ Condominio   │───┬───►│ Bloco        │───┬──►│ Unidade      │
│──────────────│   │    │──────────────│   │   │──────────────│
│ id           │   │    │ id           │   │   │ id           │
│ nome         │   │    │ condominio_id│   │   │ bloco_id     │
│ cnpj         │   │    │ nome         │   │   │ numero       │
│ endereco     │   │    └──────────────┘   │   │ andar        │
│ cidade, uf   │   │                       │   │ ativo        │
└──────────────┘   │                       │   └──────────────┘
│                  │                       │          │
│                  │  ┌──────────────┐     │          │
│                  │  │ AreaComum    │     │          │
│                  └─►│──────────────│     │          │
│                     │ id           │     │          │
│                     │ condominio_id│     │          │
│                     │ nome         │     │          │
│                     │ horario_ini  │     │          │
│                     │ horario_fim  │     │          │
│                     │ taxa         │     │          │
│                     │ ativo        │     │          │
│                     └──────────────┘     │          │
│                            │             │          │
│                            │             │          │
│                            ▼             │          ▼
│                     ┌───────────────┐    │    ┌──────────────┐
│                     │ Reserva       │    │    │MoradorUnidade│
│                     │───────────────│    │    │──────────────│
│                     │ id            │    │    │ id           │
│                     │ area_comum_id │    │    │ usuario_id   │
│                     │ unidade_id    │◄───┼────│ unidade_id   │
│                     │ solicitante_id│    │    │ tipo         │
│                     │ inicio        │    │    │ responsavel  │
│                     │ fim           │    │    │ data_inicio  │
│                     │ status        │    │    └──────────────┘
│                     │ observacao    │    │          │
│                     └───────────────┘    │          │
│                                          │          ▼
│                                          │    ┌──────────────┐
│                                          │    │ Usuario      │
│                                          │    │──────────────│
│                                          │    │ id           │
│                                          │    │ nome, email  │
│                                          │    │ senha_hash   │
│                                          │    │ cpf, telefone│
│                                          │    │ role         │
│                                          │    │ ativo        │
│                                          │    └──────────────┘
│                                          │            │
│   ┌──────────────┐                       │            │
└──►│ Comunicado   │                       │            │
    │──────────────│                       │            │
    │ id           │                       │            │
    │ condominio_id│                       │            │
    │ autor_id     │◄──────────────────────┼────────────┘
    │ titulo       │                       │
    │ conteudo     │                       │
    │ categoria    │                       │
    │ fixado       │                       │
    └──────────────┘                       │
                                           │
    ┌────────────────┐                     │
    │ Ocorrencia     │                     │
    │────────────────│                     │
    │ id             │                     │
    │ unidade_id     │                     │
    │ autor_id       │◄────────────────────┤
    │ responsavel_id │◄────────────────────┤
    │ titulo         │                     │
    │ prioridade     │                     │
    │ status         │                     │
    │ resolvido_em   │                     │
    └────────────────┘                     │
                                           │
    ┌───────────────────────┐              │
    │LancamentoFinanceiro   │              │
    │───────────────────────│              │
    │ id                    │              │
    │ condominio_id         │              │
    │ unidade_id (nullable) │              │
    │ criado_por            │◄─────────────┘
    │ tipo, categoria       │
    │ valor                 │
    │ data_vencimento       │
    │ data_pagamento        │
    │ status                │
    └───────────────────────┘

┌───────────────┐
│LogAuditoria   │
│───────────────│
│ id            │
│ usuario_id    │
│ acao          │
│ entidade      │
│ entidade_id   │
│ timestamp     │
└───────────────┘
```

### Detalhes de modelagem

| Tabela                                | Cardinalidade             | Observações                                           |
|---------------------------------------|---------------------------|-------------------------------------------------------|
| `condominio` → `bloco`                | 1:N                       | Um condomínio tem muitos blocos                       |
| `bloco` → `unidade`                   | 1:N                       | Unicidade `(bloco_id, numero)` parcial (ativo)        |
| `usuario` ↔ `unidade`                 | N:N via `morador_unidade` | Um morador pode ter várias unidades                   |
| `area_comum` → `reserva`              | 1:N                       | Índice em `(area_comum_id, inicio, fim)` para overlap |
| `unidade` → `lancamento_financeiro`   | 1:N opcional              | Lançamento sem unidade = despesa geral do condomínio  |

**Regras transversais:**

- **Soft delete** em `usuario`, `unidade`, `area_comum` — coluna `ativo`
- **Índices únicos parciais** (`WHERE ativo = true`) — permite reciclar nomes/e-mails
- **Auditoria automática** — `criado_em`/`atualizado_em` via triggers Postgres
- **Integridade referencial** — `ON DELETE RESTRICT` em tabelas históricas (`reserva`, `lancamento_financeiro`)

> 📘 Estrutura completa das tabelas em [`../backend/src/main/resources/db/migration/V1__init.sql`](../backend/src/main/resources/db/migration/V1__init.sql).

---

## 6. Front-end — arquitetura

O front-end segue o padrão **feature-based**, com separação clara entre apresentação, estado e comunicação.

```
src/
│
├── components/ ← Componentes reutilizáveis
│ ├── common/ ← Genéricos (EmptyState, Pagination, Loading, ConfirmDialog)
│ ├── layout/ ← Estrutura (Navbar, Sidebar, Layout)
│ ├── comunicados/ ← Específicos de comunicados (Card, FormModal)
│ ├── areas/ ← Específicos de áreas comuns
│ ├── ocorrencias/ ← Específicos de ocorrências
│ ├── reservas/ ← Específicos de reservas
│ └── dashboard/ ← Cards do dashboard
│
├── contexts/ ← Estado global
│ └── AuthContext.jsx ← Autenticação + persistência
│
├── hooks/ ← Hooks customizados
│ ├── useAuth.js ← Atalho para AuthContext
│ ├── usePageTitle.js ← SEO dinâmico
│ ├── useComunicados.js ← Dados + paginação + filtros
│ ├── useAreasComuns.js ← Idem
│ ├── useOcorrencias.js ← Idem
│ ├── useReservas.js ← Idem
│ └── useDashboard.js ← Idem
│
├── pages/ ← Telas (roteadas)
│ ├── Login.jsx
│ ├── Dashboard.jsx
│ ├── Comunicados.jsx
│ ├── AreasComuns.jsx
│ ├── Ocorrencias.jsx
│ ├── Reservas.jsx
│ ├── PoliticaPrivacidade.jsx
│ ├── TermosUso.jsx
│ └── NotFound.jsx
│
├── routes/ ← Configuração de rotas
│ ├── AppRoutes.jsx ← Todas as rotas
│ └── ProtectedRoute.jsx ← Guard por autenticação + role
│
├── services/ ← Comunicação com API
│ ├── api.js ← Axios + interceptors
│ ├── authService.js
│ ├── comunicadoService.js
│ ├── areaComumService.js
│ ├── ocorrenciaService.js
│ ├── reservaService.js
│ └── dashboardService.js
│
├── tests/ ← 29 testes Jest
├── App.jsx
├── main.jsx
└── index.css
```

### Fluxo de dados no front-end

```
┌────────────-──┐
│ Página        │ (ex.: Comunicados.jsx)
│               │
│ const {data,  │
│ loading}      │
│ = useXxx()    │
└──────┬─────-──┘
       │
       ▼
┌──────────────┐      ┌──────────────┐      ┌───────────────┐
│ Hook         │─────►│ Service      │─────►│ Axios         │
│              │      │              │      │               │
│ • useXxx     │      │• xxxService  │      │ • baseURL     │
│ • useState   │      │              │      │ • JWT header  │
│ • useEffect  │      │              │      │ • 401 redirect│
│ • carregar() │      │              │      │               │
└──────────────┘      └──────────────┘      └──────┬────────┘
                                                   │
                                                   │ HTTP
                                                   ▼
                                            ┌──────────────┐
                                            │ Spring Boot  │
                                            │ API          │
                                            └──────────────┘
```

### Estado global vs. local

| Tipo de estado           | Onde vive                | Exemplo                     |
|--------------------------|------------------------- |-----------------------------|
| **Autenticação**         | `AuthContext`            | usuário logado, token, role |
| **Dados de página**      | Hook local (`useXxx`)    | lista, paginação, filtros   |
| **Estado de formulário** | `useState` no componente | campos, erros, loading      |
| **Estado de UI efêmero** | `useState` no componente | modal aberto, dropdown      |

> **Regra:** só vai para `Context` o que é **compartilhado entre páginas**. Dados de listagem vivem em hooks locais — o que mantém os componentes isolados e testáveis.

### Roteamento e proteção

┌─────────────────────────────────┐
│ AppRoutes                       │
│                                 │
│ Rotas públicas:                 │
│ /login, /privacidade, /termos   │
│                                 │
│ Rotas protegidas:               │
│ └── <ProtectedRoute>            │
│ └── <Layout>                    │
│ ├── /dashboard                  │
│ ├── /comunicados                │
│ ├── /areas-comuns               │
│ ├── /ocorrencias                │
│ └── /reservas                   │
└─────────────────────────────────┘

ProtectedRoute:
├── loading → `<Loading />`
├── !authenticated → `<Navigate to="/login" />`
├── role não autorizado → `<Navigate to="/dashboard" />`
└── OK → `<Outlet />`

---

## 7. Segurança — defesa em profundidade

A segurança do SindiPro é implementada em **camadas independentes**. Um ataque bem-sucedido a uma camada não compromete as demais.

┌─────────────────────────────────────────────────────────┐
│ Camada 1 — Transporte                                   │
│ • HTTPS obrigatório em produção (Vercel + Render)       │
│ • TLS 1.2+                                              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│ Camada 2 — Autenticação                                 │
│ • JWT com assinatura HS256                              │
│ • Expiração 24h                                         │
│ • BCrypt custo 12                                       │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│ Camada 3 — Autorização                                  │
│ • @PreAuthorize por role no controller                  │
│ • Validação de vínculo (morador só vê suas unidades)    │
│ • Regras de domínio no service                          │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│ Camada 4 — Validação                                    │
│ • @Valid nos DTOs (Bean Validation)                     │
│ • Sanitização no front (Bootstrap escapa)               │
│ • Constraints no banco                                  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│ Camada 5 — Resposta                                     │
│ • Exception handler centralizado                        │
│ • Sem stack trace exposto ao cliente                    │
│ • Mensagens genéricas para 401/500                      │
└─────────────────────────────────────────────────────────┘


**Fluxo de autorização — exemplo: morador tenta listar usuários**

FRONT: morador não vê o item "Usuários" na sidebar
└── (UI condicional por role)

Se burlar via console e tentar acessar /usuarios:
└── <ProtectedRoute roles={['ADMIN_SISTEMA']}> bloqueia
└── <Navigate to="/dashboard" />

Se burlar e chamar a API direto:
└── GET /api/v1/usuarios com token de morador
└── @PreAuthorize("hasRole('ADMIN_SISTEMA')") → 403

Se a anotação fosse removida:
└── Service ainda valida via regras de domínio
└── 400/403


---

## 8. Decisões de arquitetura

As decisões-chave estão documentadas em formato ADR (Architecture Decision Record) em [`decisoes.md`](decisoes.md). Resumo:

| ADR                            | Decisão                                      | Impacto                                   |
|--------------------------------|----------------------------------------------|-------------------------------------------|
| [ADR-001](decisoes.md#adr-001) | `Instant` para todas as colunas temporais    | Compatibilidade com Spring Data Auditing  |
| [ADR-002](decisoes.md#adr-002) | Unique constraints parciais em soft delete   | Permite reciclar nomes/emails             |
| [ADR-003](decisoes.md#adr-003) | JWT stateless em vez de sessão               | Escala horizontal sem Redis               |
| [ADR-004](decisoes.md#adr-004) | Overlap de reserva no banco                  | Performance O(1) com índice               |
| [ADR-005](decisoes.md#adr-005) | Fuso fixo `America/Sao_Paulo`                | Brasil sem DST                            |
| [ADR-006](decisoes.md#adr-006) | DTOs em todas as respostas                   | Isolamento entidade↔API                   |
| [ADR-007](decisoes.md#adr-007) | Exception handler centralizado               | Formato padronizado                       |
| [ADR-008](decisoes.md#adr-008) | Dashboard polimórfico por role               | Segurança no service                      |

---

## 9. Trade-offs e limitações conhecidas

### Decisões que priorizam simplicidade

| Trade-off               | Alternativa mais robusta          | Motivo da escolha                                       |
|-------------------------|-----------------------------------|---------------------------------------------------------|
| `localStorage` para JWT | Cookie `HttpOnly` + CSRF token    | Simplicidade no MVP; XSS mitigado                       |
| `ddl-auto: validate`    | Migrations sempre, nunca DDL auto | Garante consistência; sem auto-modificação              |
| H2 nos testes           | Testcontainers + Postgres real    | Testes 10x mais rápidos; diferenças de dialeto tratadas |
| Sem refresh token       | Access token curto + refresh      | Escopo do MVP; usuário reloga a cada 24h                |
| Fuso fixo no backend    | Fuso dinâmico por request         | Brasil sem DST; simplicidade                            |

### Dívidas técnicas documentadas (roadmap)

- **Rate limiting** em `/auth/login` — proteção contra brute force
- **Testes E2E** com Playwright — fluxos completos ponta a ponta
- **CI/CD** com GitHub Actions — testes e deploy automáticos
- **Dependabot** — atualização contínua de dependências
- **Refresh token** — renovação sem relogin
- **CSP** (Content Security Policy) — mitigação extra de XSS

---

## 10. Referências

- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Security Architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router v7](https://reactrouter.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Flyway Documentation](https://documentation.red-gate.com/flyway)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [RFC 7807 — Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807)

---

**Última atualização:** {Novembro/2026}

