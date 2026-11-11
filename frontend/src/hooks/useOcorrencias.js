import { useCallback, useEffect, useState } from 'react';
import { ocorrenciaService } from '../services/ocorrenciaService';

export function useOcorrencias() {
  const [data, setData] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [prioridade, setPrioridade] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await ocorrenciaService.listar({
        page,
        size: 10,
        status: status || undefined,
        prioridade: prioridade || undefined,
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar as ocorrências.');
    } finally {
      setLoading(false);
    }
  }, [page, status, prioridade]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Reseta a página quando muda filtro
  useEffect(() => {
    setPage(0);
  }, [status, prioridade]);

  return {
    data,
    loading,
    erro,
    page,
    setPage,
    status,
    setStatus,
    prioridade,
    setPrioridade,
    recarregar: carregar,
  };
}