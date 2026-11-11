import { useEffect, useRef, useState } from 'react';
import { TIPOS } from '../../services/lancamentoService';
import api from '../../services/api';

const formVazio = {
  tipo: 'DESPESA',
  categoria: '',
  descricao: '',
  valor: '',
  dataVencimento: '',
  unidadeId: '',
};

const CATEGORIAS_SUGERIDAS = [
  'TAXA_CONDOMINIO', 'TAXA_EXTRA', 'ALUGUEL_AREA',
  'MANUTENCAO', 'UTILIDADES', 'SEGURANCA', 'LIMPEZA', 'OUTROS',
];

export default function LancamentoFormModal({ aberto, lancamento, onFechar, onSalvar }) {
  const [form, setForm] = useState(formVazio);
  const [unidades, setUnidades] = useState([]);
  const [carregandoUnidades, setCarregandoUnidades] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const primeiroRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setForm(
      lancamento
        ? {
            tipo: lancamento.tipo,
            categoria: lancamento.categoria,
            descricao: lancamento.descricao,
            valor: Number(lancamento.valor).toFixed(2),
            dataVencimento: lancamento.dataVencimento,
            unidadeId: lancamento.unidadeId ?? '',
          }
        : formVazio
    );
    setErro('');
    setCarregandoUnidades(true);
    api.get('/unidades', { params: { ativo: true } })
      .then((r) => setUnidades(r.data))
      .catch(() => {})
      .finally(() => {
        setCarregandoUnidades(false);
        setTimeout(() => primeiroRef.current?.focus(), 100);
      });
  }, [aberto, lancamento]);

  const handleChange = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!form.categoria.trim()) return setErro('Informe a categoria.');
    if (!form.descricao.trim()) return setErro('Informe a descrição.');
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor deve ser maior que zero.');
    if (!form.dataVencimento) return setErro('Informe a data de vencimento.');

    setSalvando(true);
    try {
      const payload = {
        tipo: form.tipo,
        categoria: form.categoria.trim().toUpperCase().replace(/\s+/g, '_'),
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        dataVencimento: form.dataVencimento,
        unidadeId: form.unidadeId ? Number(form.unidadeId) : null,
      };
      await onSalvar(payload);
      onFechar();
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.details?.join(', ')
        || 'Não foi possível salvar o lançamento.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;
  const modoEdicao = Boolean(lancamento);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-lancamento-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-lancamento-titulo">
                {modoEdicao ? 'Editar lançamento' : 'Novo lançamento'}
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

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label htmlFor="tipo" className="form-label">
                    Tipo <span className="text-danger">*</span>
                  </label>
                  <select
                    ref={primeiroRef}
                    id="tipo"
                    className="form-select"
                    value={form.tipo}
                    onChange={handleChange('tipo')}
                    required
                    aria-required="true"
                    disabled={salvando}
                  >
                    {Object.entries(TIPOS).map(([v, info]) => (
                      <option key={v} value={v}>{info.rotulo}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="valor" className="form-label">
                    Valor (R$) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    value={form.valor}
                    onChange={handleChange('valor')}
                    required
                    aria-required="true"
                    disabled={salvando}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="dataVencimento" className="form-label">
                    Vencimento <span className="text-danger">*</span>
                  </label>
                  <input
                    id="dataVencimento"
                    type="date"
                    className="form-control"
                    value={form.dataVencimento}
                    onChange={handleChange('dataVencimento')}
                    required
                    aria-required="true"
                    disabled={salvando}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="categoria" className="form-label">
                  Categoria <span className="text-danger">*</span>
                </label>
                <input
                  id="categoria"
                  type="text"
                  className="form-control"
                  list="categorias-sugeridas"
                  value={form.categoria}
                  onChange={handleChange('categoria')}
                  placeholder="Ex.: MANUTENCAO"
                  maxLength={40}
                  required
                  aria-required="true"
                  disabled={salvando}
                />
                <datalist id="categorias-sugeridas">
                  {CATEGORIAS_SUGERIDAS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="mb-3">
                <label htmlFor="descricao" className="form-label">
                  Descrição <span className="text-danger">*</span>
                </label>
                <input
                  id="descricao"
                  type="text"
                  className="form-control"
                  value={form.descricao}
                  onChange={handleChange('descricao')}
                  maxLength={200}
                  required
                  aria-required="true"
                  disabled={salvando}
                />
              </div>

              <div className="mb-0">
                <label htmlFor="unidadeId" className="form-label">
                  Unidade (opcional)
                </label>
                <select
                  id="unidadeId"
                  className="form-select"
                  value={form.unidadeId}
                  onChange={handleChange('unidadeId')}
                  disabled={salvando || carregandoUnidades}
                >
                  <option value="">— Lançamento geral do condomínio —</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.blocoNome ? `${u.blocoNome} — ` : ''}Apto {u.numero}
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Deixe em branco para despesas/receitas globais do condomínio.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onFechar}
                disabled={salvando}
              >Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {modoEdicao ? 'Salvar alterações' : 'Criar lançamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}