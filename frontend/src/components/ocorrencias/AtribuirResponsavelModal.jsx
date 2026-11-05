import { useEffect, useState } from 'react';
import { ocorrenciaService } from '../../services/ocorrenciaService';

export default function AtribuirResponsavelModal({ aberto, ocorrencia, onFechar, onConfirmar }) {
  const [responsaveis, setResponsaveis] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [selecionado, setSelecionado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return;
    setErro('');
    setSelecionado(ocorrencia?.responsavelId ?? '');
    setCarregandoLista(true);
    ocorrenciaService
      .responsaveisElegiveis()
      .then(setResponsaveis)
      .catch((e) =>
        setErro(e.response?.data?.message || 'Não foi possível carregar responsáveis.')
      )
      .finally(() => setCarregandoLista(false));
  }, [aberto, ocorrencia]);

  const handleConfirmar = async () => {
    if (!selecionado) {
      setErro('Selecione um responsável.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      await onConfirmar(ocorrencia.id, Number(selecionado));
      onFechar();
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível atribuir o responsável.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-atribuir-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5" id="modal-atribuir-titulo">
              Atribuir responsável
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onFechar}
              disabled={salvando}
            ></button>
          </div>

          <div className="modal-body">
            {erro && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                {erro}
              </div>
            )}

            <p className="small text-secondary">
              Ocorrência: <strong>{ocorrencia?.titulo}</strong>
            </p>

            {carregandoLista ? (
              <div className="text-center py-3" role="status">
                <div className="spinner-border spinner-border-sm text-primary" aria-hidden="true"></div>
              </div>
            ) : (
              <div className="mb-0">
                <label htmlFor="responsavel" className="form-label">
                  Responsável
                </label>
                <select
                  id="responsavel"
                  className="form-select"
                  value={selecionado}
                  onChange={(e) => setSelecionado(e.target.value)}
                  disabled={salvando}
                >
                  <option value="">Selecione...</option>
                  {responsaveis.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} ({r.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmar}
              disabled={salvando || carregandoLista}
            >
              {salvando && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              Atribuir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}