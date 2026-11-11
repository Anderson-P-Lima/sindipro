import api from './api';

export const usuarioService = {
  async listar({ page = 0, size = 15, role, ativo } = {}) {
    const params = { page, size, sort: 'nome,asc' };
    if (role) params.role = role;
    if (ativo !== undefined && ativo !== null) params.ativo = ativo;
    const { data } = await api.get('/usuarios', { params });
    return data;
  },

  async buscar(id) {
    const { data } = await api.get(`/usuarios/${id}`);
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/usuarios', payload);
    return data;
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/usuarios/${id}`, payload);
    return data;
  },

  async alterarStatus(id, ativo) {
    const { data } = await api.patch(`/usuarios/${id}/status`, null, {
      params: { ativo },
    });
    return data;
  },

  async deletar(id) {
    await api.delete(`/usuarios/${id}`);
  },
};

export const ROLES = {
  ADMIN_SISTEMA: { rotulo: 'Admin',    cor: 'dark'    },
  SINDICO:       { rotulo: 'Síndico',  cor: 'primary' },
  MORADOR:       { rotulo: 'Morador',  cor: 'success' },
  PORTEIRO:      { rotulo: 'Porteiro', cor: 'info'    },
  ZELADOR:       { rotulo: 'Zelador',  cor: 'warning' },
};

export function roleInfo(role) {
  return ROLES[role] || { rotulo: role, cor: 'secondary' };
}

export function formatarDataHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}