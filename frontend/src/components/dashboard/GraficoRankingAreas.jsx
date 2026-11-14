import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';

// Paleta pastel para as barras
const CORES = ['#8BB8E8', '#A8E6CF', '#FFE082', '#F28B82', '#D1C4E9'];

export default function GraficoRankingAreas({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <div className="card h-100">
        <div className="card-body d-flex flex-column justify-content-center align-items-center">
          <i className="bi bi-bar-chart text-secondary mb-2" style={{ fontSize: '2rem' }} aria-hidden="true"></i>
          <p className="text-secondary mb-0">Sem reservas registradas ainda.</p>
        </div>
      </div>
    );
  }

  // Pega as Top 5 áreas
  const dadosFormatados = dados.slice(0, 5).map(d => ({
    name: d.nome,
    total: Number(d.total)
  })).reverse(); // Reverte para a maior barra ficar no topo (o Recharts desenha de baixo pra cima)

  return (
    <div className="card h-100">
      <div className="card-body">
        <h2 className="h5 mb-3">
          <i className="bi bi-trophy text-warning me-2" aria-hidden="true"></i>
          Top 5 Áreas Mais Reservadas
        </h2>
        
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={dadosFormatados}
              layout="vertical" // Define o layout horizontal
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#495057' }}
                width={110} // Largura fixa para os nomes das áreas
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                formatter={(value) => [`${value} reservas`, 'Total']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              <Bar 
                dataKey="total" 
                radius={[0, 4, 4, 0]} // Bordas arredondadas só do lado direito
                barSize={24}
              >
                {dadosFormatados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
                <LabelList dataKey="total" position="right" style={{ fontSize: 12, fill: '#6c757d' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}