import api from './api';

export const lancamentoService = {
  async listar({ page = 0, size = 15, tipo, status, unidadeId } = {}) {
    const params = { page, size, sort: 'dataVencimento,desc' };
    if (tipo) params.tipo = tipo;
    if (status) params.status = status;
    if (unidadeId) params.unidadeId = unidadeId;
    const { data } = await api.get('/lancamentos', { params });
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/lancamentos', payload);
    return data;
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/lancamentos/${id}`, payload);
    return data;
  },

  async registrarPagamento(id, dataPagamento) {
    const { data } = await api.patch(`/lancamentos/${id}/pagamento`, { dataPagamento });
    return data;
  },

  async cancelar(id) {
    const { data } = await api.patch(`/lancamentos/${id}/cancelar`);
    return data;
  },

  async deletar(id) {
    await api.delete(`/lancamentos/${id}`);
  },
};

export const TIPOS = {
  RECEITA: { rotulo: 'Receita', cor: 'success' },
  DESPESA: { rotulo: 'Despesa', cor: 'danger' },
};

export const STATUS_FIN = {
  PENDENTE:  { rotulo: 'Pendente',  cor: 'warning'   },
  PAGO:      { rotulo: 'Pago',      cor: 'success'   },
  ATRASADO:  { rotulo: 'Atrasado',  cor: 'danger'    },
  CANCELADO: { rotulo: 'Cancelado', cor: 'secondary' },
};

export function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarData(iso) {
  if (!iso) return '—';
  // Se vier como "2026-12-25" (LocalDate), formata direto
  if (iso.length === 10) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
  return new Date(iso).toLocaleDateString('pt-BR');
}