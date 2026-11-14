import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatarMoeda } from '../../services/dashboardService';

// Paleta Pastel para as fatias
const CORES = ['#F28B82', '#8BB8E8', '#A8E6CF', '#FFE082', '#D1C4E9', '#FFCC80', '#80CBC4'];

export default function GraficoDespesas({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <div className="card h-100">
        <div className="card-body d-flex flex-column justify-content-center align-items-center">
          <i className="bi bi-pie-chart text-secondary mb-2" style={{ fontSize: '2rem' }} aria-hidden="true"></i>
          <p className="text-secondary mb-0">Sem despesas pagas registradas.</p>
        </div>
      </div>
    );
  }

  // Recharts precisa de objetos com chaves específicas
  const dadosFormatados = dados.map(d => ({
    name: d.categoria.replace(/_/g, ' '), // Troca underline por espaço
    value: Number(d.total)
  }));

  const totalGeral = dadosFormatados.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="card h-100">
      <div className="card-body">
        <h2 className="h5 mb-3">
          <i className="bi bi-pie-chart text-danger me-2" aria-hidden="true"></i>
          Onde estamos gastando?
        </h2>
        
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={dadosFormatados}
                cx="50%"
                cy="50%"
                innerRadius={60} // Cria o buraco da rosca
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {dadosFormatados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatarMoeda(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-center mt-3 border-top pt-3">
          <small className="text-secondary d-block">Total de Despesas Pagas</small>
          <strong className="h4 mb-0 text-danger">{formatarMoeda(totalGeral)}</strong>
        </div>
      </div>
    </div>
  );
}