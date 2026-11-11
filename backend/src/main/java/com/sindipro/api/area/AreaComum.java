package com.sindipro.api.area;

import java.time.Instant;

import com.sindipro.api.condominio.Condominio;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "area_comum", uniqueConstraints = @UniqueConstraint(columnNames = {"condominio_id", "nome"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AreaComum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "condominio_id", nullable = false)
    private Condominio condominio;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(length = 255)
    private String descricao;

    private Integer capacidade;

    @Column(name = "horario_ini", nullable = false)
    private LocalTime horarioIni;

    @Column(name = "horario_fim", nullable = false)
    private LocalTime horarioFim;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxa = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;
}