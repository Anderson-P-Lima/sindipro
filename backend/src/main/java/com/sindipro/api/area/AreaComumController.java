package com.sindipro.api.area;

import com.sindipro.api.area.dto.AreaComumRequest;
import com.sindipro.api.area.dto.AreaComumResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/areas-comuns")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Áreas Comuns")
public class AreaComumController {

    private final AreaComumService service;

    @GetMapping
    public ResponseEntity<List<AreaComumResponse>> listar(
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(service.listar(ativo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AreaComumResponse> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscar(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<AreaComumResponse> criar(@Valid @RequestBody AreaComumRequest req) {
        return ResponseEntity.status(201).body(service.criar(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<AreaComumResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AreaComumRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<AreaComumResponse> alterarStatus(
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