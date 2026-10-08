package com.sindipro.api.config;

import java.time.Instant;

import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("Seed ignorado: banco já possui usuários.");
            return;
        }

        usuarioRepository.saveAll(List.of(
            novo("Administrador do Sistema", "admin@condominio.local",   "admin123",  Role.ADMIN_SISTEMA),
            novo("Carlos Síndico",           "sindico@condominio.local", "sindico123", Role.SINDICO),
            novo("Maria Moradora",           "morador@condominio.local", "morador123", Role.MORADOR),
            novo("João Porteiro",            "porteiro@condominio.local","porteiro123",Role.PORTEIRO),
            novo("Pedro Zelador",            "zelador@condominio.local", "zelador123", Role.ZELADOR)
        ));

        log.info("✅ Seed concluído. Login: admin@condominio.local / admin123");
    }

    private Usuario novo(String nome, String email, String senha, Role role) {
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode(senha));
        u.setRole(role);
        u.setAtivo(true);
        return u;
    }
}