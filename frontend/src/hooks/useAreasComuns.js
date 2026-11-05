import { useCallback, useEffect, useState } from 'react';
import { areaComumService } from '../services/areaComumService';

export function useAreasComuns() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState(true); // padrão: só ativas

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await areaComumService.listar({ ativo: filtroAtivo });
      setAreas(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar as áreas comuns.');
    } finally {
      setLoading(false);
    }
  }, [filtroAtivo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    areas,
    loading,
    erro,
    filtroAtivo,
    setFiltroAtivo,
    recarregar: carregar,
  };
}