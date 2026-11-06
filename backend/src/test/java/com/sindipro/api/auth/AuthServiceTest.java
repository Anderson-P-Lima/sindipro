package com.sindipro.api.auth;

import com.sindipro.api.auth.dto.AuthResponse;
import com.sindipro.api.auth.dto.LoginRequest;
import com.sindipro.api.auth.dto.RegisterRequest;
import com.sindipro.api.security.JwtService;
import com.sindipro.api.security.SecurityUser;
import com.sindipro.api.shared.exception.ResourceConflictException;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authManager;

    @InjectMocks private AuthService authService;

    private Usuario usuarioExistente;

    @BeforeEach
    void setup() {
        usuarioExistente = Usuario.builder()
                .id(1L)
                .nome("Maria Teste")
                .email("maria@teste.com")
                .senhaHash("hash-fake")
                .role(Role.MORADOR)
                .ativo(true)
                .build();
    }

    // ---------- registrar ----------

    @Test
    @DisplayName("registrar: cria usuário novo e devolve token")
    void registrar_sucesso() {
        var req = new RegisterRequest("João", "joao@teste.com", "senha123", Role.MORADOR);

        when(usuarioRepository.existsByEmail("joao@teste.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("hash-novo");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(jwtService.gerarToken(any(SecurityUser.class), any())).thenReturn("token-jwt");

        AuthResponse resp = authService.registrar(req);

        assertThat(resp.token()).isEqualTo("token-jwt");
        assertThat(resp.email()).isEqualTo("joao@teste.com");
        assertThat(resp.role()).isEqualTo("MORADOR");
        verify(passwordEncoder).encode("senha123");
    }

    @Test
    @DisplayName("registrar: rejeita e-mail duplicado")
    void registrar_emailDuplicado() {
        var req = new RegisterRequest("João", "joao@teste.com", "senha123", Role.MORADOR);
        when(usuarioRepository.existsByEmail("joao@teste.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.registrar(req))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("E-mail já cadastrado");

        verify(usuarioRepository, never()).save(any());
    }

    // ---------- login ----------

    @Test
    @DisplayName("login: autentica e atualiza último login")
    void login_sucesso() {
        var req = new LoginRequest("maria@teste.com", "senha123");
        var principal = new SecurityUser(usuarioExistente);
        Authentication auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());

        when(authManager.authenticate(any())).thenReturn(auth);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioExistente);
        when(jwtService.gerarToken(any(SecurityUser.class), any())).thenReturn("token-jwt");

        AuthResponse resp = authService.login(req);

        assertThat(resp.token()).isEqualTo("token-jwt");
        assertThat(usuarioExistente.getUltimoLogin()).isNotNull();
        verify(usuarioRepository).save(usuarioExistente);
    }

    @Test
    @DisplayName("login: credenciais inválidas propagam exceção")
    void login_credenciaisInvalidas() {
        var req = new LoginRequest("maria@teste.com", "senha-errada");
        when(authManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Falhou"));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);

        verify(usuarioRepository, never()).save(any());
    }
}