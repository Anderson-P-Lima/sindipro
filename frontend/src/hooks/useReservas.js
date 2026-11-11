import { useCallback, useEffect, useState } from 'react';
import { reservaService } from '../services/reservaService';

export function useReservas() {
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

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await reservaService.listar({
        page,
        size: 10,
        status: status || undefined,
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar as reservas.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPage(0);
  }, [status]);

  return {
    data,
    loading,
    erro,
    page,
    setPage,
    status,
    setStatus,
    recarregar: carregar,
  };
}