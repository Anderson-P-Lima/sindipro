import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await dashboardService.resumo();
      setData(resultado);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { data, loading, erro, atualizadoEm, recarregar: carregar };
}