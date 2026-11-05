import api from './api';

export const comunicadoService = {
  async listar({ page = 0, size = 12, categoria } = {}) {
    const params = { page, size };
    if (categoria) params.categoria = categoria;
    const { data } = await api.get('/comunicados', { params });
    return data;
  },

  async buscar(id) {
    const { data } = await api.get(`/comunicados/${id}`);
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/comunicados', payload);
    return data;
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/comunicados/${id}`, payload);
    return data;
  },

  async deletar(id) {
    await api.delete(`/comunicados/${id}`);
  },
};

export const CATEGORIAS = [
  { valor: 'GERAL',       rotulo: 'Geral',        cor: 'secondary' },
  { valor: 'MANUTENCAO',  rotulo: 'Manutenção',   cor: 'warning'   },
  { valor: 'SEGURANCA',   rotulo: 'Segurança',    cor: 'danger'    },
  { valor: 'EVENTO',      rotulo: 'Evento',       cor: 'info'      },
  { valor: 'FINANCEIRO',  rotulo: 'Financeiro',   cor: 'success'   },
  { valor: 'URGENTE',     rotulo: 'Urgente',      cor: 'danger'    },
];

export function categoriaInfo(valor) {
  return CATEGORIAS.find((c) => c.valor === valor) || { rotulo: valor, cor: 'secondary' };
}