import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const labelRole = {
    ADMIN_SISTEMA: 'Admin',
    SINDICO: 'Síndico',
    MORADOR: 'Morador',
    PORTEIRO: 'Porteiro',
    ZELADOR: 'Zelador',
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-brand shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/dashboard">
          <i className="bi bi-building me-2" aria-hidden="true"></i>
          <span>SindiPro</span>
        </Link>

        <div className="d-flex align-items-center gap-3">
          {/* Botão de tema */}
          <button
            type="button"
            className="btn btn-outline-light btn-sm border-0"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          >
            <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}`} aria-hidden="true"></i>
          </button>
          
          <span className="text-white d-none d-md-inline">
            <i className="bi bi-person-circle me-1" aria-hidden="true"></i>
            <span className="me-2">{user?.nome}</span>
            <span className="badge bg-body-tertiary text-brand">
              {labelRole[user?.role] || user?.role}
            </span>
          </span>
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={handleLogout}
            aria-label="Sair do sistema"
          >
            <i className="bi bi-box-arrow-right me-1" aria-hidden="true"></i>
            <span className="d-none d-sm-inline">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}