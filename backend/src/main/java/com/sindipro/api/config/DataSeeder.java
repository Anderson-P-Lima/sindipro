package com.sindipro.api.config;

import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioRepository;
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
    private final CondominioRepository condominioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCondominio();
        seedUsuarios();
    }

    private void seedCondominio() {
        if (condominioRepository.count() > 0) return;

        Condominio c = Condominio.builder()
                .nome("Condomínio Residencial SindiPro")
                .cnpj("12.345.678/0001-90")
                .endereco("Rua das Acácias, 100")
                .cidade("São Paulo")
                .uf("SP")
                .cep("01000-000")
                .build();

        condominioRepository.save(c);
        log.info("[SEED] Condomínio criado: {}", c.getNome());
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() > 0) {
            log.info("[SEED] Usuários já existem, pulando.");
            return;
        }

        usuarioRepository.saveAll(List.of(
                novo("Administrador do Sistema", "admin@condominio.local",   "admin123",    Role.ADMIN_SISTEMA),
                novo("Carlos Síndico",           "sindico@condominio.local", "sindico123",  Role.SINDICO),
                novo("Maria Moradora",           "morador@condominio.local", "morador123",  Role.MORADOR),
                novo("João Porteiro",            "porteiro@condominio.local","porteiro123", Role.PORTEIRO),
                novo("Pedro Zelador",            "zelador@condominio.local", "zelador123",  Role.ZELADOR)
        ));

        log.info("[SEED] 5 usuários criados. Login: admin@condominio.local / admin123");
    }

    private Usuario novo(String nome, String email, String senha, Role role) {
        return Usuario.builder()
                .nome(nome)
                .email(email)
                .senhaHash(passwordEncoder.encode(senha))
                .role(role)
                .ativo(true)
                .build();
    }
}