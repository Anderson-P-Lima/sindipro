package com.sindipro.api.financeiro;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LancamentoFinanceiroRepository extends
        JpaRepository<LancamentoFinanceiro, Long>,
        JpaSpecificationExecutor<LancamentoFinanceiro> {

    // ===== Agregações globais (condomínio) =====

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l
        WHERE l.condominio.id = :condId
          AND l.tipo = :tipo
          AND l.status = 'PAGO'
          AND l.dataPagamento BETWEEN :ini AND :fim
    """)
    BigDecimal somarPagoPorTipoEPeriodo(@Param("condId") Long condId,
                                        @Param("tipo") TipoLancamento tipo,
                                        @Param("ini") LocalDate ini,
                                        @Param("fim") LocalDate fim);

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l
        WHERE l.condominio.id = :condId
          AND l.tipo = :tipo
          AND l.status IN ('PENDENTE','ATRASADO')
          AND l.dataVencimento BETWEEN :ini AND :fim
    """)
    BigDecimal somarEmAbertoPorTipoEPeriodo(@Param("condId") Long condId,
                                            @Param("tipo") TipoLancamento tipo,
                                            @Param("ini") LocalDate ini,
                                            @Param("fim") LocalDate fim);

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l
        WHERE l.condominio.id = :condId
          AND l.status IN ('PENDENTE','ATRASADO')
    """)
    BigDecimal somarTotalEmAberto(@Param("condId") Long condId);

    @Query("""
        SELECT COUNT(l) FROM LancamentoFinanceiro l
        WHERE l.condominio.id = :condId
          AND l.status IN ('PENDENTE','ATRASADO')
    """)
    long countEmAberto(@Param("condId") Long condId);

    // ===== Agregações por unidade (visão do morador) =====

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l
        WHERE l.unidade.id IN :unidadeIds
          AND l.tipo = :tipo
          AND l.status = 'PAGO'
          AND l.dataPagamento BETWEEN :ini AND :fim
    """)
    BigDecimal somarPagoPorTipoEPeriodoPorUnidades(
            @Param("unidadeIds") List<Long> unidadeIds,
            @Param("tipo") TipoLancamento tipo,
            @Param("ini") LocalDate ini,
            @Param("fim") LocalDate fim);

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l
        WHERE l.unidade.id IN :unidadeIds
          AND l.status IN ('PENDENTE','ATRASADO')
    """)
    BigDecimal somarEmAbertoPorUnidades(@Param("unidadeIds") List<Long> unidadeIds);

    @Query("""
        SELECT COUNT(l) FROM LancamentoFinanceiro l
        WHERE l.unidade.id IN :unidadeIds
          AND l.status IN ('PENDENTE','ATRASADO')
    """)
    long countEmAbertoPorUnidades(@Param("unidadeIds") List<Long> unidadeIds);
}