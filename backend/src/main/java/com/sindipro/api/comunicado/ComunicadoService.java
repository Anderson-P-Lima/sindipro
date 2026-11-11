package com.sindipro.api.comunicado;

import com.sindipro.api.comunicado.dto.ComunicadoRequest;
import com.sindipro.api.comunicado.dto.ComunicadoResponse;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.shared.dto.PageResponse;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComunicadoService {

    private final ComunicadoRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final CondominioService condominioService;

    @Transactional(readOnly = true)
    public PageResponse<ComunicadoResponse> listar(
            Pageable pageable, CategoriaComunicado categoria) {
        Condominio c = condominioService.obterAtual();

        Page<Comunicado> page = categoria != null
                ? repository.findByCondominioIdAndCategoriaOrderByFixadoDescPublicadoEmDesc(
                c.getId(), categoria, pageable)
                : repository.findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
                c.getId(), pageable);

        return PageResponse.from(page, ComunicadoResponse::from);
    }

    @Transactional(readOnly = true)
    public ComunicadoResponse buscar(Long id) {
        return ComunicadoResponse.from(obter(id));
    }

    @Transactional
    public ComunicadoResponse criar(ComunicadoRequest req, String emailAutor) {
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new ResourceNotFoundException("Autor não encontrado"));
        Condominio c = condominioService.obterAtual();

        Comunicado cm = Comunicado.builder()
                .condominio(c)
                .autor(autor)
                .titulo(req.titulo())
                .conteudo(req.conteudo())
                .categoria(req.categoria())
                .fixado(Boolean.TRUE.equals(req.fixado()))
                .build();

        return ComunicadoResponse.from(repository.save(cm));
    }

    @Transactional
    public ComunicadoResponse atualizar(Long id, ComunicadoRequest req) {
        Comunicado cm = obter(id);
        cm.setTitulo(req.titulo());
        cm.setConteudo(req.conteudo());
        cm.setCategoria(req.categoria());
        cm.setFixado(Boolean.TRUE.equals(req.fixado()));

        return ComunicadoResponse.from(repository.save(cm));
    }

    @Transactional
    public void deletar(Long id) {
        repository.delete(obter(id));
    }

    private Comunicado obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comunicado não encontrado: " + id));
    }
}