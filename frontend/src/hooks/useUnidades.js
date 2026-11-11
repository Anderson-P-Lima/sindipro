import { useCallback, useEffect, useState } from 'react';
import { unidadeService, blocoService } from '../services/unidadeService';

export function useUnidades() {
  const [unidades, setUnidades] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroBlocoId, setFiltroBlocoId] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [listaUnidades, listaBlocos] = await Promise.all([
        unidadeService.listar({
          blocoId: filtroBlocoId || undefined,
          ativo: filtroAtivo,
        }),
        blocoService.listar(),
      ]);
      setUnidades(listaUnidades);
      setBlocos(listaBlocos);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar as unidades.');
    } finally {
      setLoading(false);
    }
  }, [filtroBlocoId, filtroAtivo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    unidades,
    blocos,
    loading,
    erro,
    filtroBlocoId,
    setFiltroBlocoId,
    filtroAtivo,
    setFiltroAtivo,
    recarregar: carregar,
  };
}