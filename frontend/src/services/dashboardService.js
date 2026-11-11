import api from './api';

export const dashboardService = {
  async resumo() {
    const { data } = await api.get('/dashboard/resumo');
    return data;
  },
};

export function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}