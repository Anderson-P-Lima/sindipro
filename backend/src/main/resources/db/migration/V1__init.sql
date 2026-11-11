-- Esquema inicial do Sistema do Condomínio

-- Atualiza automaticamente a coluna atualizado_em
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- CONDOMINIO
CREATE TABLE condominio (
    id            BIGSERIAL         PRIMARY KEY,
    nome          VARCHAR(120)      NOT NULL,
    cnpj          VARCHAR(18)       UNIQUE,
    endereco      VARCHAR(200)      NOT NULL,
    cidade        VARCHAR(80)       NOT NULL,
    uf            VARCHAR(2)           NOT NULL,
    cep           VARCHAR(9),
    criado_em     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_condominio_atualizado
    BEFORE UPDATE ON condominio
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- BLOCO
CREATE TABLE bloco (
    id              BIGSERIAL       PRIMARY KEY,
    condominio_id   BIGINT          NOT NULL REFERENCES condominio(id) ON DELETE CASCADE,
    nome            VARCHAR(50)     NOT NULL,
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_bloco_condominio_nome UNIQUE (condominio_id, nome)
);

CREATE INDEX idx_bloco_condominio ON bloco(condominio_id);


-- UNIDADE
CREATE TABLE unidade (
    id              BIGSERIAL PRIMARY KEY,
    bloco_id        BIGINT          NOT NULL REFERENCES bloco(id) ON DELETE CASCADE,
    numero          VARCHAR(10)     NOT NULL,
    andar           INT,
    ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_unidade_bloco_numero UNIQUE (bloco_id, numero),
    CONSTRAINT ck_unidade_andar CHECK (andar IS NULL OR andar >= 0)
);

CREATE INDEX idx_unidade_bloco ON unidade(bloco_id);
CREATE INDEX idx_unidade_ativo ON unidade(ativo);

CREATE TRIGGER trg_unidade_atualizado
    BEFORE UPDATE ON unidade
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- USUÁRIO
CREATE TABLE usuario (
    id              BIGSERIAL       PRIMARY KEY,
    nome            VARCHAR(120)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    senha_hash      VARCHAR(100)    NOT NULL,
    cpf             VARCHAR(14),
    telefone        VARCHAR(20),
    role            VARCHAR(30)     NOT NULL,
    ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    ultimo_login    TIMESTAMPTZ,
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT uk_usuario_cpf UNIQUE (cpf),
    CONSTRAINT ck_usuario_role CHECK (
        role IN ('ADMIN_SISTEMA','SINDICO','MORADOR','PORTEIRO','ZELADOR')
    )
);

CREATE INDEX idx_usuario_role ON usuario(role);
CREATE INDEX idx_usuario_ativo ON usuario(ativo);

CREATE TRIGGER trg_usuario_atualizado
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- RELAÇÃO MORADOR UNIDADE (N:N)
CREATE TABLE morador_unidade (
    id              BIGSERIAL       PRIMARY KEY,
    usuario_id      BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    unidade_id      BIGINT          NOT NULL REFERENCES unidade(id) ON DELETE CASCADE,
    tipo            VARCHAR(20)     NOT NULL,
    responsavel     BOOLEAN         NOT NULL DEFAULT FALSE,
    data_inicio     DATE            NOT NULL DEFAULT CURRENT_DATE,
    data_fim        DATE,
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_morador_unidade UNIQUE (usuario_id, unidade_id),
    CONSTRAINT ck_morador_tipo CHECK (
        tipo IN ('PROPRIETARIO','INQUILINO','DEPENDENTE')
    ),
    CONSTRAINT ck_morador_datas CHECK (
        data_fim IS NULL OR data_fim >= data_inicio
    )
);

CREATE INDEX idx_morador_unidade_unidade ON morador_unidade(unidade_id);


-- COMUNICADO
CREATE TABLE comunicado (
    id              BIGSERIAL PRIMARY KEY,
    condominio_id   BIGINT          NOT NULL REFERENCES condominio(id) ON DELETE CASCADE,
    autor_id        BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    titulo          VARCHAR(150)    NOT NULL,
    conteudo        TEXT            NOT NULL,
    categoria       VARCHAR(30)     NOT NULL DEFAULT 'GERAL',
    fixado          BOOLEAN         NOT NULL DEFAULT FALSE,
    publicado_em    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_comunicado_categoria CHECK (
        categoria IN ('GERAL','MANUTENCAO','SEGURANCA','EVENTO','FINANCEIRO','URGENTE')
    )
);

CREATE INDEX idx_comunicado_cond_pub ON comunicado(condominio_id, publicado_em DESC);

CREATE TRIGGER trg_comunicado_atualizado
    BEFORE UPDATE ON comunicado
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- ÁREA COMUM
CREATE TABLE area_comum (
    id              BIGSERIAL PRIMARY KEY,
    condominio_id   BIGINT          NOT NULL REFERENCES condominio(id) ON DELETE CASCADE,
    nome            VARCHAR(80)     NOT NULL,
    descricao       VARCHAR(255),
    capacidade      INT,
    horario_ini     TIME            NOT NULL,
    horario_fim     TIME            NOT NULL,
    taxa            DECIMAL(10,2)   NOT NULL DEFAULT 0,
    ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_area_cond_nome UNIQUE (condominio_id, nome),
    CONSTRAINT ck_area_horario CHECK (horario_fim > horario_ini),
    CONSTRAINT ck_area_taxa CHECK (taxa >= 0),
    CONSTRAINT ck_area_cap CHECK (capacidade IS NULL OR capacidade > 0)
);

CREATE INDEX idx_area_condominio ON area_comum(condominio_id);


-- RESERVA
CREATE TABLE reserva (
    id              BIGSERIAL       PRIMARY KEY,
    area_comum_id   BIGINT          NOT NULL REFERENCES area_comum(id) ON DELETE RESTRICT,
    unidade_id      BIGINT          NOT NULL REFERENCES unidade(id) ON DELETE RESTRICT,
    solicitante_id  BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    inicio          TIMESTAMPTZ     NOT NULL,
    fim             TIMESTAMPTZ     NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDENTE',
    observacao      VARCHAR(500),
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_reserva_periodo CHECK (fim > inicio),
    CONSTRAINT ck_reserva_status CHECK (
        status IN ('PENDENTE','APROVADA','RECUSADA','CANCELADA','CONCLUIDA')
    )
);

CREATE INDEX idx_reserva_area_periodo ON reserva(area_comum_id, inicio, fim);
CREATE INDEX idx_reserva_unidade ON reserva(unidade_id);
CREATE INDEX idx_reserva_status ON reserva(status);

CREATE TRIGGER trg_reserva_atualizado
    BEFORE UPDATE ON reserva
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- OCORRÊNCIA
CREATE TABLE ocorrencia (
    id              BIGSERIAL       PRIMARY KEY,
    unidade_id      BIGINT          REFERENCES unidade(id) ON DELETE SET NULL,
    autor_id        BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    responsavel_id  BIGINT          REFERENCES usuario(id) ON DELETE SET NULL,
    titulo          VARCHAR(150)    NOT NULL,
    descricao       TEXT            NOT NULL,
    prioridade      VARCHAR(20)     NOT NULL DEFAULT 'MEDIA',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ABERTA',
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolvido_em    TIMESTAMPTZ,
    CONSTRAINT ck_ocorrencia_prioridade CHECK (
        prioridade IN ('BAIXA','MEDIA','ALTA','URGENTE')
    ),
    CONSTRAINT ck_ocorrencia_status CHECK (
        status IN ('ABERTA','EM_ANDAMENTO','RESOLVIDA','CANCELADA')
    )
);

CREATE INDEX idx_ocorrencia_status ON ocorrencia(status);
CREATE INDEX idx_ocorrencia_unidade ON ocorrencia(unidade_id);
CREATE INDEX idx_ocorrencia_respons ON ocorrencia(responsavel_id);

CREATE TRIGGER trg_ocorrencia_atualizado
    BEFORE UPDATE ON ocorrencia
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- LANÇAMENTO FINANCEIRO
CREATE TABLE lancamento_financeiro (
    id              BIGSERIAL PRIMARY KEY,
    condominio_id   BIGINT          NOT NULL REFERENCES condominio(id) ON DELETE CASCADE,
    unidade_id      BIGINT          REFERENCES unidade(id) ON DELETE SET NULL,
    criado_por      BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    tipo            VARCHAR(10)     NOT NULL,
    categoria       VARCHAR(40)     NOT NULL,
    descricao       VARCHAR(200)    NOT NULL,
    valor           DECIMAL(12,2)   NOT NULL,
    data_vencimento DATE            NOT NULL,
    data_pagamento  DATE,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDENTE',
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_lanc_tipo CHECK (tipo IN ('RECEITA','DESPESA')),
    CONSTRAINT ck_lanc_valor CHECK (valor > 0),
    CONSTRAINT ck_lanc_status CHECK (
        status IN ('PENDENTE','PAGO','ATRASADO','CANCELADO')
    ),
    CONSTRAINT ck_lanc_pagamento CHECK (
        data_pagamento IS NULL OR data_pagamento >= data_vencimento - INTERVAL '365 days'
    )
);

CREATE INDEX idx_lanc_cond_venc ON lancamento_financeiro(condominio_id, data_vencimento);
CREATE INDEX idx_lanc_unidade ON lancamento_financeiro(unidade_id);
CREATE INDEX idx_lanc_status ON lancamento_financeiro(status);
CREATE INDEX idx_lanc_tipo ON lancamento_financeiro(tipo);

CREATE TRIGGER trg_lanc_atualizado
    BEFORE UPDATE ON lancamento_financeiro
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- LOG AUDITORIA
CREATE TABLE log_auditoria (
    id              BIGSERIAL       PRIMARY KEY,
    usuario_id      BIGINT          REFERENCES usuario(id) ON DELETE SET NULL,
    acao            VARCHAR(60)     NOT NULL,
    entidade        VARCHAR(60),
    entidade_id     BIGINT,
    detalhe         VARCHAR(500),
    ip              VARCHAR(45),
    timestamp       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_usuario ON log_auditoria(usuario_id);
CREATE INDEX idx_log_timestamp ON log_auditoria(timestamp DESC);
CREATE INDEX idx_log_entidade ON log_auditoria(entidade, entidade_id);