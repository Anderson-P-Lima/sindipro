package com.sindipro.api.comunicado;

import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;

@Entity
@Table(name = "comunicado")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class Comunicado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "condominio_id", nullable = false)
    private Condominio condominio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private CategoriaComunicado categoria = CategoriaComunicado.GERAL;

    @Column(nullable = false)
    @Builder.Default
    private Boolean fixado = false;

    @Column(name = "publicado_em", nullable = false)
    @Builder.Default
    private OffsetDateTime publicadoEm = OffsetDateTime.now();

    @LastModifiedDate
    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;
}