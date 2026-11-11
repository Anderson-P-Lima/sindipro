-- =====================================================================
-- V2: Unique constraints devem ser parciais em tabelas com soft delete
-- Motivo: registro soft-deletado (ativo = false) não deve bloquear a
--         recriação de um registro com o mesmo nome/número.
-- =====================================================================

-- --- area_comum ---
ALTER TABLE area_comum DROP CONSTRAINT IF EXISTS uk_area_cond_nome;

CREATE UNIQUE INDEX uk_area_cond_nome_ativo
    ON area_comum (condominio_id, nome)
    WHERE ativo = true;

-- --- unidade ---
ALTER TABLE unidade DROP CONSTRAINT IF EXISTS uk_unidade_bloco_numero;

CREATE UNIQUE INDEX uk_unidade_bloco_numero_ativo
    ON unidade (bloco_id, numero)
    WHERE ativo = true;