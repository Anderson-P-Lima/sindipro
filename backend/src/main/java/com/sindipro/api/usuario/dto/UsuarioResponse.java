package com.sindipro.api.usuario.dto;

import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;

import java.time.Instant;

public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone,
        Role role,
        Boolean ativo,
        Instant ultimoLogin,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(
                u.getId(), u.getNome(), u.getEmail(), u.getCpf(),
                u.getTelefone(), u.getRole(), u.getAtivo(),
                u.getUltimoLogin(), u.getCriadoEm(), u.getAtualizadoEm()
        );
    }
}