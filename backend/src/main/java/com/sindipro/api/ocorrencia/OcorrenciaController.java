package com.sindipro.api.ocorrencia;

import com.sindipro.api.ocorrencia.dto.*;
import com.sindipro.api.security.SecurityUser;
import com.sindipro.api.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ocorrencias")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Ocorrências")
public class OcorrenciaController {

    private final OcorrenciaService service;

    @GetMapping
    public ResponseEntity<PageResponse<OcorrenciaResponse>> listar(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(required = false) StatusOcorrencia status,
            @RequestParam(required = false) PrioridadeOcorrencia prioridade,
            @RequestParam(required = false) Long responsavelId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                service.listar(pageable, status, prioridade, responsavelId, user.getUsuario()));
    }

    @GetMapping("/responsaveis-elegiveis")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<java.util.List<com.sindipro.api.usuario.dto.UsuarioResponse>> responsaveisElegiveis() {
        return ResponseEntity.ok(service.responsaveisElegiveis());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<OcorrenciaResponse> buscar(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(service.buscar(id, user.getUsuario()));
    }

    @PostMapping
    public ResponseEntity<OcorrenciaResponse> criar(
            @Valid @RequestBody OcorrenciaRequest req,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.status(201).body(service.criar(req, user.getUsuario()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO','ZELADOR','MORADOR')")
    public ResponseEntity<OcorrenciaResponse> alterarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AlterarStatusRequest req,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(service.alterarStatus(id, req, user.getUsuario()));
    }

    @PatchMapping("/{id}/responsavel")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<OcorrenciaResponse> atribuirResponsavel(
            @PathVariable Long id,
            @Valid @RequestBody AtribuirResponsavelRequest req) {
        return ResponseEntity.ok(service.atribuirResponsavel(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_SISTEMA')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}