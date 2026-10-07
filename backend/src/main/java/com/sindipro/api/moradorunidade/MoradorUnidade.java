package com.sindipro.api.moradorunidade;

import com.sindipro.api.unidade.Unidade;
import com.sindipro.api.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "morador_unidade",
        uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "unidade_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class MoradorUnidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidade_id", nullable = false)
    private Unidade unidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMorador tipo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean responsavel = false;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim;

    @CreatedDate
    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;
}