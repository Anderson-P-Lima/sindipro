package com.sindipro.api.financeiro;

import com.sindipro.api.financeiro.dto.LancamentoRequest;
import com.sindipro.api.financeiro.dto.LancamentoResponse;
import com.sindipro.api.financeiro.dto.RegistrarPagamentoRequest;
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
@RequestMapping("/api/v1/lancamentos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Lançamentos Financeiros")
public class LancamentoFinanceiroController {

    private final LancamentoFinanceiroService service;

    @GetMapping
    public ResponseEntity<PageResponse<LancamentoResponse>> listar(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(required = false) TipoLancamento tipo,
            @RequestParam(required = false) StatusLancamento status,
            @RequestParam(required = false) Long unidadeId,
            @PageableDefault(size = 20, sort = "dataVencimento") Pageable pageable) {
        return ResponseEntity.ok(
                service.listar(pageable, tipo, status, unidadeId, user.getUsuario()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LancamentoResponse> buscar(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(service.buscar(id, user.getUsuario()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<LancamentoResponse> criar(
            @Valid @RequestBody LancamentoRequest req,
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.status(201).body(service.criar(req, user.getUsuario()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<LancamentoResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody LancamentoRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req));
    }

    @PatchMapping("/{id}/pagamento")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<LancamentoResponse> registrarPagamento(
            @PathVariable Long id,
            @Valid @RequestBody RegistrarPagamentoRequest req) {
        return ResponseEntity.ok(service.registrarPagamento(id, req));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN_SISTEMA','SINDICO')")
    public ResponseEntity<LancamentoResponse> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancelar(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_SISTEMA')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}