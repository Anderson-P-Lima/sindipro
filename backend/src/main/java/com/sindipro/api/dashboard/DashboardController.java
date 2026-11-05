package com.sindipro.api.dashboard;

import com.sindipro.api.dashboard.dto.DashboardResponse;
import com.sindipro.api.security.SecurityUser;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResponse> resumo(@AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(service.resumo(user.getUsuario()));
    }
}