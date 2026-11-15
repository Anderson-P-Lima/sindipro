import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

const CORES = ['#8BB8E8', '#A8E6CF', '#FFE082', '#F28B82', '#D1C4E9'];

export default function GraficoRankingAreas({ dados }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const corTexto = isDark ? '#adb5bd' : '#495057';
  const corFundoTooltip = isDark ? '#343a40' : '#ffffff';

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

  const dadosFormatados = dados.slice(0, 5).map(d => ({
    name: d.nome,
    total: Number(d.total)
  })).reverse();

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
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: corTexto }} 
                width={110} 
              />
              
              {/* TOOLTIP ATUALIZADO AQUI */}
              <Tooltip 
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                formatter={(value) => [`${value} reservas`, 'Total']}
                itemStyle={{ color: corTexto, fontWeight: 'bold' }} /* <-- CORREÇÃO AQUI */
                contentStyle={{ 
                  backgroundColor: corFundoTooltip, 
                  color: corTexto,
                  borderRadius: '8px', 
                  border: isDark ? '1px solid #495057' : 'none', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                }}
              />
              
              <Bar 
                dataKey="total" 
                radius={[0, 4, 4, 0]} 
                barSize={24}
              >
                {dadosFormatados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
                
                <LabelList 
                  dataKey="total" 
                  position="right" 
                  style={{ fontSize: 12, fill: corTexto, fontWeight: 'bold' }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}