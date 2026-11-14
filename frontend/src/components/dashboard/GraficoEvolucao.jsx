import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatarMoeda } from '../../services/dashboardService';

export default function GraficoEvolucao({ dados }) {
  if (!dados || dados.length === 0) {
    return null; // Se não houver dados, não renderiza nada
  }

  // Formata o eixo Y para mostrar valores resumidos (ex: 1500 -> 1.5k)
  const formatarEixoY = (value) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value;
  };

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">
            <i className="bi bi-graph-up-arrow text-primary me-2" aria-hidden="true"></i>
            Evolução Financeira (Últimos 6 meses)
          </h2>
        </div>
        
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart
              data={dados}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Gradiente para Receitas (Verde Pastel) */}
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A8E6CF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#A8E6CF" stopOpacity={0}/>
                </linearGradient>
                {/* Gradiente para Despesas (Vermelho Pastel) */}
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F28B82" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F28B82" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
              
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12, fill: '#6c757d' }} 
                tickLine={false} 
                axisLine={false} 
              />
              
              <YAxis 
                tickFormatter={formatarEixoY}
                tick={{ fontSize: 12, fill: '#6c757d' }} 
                tickLine={false} 
                axisLine={false}
                width={45}
              />
              
              <Tooltip 
                formatter={(value) => formatarMoeda(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />

              {/* Linha de Despesas primeiro para ficar atrás da de receitas */}
              <Area 
                type="monotone" 
                name="Despesas"
                dataKey="despesas" 
                stroke="#C76B6B" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDespesas)" 
              />
              <Area 
                type="monotone" 
                name="Receitas"
                dataKey="receitas" 
                stroke="#5A9B7C" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReceitas)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}