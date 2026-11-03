package com.sindipro.api.comunicado;

import com.sindipro.api.comunicado.dto.ComunicadoRequest;
import com.sindipro.api.comunicado.dto.ComunicadoResponse;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comunicados")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Comunicados")
public class ComunicadoController {

    private final ComunicadoService service;

    @GetMapping
    public ResponseEntity<PageResponse<ComunicadoResponse>> listar(
            @RequestParam(required = false) CategoriaComunicado categoria,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.listar(pageable, categoria));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComunicadoResponse> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscar(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<ComunicadoResponse> criar(
            @Valid @RequestBody ComunicadoRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.criar(req, user.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<ComunicadoResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ComunicadoRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}