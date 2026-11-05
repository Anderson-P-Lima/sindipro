package com.sindipro.api.unidade;

import com.sindipro.api.security.SecurityUser;
import com.sindipro.api.unidade.dto.UnidadeRequest;
import com.sindipro.api.unidade.dto.UnidadeResponse;
import com.sindipro.api.usuario.Role;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/v1/unidades")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Unidades")
public class UnidadeController {

    private final UnidadeService service;

    @GetMapping
    public ResponseEntity<List<UnidadeResponse>> listar(
            @RequestParam(required = false) Long blocoId,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Boolean minhas,
            @AuthenticationPrincipal SecurityUser user) {

        if (Boolean.TRUE.equals(minhas)
                && user.getUsuario().getRole() == Role.MORADOR) {
            return ResponseEntity.ok(service.listarMinhas(user.getUsuario().getId()));
        }
        return ResponseEntity.ok(service.listar(blocoId, ativo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UnidadeResponse> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscar(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<UnidadeResponse> criar(@Valid @RequestBody UnidadeRequest req) {
        return ResponseEntity.status(201).body(service.criar(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<UnidadeResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody UnidadeRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<UnidadeResponse> alterarStatus(
            @PathVariable Long id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(service.alterarStatus(id, ativo));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}