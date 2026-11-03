package com.sindipro.api.reserva;

import com.sindipro.api.reserva.dto.AlterarStatusReservaRequest;
import com.sindipro.api.reserva.dto.ReservaRequest;
import com.sindipro.api.reserva.dto.ReservaResponse;
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
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Reservas")
public class ReservaController {

    private final ReservaService service;

    @GetMapping
    public ResponseEntity<PageResponse<ReservaResponse>> listar(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(required = false) StatusReserva status,
            @RequestParam(required = false) Long areaComumId,
            @RequestParam(required = false) Long unidadeId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                service.listar(pageable, status, areaComumId, unidadeId, user.getUsuario()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservaResponse> buscar(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(service.buscar(id, user.getUsuario()));
    }

    @PostMapping
    public ResponseEntity<ReservaResponse> criar(
            @Valid @RequestBody ReservaRequest req,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.status(201).body(service.criar(req, user.getUsuario()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO','MORADOR')")
    public ResponseEntity<ReservaResponse> alterarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AlterarStatusReservaRequest req,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(service.alterarStatus(id, req, user.getUsuario()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_SISTEMA')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}