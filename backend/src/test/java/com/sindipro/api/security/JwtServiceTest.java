package com.sindipro.api.security;

import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtService")
class JwtServiceTest {

    private static final String SECRET =
            "test-secret-key-for-unit-tests-only-min-32-chars-long-1234567890";

    private JwtService jwtService;
    private SecurityUser user;

    @BeforeEach
    void setup() {
        jwtService = new JwtService(SECRET, 3_600_000L);
        Usuario usuario = Usuario.builder()
                .id(1L).nome("Maria").email("maria@teste.com")
                .senhaHash("hash").role(Role.MORADOR).ativo(true)
                .build();
        user = new SecurityUser(usuario);
    }

    @Test
    @DisplayName("gerarToken: contém e-mail como subject")
    void gerarToken() {
        String token = jwtService.gerarToken(user, Map.of("uid", 1L));
        assertThat(token).isNotBlank();
        assertThat(jwtService.extrairEmail(token)).isEqualTo("maria@teste.com");
    }

    @Test
    @DisplayName("isTokenValido: token recém-gerado é válido")
    void tokenValido() {
        String token = jwtService.gerarToken(user, Map.of());
        assertThat(jwtService.isTokenValido(token, user)).isTrue();
    }

    @Test
    @DisplayName("isTokenValido: e-mail diferente invalida")
    void tokenOutroUsuario() {
        String token = jwtService.gerarToken(user, Map.of());

        Usuario outro = Usuario.builder()
                .id(2L).email("outro@teste.com").role(Role.MORADOR).senhaHash("x").ativo(true)
                .build();
        SecurityUser outroUser = new SecurityUser(outro);

        assertThat(jwtService.isTokenValido(token, outroUser)).isFalse();
    }

    @Test
    @DisplayName("extrairEmail: token expirado lança exceção")
    void tokenExpirado() throws InterruptedException {
        // Token válido por 1ms
        JwtService expirado = new JwtService(SECRET, 1L);
        String token = expirado.gerarToken(user, Map.of());

        Thread.sleep(50);

        try {
            expirado.extrairEmail(token);
            assertThat(false).as("Deveria lançar exceção para token expirado").isTrue();
        } catch (Exception e) {
            assertThat(e).isNotNull();
        }
    }
}