# 🏢 SindiPro — Sistema de Gestão de Condomínios

[![Back-end Tests](https://img.shields.io/badge/back--end%20tests-100%20passing-brightgreen)](#testes)
[![Back-end Coverage](https://img.shields.io/badge/back--end%20coverage-73%25-brightgreen)](#testes)
[![Front-end Tests](https://img.shields.io/badge/front--end%20tests-29%20passing-brightgreen)](#testes)
[![Front-end Coverage](https://img.shields.io/badge/front--end%20coverage-83%25-brightgreen)](#testes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Sistema web completo para gestão de condomínios residenciais, desenvolvido como projeto acadêmico do curso **Desenvolvimento Completo AI+** (Prati). Aplicação full-stack com autenticação JWT, controle de acesso por perfil, CRUDs completos, validações de regra de negócio e cobertura de testes acima de 70%.

---

## 📋 Sobre o projeto

O **SindiPro** centraliza comunicação, rotinas e serviços entre síndico, moradores, portaria e zeladoria. O sistema cobre o ciclo completo de gestão operacional de um condomínio:

- **Comunicação** — mural de avisos com fixação e categorização
- **Reservas** — solicitação, aprovação e controle de sobreposição de horários em áreas comuns
- **Ocorrências** — registro e acompanhamento com máquina de estados
- **Financeiro** — lançamentos de receitas/despesas, registro de pagamentos
- **Dashboard** — visão polimórfica por perfil (global, pessoal ou operacional)

---

## 🚀 Stack

|               Camada |                  Tecnologia                | Versão                              |
|----------------------|--------------------------------------------|-------------------------------------|
|        **Front-end** |          React + Vite + Bootstrap 5        | React 19 · Vite 8.3 · Bootstrap 5.3 |
|         **Back-end** |        Spring Boot + Spring Security       | Spring Boot 4.1.1 · Java 21         |
|   **Banco de dados** |             PostgreSQL + Flyway            | PostgreSQL 16                       |
|     **Autenticação** |             JWT (jjwt) + BCrypt            | jjwt 0.12.6                         |
|    **Testes (back)** |      JUnit 5 + Mockito + MockMvc + H2      |                   —                 |
|   **Testes (front)** |           Jest + Testing Library           | Jest 30                             |
| **Documentação API** |       Springdoc OpenAPI (Swagger UI)       | 3.0.0                               |
|            **Build** |            Maven Wrapper + npm             |                   —                 |
|           **Deploy** | Vercel (front) · Render (back) · Neon (db) |                   —                 |

---

## ✨ Funcionalidades

### Por perfil

|                        Perfil | Principais permissões                                                                           |
|-------------------------------|-------------------------------------------------------------------------------------------------|
|  **Administrador do Sistema** | Gerencia usuários, configurações globais e logs                                                 |
|                   **Síndico** | Publica comunicados, aprova reservas, gerencia ocorrências, financeiro, unidades e áreas comuns |
|                   **Morador** | Visualiza comunicados, solicita reservas, abre ocorrências, consulta lançamentos da sua unidade |
|                  **Porteiro** | Consulta unidades, registra ocorrências operacionais                                            |
|                   **Zelador** | Atualiza ocorrências atribuídas a ele                                                           |

### Módulos implementados

- **Autenticação** — login, registro, `/me`, JWT com refresh implícito (24h), BCrypt custo 12
- **Usuários** — CRUD completo, alteração de senha, soft delete
- **Blocos e Unidades** — CRUD com validação de unicidade parcial
- **Áreas Comuns** — CRUD com validação de horários e toggle ativo/inativo
- **Comunicados** — CRUD, fixação no topo, filtro por categoria, paginação
- **Ocorrências** — CRUD com máquina de estados (`ABERTA → EM_ANDAMENTO → RESOLVIDA`) e atribuição de responsável
- **Reservas** — CRUD com **detecção de sobreposição de horários** (algoritmo `a1 < b2 AND a2 > b1`), validação de fuso horário, máquina de estados
- **Financeiro** — CRUD de lançamentos com status (`PENDENTE → PAGO | CANCELADO`), agregações por período
- **Dashboard** — resumo polimórfico por perfil com dados globais, pessoais ou operacionais

---

## 🏗 Arquitetura (resumo)

┌───────────────────┐ HTTPS ┌────────────────────┐
│         React SPA │ ────► │ Spring Boot API    │
│          (Vercel) │       │ (Render)           │
│                   │       │                    │
│   Context + Hooks │       │ Controllers        │
│       Axios + JWT │       │ Services           │
│       Bootstrap 5 │       │ Security + JWT     │
└───────────────────┘       └─────────┬──────────┘
                                      │ JDBC
                                      ▼
                            ┌────────────────────┐
                            │ PostgreSQL (Neon)  │
                            │ Flyway migrations  │
                            └────────────────────┘

**Padrões aplicados:**
- **Back-end:** arquitetura em camadas (Controller → Service → Repository), DTOs para isolar a entidade, `@PreAuthorize` para autorização por método, `GlobalExceptionHandler` centralizado, paginação via `PageResponse<T>`.
- **Front-end:** organização por feature (`components/`, `pages/`, `services/`, `hooks/`, `contexts/`), Context API para autenticação, Axios com interceptor JWT, rotas protegidas com `<ProtectedRoute>`.
- **Banco:** migrations versionadas com Flyway, índices seletivos, soft delete com índices únicos parciais.

> 📘 Detalhamento completo em [`docs/arquitetura.md`](docs/arquitetura.md).

---

## ⚙️ Como executar localmente

### Pré-requisitos

|                  Ferramenta | Versão mínima               |
|-----------------------------|-----------------------------|
|              Docker Desktop | 4.x (com WSL2 no Windows)   |
|                  Java (JDK) | 21                          |
|                     Node.js | 22 (recomendado: LTS atual) |
|                         Git | qualquer versão recente     |

> 💡 **Windows:** instale o **Git Bash** (vem com Git for Windows) — os comandos abaixo seguem sintaxe Unix. Alternativamente, adapte para PowerShell.

### 1. Clonar o repositório

> ```bash
> git clone https://github.com/sindiproti/sindipro.git
> cd sindipro

### 2. Subir o banco de dados

> docker compose up -d

 Isso inicia: 
- **PostgreSQL** 16 em localhost:5433 (a 5432 fica livre para um eventual Postgres local)
- **pgAdmin** em http://localhost:5050 (opcional, para inspeção visual)

> #### Credenciais do banco:
> - **DB:**       sindipro
> - **Usuário:**  sindipro
> - **Senha:**    sindipro123
> - **Porta:**    5433 (host) → 5432 (container)

### 3. Rodar o back-end

> ```bash
> cd backend
> ./mvnw.cmd spring-boot:run      # Windows (Git Bash)
> ou
> ./mvnw spring-boot:run          # Linux/macOS

A primeira execução:

1. Baixa as dependências **Maven** (~30s)
2. Executa `V1__init.sql` e `V2__fix_unique_constraints_for_soft_delete.sql` via **Flyway**
3. Roda o **DataSeeder** criando 1 condomínio + 5 usuários
4. Sobe a **API** em http://localhost:8080

Endpoints disponíveis:

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs

### 4. Rodar o front-end

Em outro terminal:

> ```bash
> cd frontend
> npm install
> npm run dev

Aplicação disponível em http://localhost:5173.

### 5. Encerrar tudo

> ```bash
> **Parar o front** (Ctrl+C no terminal)
> **Parar o back** (Ctrl+C no terminal)
> 
> **Parar o banco** (mantém dados)
> docker compose stop
> 
> **Remover containers e banco** (perde tudo)
> docker compose down -v

### 🔑 Credenciais de teste

O **DataSeeder** cria os seguintes usuários automaticamente (perfil dev):

  **Perfil**	        **E-mail**	                **Senha**
- **Admin do Sistema:**	admin@condominio.local	    admin123
- **Síndico:**	        sindico@condominio.local	sindico123
- **Morador:**	        morador@condominio.local	morador123
- **Porteiro:**	        porteiro@condominio.local	porteiro123
- **Zelador:**	        zelador@condominio.local	zelador123

> ⚠️ Aviso: essas credenciais existem apenas em desenvolvimento. O **DataSeeder** é anotado com `@Profile("!prod")` e nunca roda em produção.

## 🧪 Testes

### Back-end (JUnit 5 + Mockito + MockMvc)

> ```bash
> cd backend
> ./mvnw.cmd test

|              Métrica | Valor                                                    |
|----------------------|----------------------------------------------------------|
|               Testes | 100                                                      |
|Cobertura (statements)| 73% (JaCoCo)                                             |
|           Estratégia | Unitários (services) + Integração (@SpringBootTest + H2) |

Relatório interativo:

> ```bash
> start backend/target/site/jacoco/index.html

### Front-end (Jest + Testing Library)

> ```bash
> cd frontend
> npm test                 # apenas roda
> npm run test:coverage    # roda e exibe cobertura

|              Métrica | Valor                                                    |
|----------------------|----------------------------------------------------------|
|               Testes | 29                                                       |
|Cobertura (statements)| 83,72%                                                   |
|     Threshold mínimo | 70% (configurado em jest.config.cjs)                     |

> Suítes cobertas: `services`, `hooks`, `contexts`, componentes puros (`EmptyState`, `Pagination`) e página (`Login`).

## 🔒 Conformidade

### LGPD

- ✅ **Política de Privacidade e Termos de Uso** publicados nas rotas `/privacidade` e `/termos`
- ✅ Consentimento implícito no cadastro
- ✅ Senhas armazenadas com **BCrypt** (custo 12), nunca em texto plano
- ✅ Soft delete preserva histórico com anonimização opcional
- ✅ Log de auditoria para ações sensíveis (tabela `log_auditoria`)
- ✅ Direito ao esquecimento: `DELETE /usuarios/me` (soft delete + anonimização — roadmap)

### Segurança

- ✅ **HTTPS** obrigatório em produção (**TLS** automático via **Vercel/Render**)
- ✅ **JWT** com expiração de 24h e assinatura HS256
- ✅ **CORS** restrito aos domínios do front-end
- ✅ Rate limiting em `/auth/login` (roadmap — Bucket4j)
- ✅ Validação de entrada com **Bean Validation**
- ✅ Tratamento centralizado de exceções (sem vazamento de stack trace)

### Acessibilidade (WCAG 2.1 AA)

- ✅ HTML semântico (`<main>`, `<nav>`, `<header>`, `<article>`)
- ✅ Skip link "Pular para o conteúdo principal"
- ✅ `aria-label` em botões icônicos e `aria-required` em campos obrigatórios
- ✅ Foco visível customizado (`:focus-visible`)
- ✅ Contraste mínimo 4.5:1
- ✅ Navegação completa por teclado
- ✅ Modais com `role="dialog"`, `aria-modal` e fechamento via `Escape`

### SEO

- ✅ `<title>` dinâmico por rota via hook `usePageTitle`
- ✅ Meta description em todas as páginas públicas
- ✅ URLs semânticas (`/comunicados`, `/reservas`, `/areas-comuns`)
- ✅ `robots.txt` (roadmap) e Open Graph tags

## Deploy

Componente	Plataforma	URL (a configurar)
Front-end	Vercel	https://sindipro.vercel.app
Back-end	Render	https://sindipro-api.onrender.com
Banco	Neon (PostgreSQL)	—
Variáveis de ambiente necessárias:

No Render (back-end):

text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<db>?sslmode=require
SPRING_DATASOURCE_USERNAME=<user>
SPRING_DATASOURCE_PASSWORD=<senha>
JWT_SECRET=<string-longa-aleatoria>
CORS_ORIGINS=https://sindipro.vercel.app
Na Vercel (front-end):

text
VITE_API_URL=https://sindipro-api.onrender.com/api/v1
⚠️ Plano gratuito do Render hiberna o back-end após 15 minutos de inatividade. Primeira requisição após hibernação leva ~30s. Se ocorrer, basta aguardar e tentar novamente.

Instruções completas em docs/deploy.md (roadmap).

## 📁 Estrutura do repositório

sindipro/
├── backend/                        # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sindipro/api/
│   │   │   │   ├── auth/           # Login, registro, /me
│   │   │   │   ├── usuario/        # CRUD de usuários
│   │   │   │   ├── bloco/          # CRUD de blocos
│   │   │   │   ├── unidade/        # CRUD de unidades
│   │   │   │   ├── area/           # CRUD de áreas comuns
│   │   │   │   ├── comunicado/     # CRUD de comunicados
│   │   │   │   ├── ocorrencia/     # CRUD + máquina de estados
│   │   │   │   ├── reserva/        # CRUD + overlap de horário
│   │   │   │   ├── financeiro/     # Lançamentos e pagamentos
│   │   │   │   ├── dashboard/      # Agregações por perfil
│   │   │   │   ├── security/       # JWT, filtros, UserDetails
│   │   │   │   ├── shared/         # DTOs, exceptions, handlers
│   │   │   │   └── config/         # Security, OpenAPI, Seeder
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/   # V1, V2 (Flyway)
│   │   └── test/                   # 100 testes JUnit
│   └── pom.xml
│
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── components/             # Por feature (layout, comum, etc.)
│   │   ├── contexts/               # AuthContext
│   │   ├── hooks/                  # useAuth, useComunicados, etc.
│   │   ├── pages/                  # Login, Dashboard, Comunicados, etc.
│   │   ├── routes/                 # AppRoutes, ProtectedRoute
│   │   ├── services/               # Axios + services por feature
│   │   └── __tests__/              # 29 testes Jest
│   ├── jest.config.cjs
│   ├── jest.setup.cjs
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── arquitetura.md              # Diagramas + fluxo de dados
│   ├── decisoes.md                 # ADRs (8 decisões-chave)
│   └── api.md                      # Referência de endpoints
│
├── docker-compose.yml              # PostgreSQL + pgAdmin
├── LICENSE
└── README.md

## 👤 Autor
Desenvolvido por Anderson Pereira Lima como projeto final do curso Desenvolvimento Completo AI+ (Prati).

- LinkedIn: linkedin.com/in/anderson-lima-7a4133449
- GitHub: github.com/Anderson-P-Lima
- E-mail: andersonxpl@gmail.com