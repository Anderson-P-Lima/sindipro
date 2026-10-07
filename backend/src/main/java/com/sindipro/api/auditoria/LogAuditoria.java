package com.sindipro.api.auditoria;

import com.sindipro.api.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "log_auditoria")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 60)
    private String acao;

    @Column(length = 60)
    private String entidade;

    @Column(name = "entidade_id")
    private Long entidadeId;

    @Column(length = 500)
    private String detalhe;

    @Column(length = 45)
    private String ip;

    @Column(nullable = false)
    @Builder.Default
    private OffsetDateTime timestamp = OffsetDateTime.now();
}