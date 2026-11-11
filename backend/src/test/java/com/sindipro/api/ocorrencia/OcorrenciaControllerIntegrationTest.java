package com.sindipro.api.ocorrencia;

import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("OcorrenciaController (integration)")
class OcorrenciaControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String tokenMorador;
    private String tokenSindico;

    @BeforeEach
    void setup() throws Exception {
        tokenMorador = login("morador@condominio.local", "morador123");
        tokenSindico = login("sindico@condominio.local", "sindico123");
    }

    private String login(String email, String senha) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"senha\":\"%s\"}", email, senha)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Map<String, Object> body = objectMapper.readValue(response, Map.class);
        return (String) body.get("token");
    }

    private Long criarOcorrencia(String token, String titulo) throws Exception {
        String response = mockMvc.perform(post("/api/v1/ocorrencias")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"titulo\":\"%s\",\"descricao\":\"desc\",\"prioridade\":\"MEDIA\"}", titulo)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Map<String, Object> body = objectMapper.readValue(response, Map.class);
        return ((Number) body.get("id")).longValue();
    }

    @Test
    @DisplayName("GET /ocorrencias: morador vê só as suas")
    void listar_morador() throws Exception {
        criarOcorrencia(tokenMorador, "Ocorrência da Maria");

        mockMvc.perform(get("/api/v1/ocorrencias")
                        .header("Authorization", "Bearer " + tokenMorador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("GET /ocorrencias: sem token → 401/403")
    void listar_semToken() throws Exception {
        mockMvc.perform(get("/api/v1/ocorrencias"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("POST /ocorrencias: morador cria → 201")
    void criar_morador() throws Exception {
        mockMvc.perform(post("/api/v1/ocorrencias")
                        .header("Authorization", "Bearer " + tokenMorador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Teste\",\"descricao\":\"Desc\",\"prioridade\":\"ALTA\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ABERTA"));
    }

    @Test
    @DisplayName("POST /ocorrencias: body inválido → 400")
    void criar_invalido() throws Exception {
        mockMvc.perform(post("/api/v1/ocorrencias")
                        .header("Authorization", "Bearer " + tokenMorador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /status: síndico move ABERTA → EM_ANDAMENTO")
    void alterarStatus_sindico() throws Exception {
        Long id = criarOcorrencia(tokenSindico, "Ocorrência do Síndico");

        mockMvc.perform(patch("/api/v1/ocorrencias/" + id + "/status")
                        .header("Authorization", "Bearer " + tokenSindico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"EM_ANDAMENTO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"));
    }

    @Test
    @DisplayName("PATCH /responsavel: morador bloqueado (403)")
    void atribuir_morador_403() throws Exception {
        Long id = criarOcorrencia(tokenMorador, "X");

        mockMvc.perform(patch("/api/v1/ocorrencias/" + id + "/responsavel")
                        .header("Authorization", "Bearer " + tokenMorador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"responsavelId\":5}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /responsaveis-elegiveis: síndico vê lista")
    void responsaveisElegiveis() throws Exception {
        mockMvc.perform(get("/api/v1/ocorrencias/responsaveis-elegiveis")
                        .header("Authorization", "Bearer " + tokenSindico))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("DELETE /ocorrencias: síndico bloqueado (403 — só admin)")
    void deletar_sindico_403() throws Exception {
        Long id = criarOcorrencia(tokenSindico, "X");

        mockMvc.perform(delete("/api/v1/ocorrencias/" + id)
                        .header("Authorization", "Bearer " + tokenSindico))
                .andExpect(status().isForbidden());
    }

    @org.junit.jupiter.api.BeforeEach
    void garantirUsuarios() {
        if (!usuarioRepository.existsByEmail("morador@condominio.local")) {
            usuarioRepository.save(Usuario.builder()
                    .nome("Maria Teste")
                    .email("morador@condominio.local")
                    .senhaHash(passwordEncoder.encode("morador123"))
                    .role(Role.MORADOR)
                    .ativo(true)
                    .build());
        }
        if (!usuarioRepository.existsByEmail("sindico@condominio.local")) {
            usuarioRepository.save(Usuario.builder()
                    .nome("Carlos Teste")
                    .email("sindico@condominio.local")
                    .senhaHash(passwordEncoder.encode("sindico123"))
                    .role(Role.SINDICO)
                    .ativo(true)
                    .build());
        }
    }
}