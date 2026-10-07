package com.sindipro.api.financeiro;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    List<LancamentoFinanceiro> findByCondominioIdOrderByDataVencimentoDesc(Long condominioId);

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l
        WHERE l.condominio.id = :condId
          AND l.tipo = :tipo
          AND l.status = 'PAGO'
          AND l.dataPagamento BETWEEN :ini AND :fim
    """)
    BigDecimal somarPorTipoEPeriodo(@Param("condId") Long condId,
                                    @Param("tipo") TipoLancamento tipo,
                                    @Param("ini") LocalDate ini,
                                    @Param("fim") LocalDate fim);
}