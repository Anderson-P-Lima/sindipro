# Decisões de Arquitetura (ADRs)

Registro das decisões arquiteturais significativas do SindiPro, no formato **ADR (Architecture Decision Record)**. Cada documento captura o **contexto**, a **decisão** tomada, suas **consequências** e as **alternativas consideradas**.

> **Por que documentar decisões?** O código mostra *o que* foi feito; os ADRs mostram *por que*. Isso preserva o raciocínio para futuros mantenedores (e para a banca avaliadora).

---

## Índice

| # | Decisão | Status | Data |
|---------------------|---------------------------------------------|------------|----------|
| [ADR-001](#adr-001) | `Instant` para todas as colunas temporais   | ✅ Aceito | Out/2026 |
| [ADR-002](#adr-002) | Unique constraints parciais em soft delete  | ✅ Aceito | Out/2026 |
| [ADR-003](#adr-003) | JWT stateless (sem sessão servidor)         | ✅ Aceito | Out/2026 |
| [ADR-004](#adr-004) | Detecção de overlap de reserva no banco     | ✅ Aceito | Out/2026 |
| [ADR-005](#adr-005) | Fuso horário fixo `America/Sao_Paulo`       | ✅ Aceito | Out/2026 |
| [ADR-006](#adr-006) | DTOs em todas as respostas da API           | ✅ Aceito | Out/2026 |
| [ADR-007](#adr-007) | Exception handler centralizado              | ✅ Aceito | Out/2026 |
| [ADR-008](#adr-008) | Dashboard polimórfico por role              | ✅ Aceito | Out/2026 |

---

## ADR-001 — `Instant` para todas as colunas temporais

**Status:** ✅ Aceito

### Contexto

As entidades do SindiPro possuem campos de auditoria (`criado_em`, `atualizado_em`) gerenciados pelo **Spring Data Auditing**, e campos de negócio temporal (`Reserva.inicio`, `Reserva.fim`, `Comunicado.publicadoEm`). O banco usa colunas `TIMESTAMPTZ` (timestamp com fuso).

Durante o desenvolvimento, o `DataSeeder` falhou com:

> `java.lang.IllegalArgumentException: Cannot convert unsupported date type`
> `java.time.LocalDateTime to java.time.OffsetDateTime;`
> `Supported types are [LocalDateTime, LocalDate, LocalTime, Instant, Date, Long, long]`

### Decisão

**Usar `java.time.Instant` em todas as colunas temporais** — tanto de auditoria quanto de negócio.

### Consequências

**Positivas:**
- Compatível com Spring Data Auditing (que rejeita `OffsetDateTime`)
- Mapeia nativamente para `TIMESTAMPTZ` no PostgreSQL
- Tipo imutável e thread-safe
- Semântica clara: representa um **instante absoluto** (UTC)

**Negativas:**
- Perde o offset original de criação (ex.: `-03:00` de Brasília)
- Exige conversão no front-end para exibir em fuso local

### Alternativas consideradas

| Alternativa           | Motivo da rejeição                          |
|-----------------------|---------------------------------------------|
| `OffsetDateTime`      | Não suportado pelo Auditing                 |
| `LocalDateTime`       | Não mapeia para `TIMESTAMPTZ`; perde o fuso |
| `java.util.Date`      | API legada, mutável, sem semântica clara    |
| `Long` (epoch millis) | Sem tipo seguro; ruim para queries SQL      |

### Referências

- [Spring Data JPA — Auditing](https://docs.spring.io/spring-data/jpa/reference/auditing.html)
- Documentação do Postgres sobre `TIMESTAMPTZ`

---

## ADR-002 — Unique constraints parciais em soft delete

**Status:** ✅ Aceito

### Contexto

As tabelas `usuario`, `unidade` e `area_comum` usam **soft delete** (coluna `ativo = false`) para preservar histórico. Mas elas também têm constraints de unicidade:

- `usuario.email` (único)
- `unidade (bloco_id, numero)` (único composto)
- `area_comum (condominio_id, nome)` (único composto)

Durante os testes, surgiu o erro:

> `ERROR: duplicate key value violates unique constraint "uk_area_cond_nome"`
> `Detalhe: Key (condominio_id, nome)=(1, Churrasqueira) already exists.`

**Causa:** uma área `Churrasqueira` havia sido desativada (soft delete), mas o constraint `UNIQUE (condominio_id, nome)` ainda a considerava. Impossível recriar uma área com o mesmo nome.

### Decisão

Substituir constraints únicos **totais** por **índices únicos parciais** com `WHERE ativo = true`:

```sql
-- V2__fix_unique_constraints_for_soft_delete.sql

ALTER TABLE area_comum DROP CONSTRAINT uk_area_cond_nome;

CREATE UNIQUE INDEX uk_area_cond_nome_ativo
   ON area_comum (condominio_id, nome)
   WHERE ativo = true;
```

Mesma correção aplicada em unidade e (preventivamente) em usuario.

### Consequências

#### Positivas:
- Nomes/emails/CPFs de registros inativos podem ser reciclados
- Sem perda de integridade: registros ativos continuam únicos
- Histórico preservado (registros inativos permanecem no banco)
- Melhor UX: usuário pode recadastrar um nome que havia excluído

#### Negativas:
- A regra fica em dois lugares (service valida + banco valida)
- Queries de unicidade precisam incluir AND ativo = true
- Índices parciais não são suportados por todos os SGBDs (mas Postgres suporta nativamente)

#### Alternativas consideradas

| Alternativa                | Motivo da rejeição                                   |
|----------------------------|------------------------------------------------------|
| Hard delete	             | Perde histórico; quebra FKs de reservas/lançamentos  |
| Sufixo automático (nome_2) | Polui os dados; confuso para o usuário               |
| Remover constraints        | Perde integridade; possibilita duplicatas ativas     |
| Soft delete sem unicidade	 | Aceitável, mas prefere-se manter a proteção no banco |

#### Referências
- [PostgreSQL — Partial Indexes](https://www.postgresql.org/docs/16/indexes-partial.html)
- [Flyway V2 no repositório](https://documentation.red-gate.com/fd/getting-started-with-flyway-184127223.html)

## ADR-003 — JWT stateless (sem sessão servidor)
**Status:** ✅ Aceito

### Contexto
O sistema precisa autenticar usuários em uma API REST consumida por uma SPA. Existem duas abordagens clássicas:

1. **Sessão em servidor —** servidor guarda estado (`JSESSIONID` + memória/Redis)
2. **Token JWT —** servidor emite token assinado; cliente guarda e envia a cada request

### Decisão
Usar JWT stateless, com as seguintes características:

- **Assinatura HS256** com chave secreta de 64+ caracteres (via variável `JWT_SECRET`)
- **Expiração de 24h** (`app.jwt.expiration-ms = 86400000`)
- **Claims customizadas:** `uid` (id do usuário), `role`, `nome`
- **Armazenamento:** `localStorage` no front-end
- **Injeção:** interceptor Axios adiciona `Authorization: Bearer <token>`
- **Validação:** `JwtAuthenticationFilter` intercepta cada request

### Consequências
#### Positivas:

- Escala horizontal trivial — qualquer instância do back valida o token sem coordenação
- Sem Redis / memória compartilhada
- Compatível com arquiteturas serverless e containers efêmeros
- Front-end desacoplado (basta ter o token)

#### Negativas:

- **Revogação difícil —** token válido até a expiração (24h); não há logout real no servidor
- **XSS —** `localStorage` é acessível por JavaScript; vulnerável se houver XSS
- Token maior que `sessionId` em cada request
- Sem refresh token → usuário precisa relogar a cada 24h

#### Alternativas consideradas
| Alternativa                 | Motivo da rejeição                                               |
|-----------------------------|------------------------------------------------------------------|
| Sessão em servidor (Redis)  |	Adiciona infraestrutura; complexidade desnecessária para MVP     |
| Cookie `HttpOnly` + CSRF    |	Mais seguro contra XSS, mas exige proteção CSRF (complexa)       |
| JWT em cookie `HttpOnly`    |	Combina os problemas dos dois mundos; sem vantagem clara no MVP  |
| OAuth2 / Keycloak           | Overkill para projeto acadêmico                                   |

#### Mitigações aplicadas
- Sanitização de conteúdo (Bootstrap escapa por padrão)
- Nenhum uso de `dangerouslySetInnerHTML` no front
- Senhas com BCrypt custo 12 (resistente a brute force offline)
- Claims mínimas (não guarda dados sensíveis no JWT)

##### Roadmap
- Refresh token com rotação
- Migrar para cookie `HttpOnly` + CSRF token
- Blacklist de tokens revogados (Redis)
- CSP (Content Security Policy) no front

## ADR-004 — Detecção de overlap de reserva no banco
**Status:** ✅ Aceito

### Contexto
Reservas de áreas comuns não podem se sobrepor no tempo. Duas reservas `[a1, a2)` e `[b1, b2)` se sobrepõem quando:

```
a1 < b2  AND  a2 > b1
```
Essa verificação pode ser feita em três lugares:
- **No front-end** (validação client-side)
- **No service** (carrega todas as reservas, compara em memória)
- **No banco** (query SQL com a condição acima)

### Decisão
**Executar a validação principal no banco**, via query JPQL:

```java
@Query("""
    SELECT r FROM Reserva r
    WHERE r.areaComum.id = :areaId
      AND r.status IN ('PENDENTE','APROVADA')
      AND r.inicio < :fim
      AND r.fim > :inicio
""")
List<Reserva> findConflitos(@Param("areaId") Long areaId,
                            @Param("inicio") Instant inicio,
                            @Param("fim") Instant fim);
```

Revalidar o conflito também ao aprovar uma reserva — para evitar condição de corrida (duas reservas criadas como `PENDENTE` no mesmo intervalo).

### Consequências
#### ✅ Positivas:

- **Performance O(1)** com índice `idx_reserva_area_periodo (area_comum_id, inicio, fim)` — sem carga em memória
- Funciona corretamente em ambientes concorrentes (o banco serializa)
- Regra de negócio expressada uma única vez
- Fácil de testar (integração com H2/Postgres)

#### Negativas:

- Não previne race condition pura (duas reservas concorrentes podem passar na checagem antes do INSERT)
- Front ainda precisa validar client-side para feedback rápido

#### Alternativas consideradas
Alternativa	Motivo da rejeição
|---------------------------------|----------------------------------------------------------------------------|
| Só no front                     |	Insuficiente; cliente pode burlar                                          |
| Só no service (memória)         |	O(n) por request; não escala                                               |
| Trigger Postgres                |	Muito rígido; difícil de testar; mensagens de erro ruins                   |
| `EXCLUDE USING gist` (Postgres) | Solução definitiva, mas exige extensão `btree_gist` e complica migrations  |

##### Roadmap
- Adicionar `EXCLUDE USING gist` para garantia no nível do banco (defesa em profundidade)
- Testes de concorrência com múltiplas threads

## ADR-005 — Fuso horário fixo America/Sao_Paulo
**Status:** ✅ Aceito

### Contexto
Reservas têm regras baseadas em horário local:

- Área comum tem `horarioIni` e `horarioFim` (ex.: 10:00 – 22:00)
- Reserva tem `inicio` e `fim` (ex.: 18:00 – 21:00)
- Sistema precisa saber se uma reserva está dentro do horário da área

O problema: `Instant` armazena UTC; a "hora local" depende do fuso do usuário.

### Decisão
Fixar o fuso em `America/Sao_Paulo` no back-end:

```java
private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
```
- O front-end envia `Instant` ISO com offset `-03:00` fixo (Brasil sem DST desde 2019)
- O back interpreta os horários das áreas como **horário de Brasília**
- A validação de "está dentro do horário permitido" é feita convertendo o `Instant` para `America/Sao_Paulo`

### Consequências
#### Positivas:

- Comportamento previsível e consistente — todos veem horário de Brasília
- Simplicidade: sem necessidade de armazenar fuso por área
- Brasil não tem horário de verão desde 2019 → offset fixo em `-03:00` é seguro

#### Negativas:

- **Não funciona** para condomínios em outros fusos (ex.: Manaus, Fernando de Noronha)
- Se o Brasil voltar a ter DST, será necessário revisar
- Usuário acessando de outro país vê horários de Brasília (não do seu local)

#### Alternativas consideradas
| Alternativa                       | Motivo da rejeição                                       |
|-----------------------------------|----------------------------------------------------------|
| Armazenar `ZoneId` por condomínio | Complexidade prematura; MVP assume Brasil                |
| Usar fuso do cliente              | Inconsistente: dois moradores veriam horários diferentes |
| Tudo em UTC                       | Ruim para negócio — reserva é "às 18h de Brasília"       |
| `OffsetDateTime` no banco         | Perde o conceito de "horário de parede"                  |

#### Roadmap
- Suporte a múltiplos fusos por condomínio (campo `timezone` em `condominio`)
- Detectar DST automaticamente se voltar

## ADR-006 — DTOs em todas as respostas da API
**Status:** ✅ Aceito

### Contexto
Endpoints REST podem retornar:

1. **Entidades JPA diretamente —** mais simples, mas expõe o modelo interno
2. **DTOs (Data Transfer Objects) —** objetos dedicados ao contrato da API

Exemplo de vazamento se usar entidade diretamente:

```json
{
  "id": 1,
  "nome": "Maria",
  "email": "maria@x.com",
  "senhaHash": "$2a$12$...",     // ← VAZAMENTO CRÍTICO
  "ultimoLogin": "2026-11-05T...",
  "criadoEm": "..."
}
```

### Decisão
**Usar DTOs em todas as respostas**, com static factory `from(entidade)`:

```java
public record UsuarioResponse(
    Long id,
    String nome,
    String email,
    Role role,
    Boolean ativo,
    Instant ultimoLogin,
    Instant criadoEm
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(
            u.getId(), u.getNome(), u.getEmail(),
            u.getRole(), u.getAtivo(),
            u.getUltimoLogin(), u.getCriadoEm()
        );
    }
}
```

> **Regra:** entidades JPA nunca são retornadas por controllers.

### Consequências
#### ✅ Positivas:

- **Segurança:** nenhum campo interno vaza (ex.: `senhaHash`)
- **Contrato estável:** API não quebra se a entidade mudar internamente
- **Flexibilidade:** DTO pode agregar dados de várias entidades (ex.: `unidadeNumero` + `blocoNome`)
- **Versionamento:** `UsuarioResponseV2` pode coexistir com `V1` durante migração

#### ⚠️ Negativas:

- Mais código: cada entidade precisa de um DTO + mapper
- Boilerplate: conversões manuais (não usamos MapStruct)
- Overhead: alocação de objetos extras na serialização

#### Alternativas consideradas
| Alternativa                        | Motivo da rejeição                                    |
|------------------------------------|-------------------------------------------------------|
| Retornar entidade direto           | Vaza dados; contrato frágil                           |
| `@JsonIgnore` nos campos sensíveis | Frágil; fácil de esquecer                             |
| Projeções JPA (interface)          | Menos controle; acoplado ao Spring Data               |
| MapStruct                          | Adiciona dependência; overkill para o MVP             |

## ADR-007 — Exception handler centralizado
**Status:** ✅ Aceito

### Contexto
Sem tratamento centralizado, cada controller precisaria capturar exceções e formatar respostas — código duplicado, respostas inconsistentes, stack traces vazando.

### Decisão
`@RestControllerAdvice` centralizado que mapeia exceções de domínio para status HTTP + formato padronizado (inspirado em RFC 7807):

```java
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ErrorResponse> handleNotFound(...) {
    return build(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
}

@ExceptionHandler(BusinessException.class)
public ResponseEntity<ErrorResponse> handleBusiness(...) {
    return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req, null);
}

@ExceptionHandler(ResourceConflictException.class)
public ResponseEntity<ErrorResponse> handleConflict(...) {
    return build(HttpStatus.CONFLICT, ex.getMessage(), req, null);
}

@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDenied(...) {
    return build(HttpStatus.FORBIDDEN, "Acesso negado...", req, null);
}
```

Formato de erro padronizado:

```json
{
  "timestamp": "2026-11-05T21:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "O horário de término deve ser posterior ao de início",
  "path": "/api/v1/reservas",
  "details": null
}
```

### Consequências
#### Positivas:

- **Consistência:** todas as respostas de erro seguem o mesmo formato
- **DRY:** sem duplicação nos controllers
- **Segurança:** stack traces não vazam (exceto em perfil dev)
- **Front-end** só precisa tratar um tipo de estrutura

#### Negativas:
- **Handler genérico** (`Exception.class`) expõe `ex.getMessage()` — pode vazar detalhes
- Precisa manter os mapeamentos em sincronia com as exceções de domínio
- Ordem de prioridade dos handlers precisa ser considerada (Spring escolhe o mais específico)

#### Alternativas consideradas
| Alternativa                               | Motivo da rejeição
|-------------------------------------------|-------------------------------------------------------|
| `ResponseStatusException` em cada service | Acopla service ao HTTP; ruim para reuso               |
| Try/catch em cada controller              | Repetitivo; propenso a erro                           |
| Biblioteca `problem-spring-web`           | Adiciona dependência; o handler próprio é suficiente  |

#### Roadmap
- Mascarar `ex.getMessage()` do handler genérico em prod (resposta neutra)
- Adicionar `traceId` para correlação com logs
- Migrar para formato RFC 7807 completo

## ADR-008 — Dashboard polimórfico por role
**Status:** ✅ Aceito

### Contexto
O dashboard precisa mostrar informações diferentes conforme o perfil:

- **Admin/Síndico** → dados globais do condomínio
- **Morador** → apenas seus dados pessoais e das suas unidades
- **Porteiro/Zelador** → dados operacionais, sem acesso a financeiro

Duas abordagens possíveis:

- **Múltiplos endpoints** (`/dashboard/admin`, `/dashboard/morador`, etc.)
- **Endpoint único polimórfico** (`/dashboard/resumo` com resposta condicional)

### Decisão
Endpoint único que adapta a resposta por role, omitindo o campo financeiro para porteiro/zelador via `@JsonInclude(NON_NULL)`:

```java
public record DashboardResponse(
    ComunicadosResumo comunicados,
    OcorrenciasResumo ocorrencias,
    ReservasResumo reservas,

    @JsonInclude(JsonInclude.Include.NON_NULL)
    FinanceiroResumo financeiro
) {}
```

Resposta para **síndico**:

```json
{
  "comunicados": { "total": 12 },
  "ocorrencias": { "abertas": 3, "emAndamento": 2, ... },
  "reservas": { "pendentes": 1, "aprovadas": 5, "proximas": [...] },
  "financeiro": { "mesAtual": { "receitasPagas": 5000, ... } }
}
```

Resposta para **zelador**:

```json
{
  "comunicados": { "total": 12 },
  "ocorrencias": { "abertas": 3, ... },
  "reservas": { ... }
}
```

> **Nota**: `financeiro` está ausente, não `null`. Isso sinaliza "não autorizado" em vez de "sem dados".

### Consequências
#### ✅ Positivas:

- **Segurança no service:** front não pode "pedir" o financeiro se não tiver permissão
- **Contrato único:** front consome um endpoint, adapta a renderização
- **Extensível:** novo perfil entra sem quebrar o front
- **Front simples:** `if (data.financeiro)` renderiza condicional

#### ⚠️ Negativas:

- **Contrato variável:** testes do front precisam cobrir múltiplos perfis
- **Descoberta:** sem Swagger bem documentado, fica menos óbvio o que cada role recebe
- **Cache:** difícil cachear por URL (depende do token)

#### Alternativas consideradas
| Alternativa                   | Motivo da rejeição                             |
|-------------------------------|------------------------------------------------|
| **Múltiplos endpoints**       | Front precisa conhecer todos; código duplicado |
| **Um campo role na resposta** | Front teria que filtrar; menos seguro          |
| **Query params (?scope=all)** | Usuário pode burlar; menos seguro              |
| **GraphQL**                   | Overkill; complexidade prematura               |
