import { useEffect, useState } from 'react';
import { formatarMoeda } from '../../services/lancamentoService';

export default function RegistrarPagamentoModal({ aberto, lancamento, onFechar, onConfirmar }) {
  const [dataPagamento, setDataPagamento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      // default: hoje (formato YYYY-MM-DD)
      const hoje = new Date().toISOString().slice(0, 10);
      setDataPagamento(hoje);
      setErro('');
    }
  }, [aberto]);

  const handleConfirmar = async () => {
    if (!dataPagamento) return setErro('Informe a data do pagamento.');
    setErro('');
    setSalvando(true);
    try {
      await onConfirmar(lancamento.id, dataPagamento);
      onFechar();
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível registrar o pagamento.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pagamento-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5" id="modal-pagamento-titulo">
              Registrar pagamento
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

            <p className="small text-secondary mb-1">Lançamento:</p>
            <p className="fw-semibold mb-3">{lancamento?.descricao}</p>
            <p className="mb-3">
              Valor: <strong>{formatarMoeda(lancamento?.valor)}</strong>
            </p>

            <label htmlFor="dataPagamento" className="form-label">
              Data do pagamento <span className="text-danger">*</span>
            </label>
            <input
              id="dataPagamento"
              type="date"
              className="form-control"
              value={dataPagamento}
              max={hoje}
              onChange={(e) => setDataPagamento(e.target.value)}
              required
              aria-required="true"
              disabled={salvando}
            />
            <div className="form-text">A data deve ser hoje ou no passado.</div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onFechar}
              disabled={salvando}
            >Cancelar</button>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleConfirmar}
              disabled={salvando}
            >
              {salvando && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              Confirmar pagamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}