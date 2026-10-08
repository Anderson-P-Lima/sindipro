import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
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
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/dashboard">
          <i className="bi bi-building me-2" aria-hidden="true"></i>
          <span>SindiPro</span>
        </Link>

        <div className="d-flex align-items-center gap-3">
          <span className="text-white d-none d-md-inline">
            <i className="bi bi-person-circle me-1" aria-hidden="true"></i>
            <span className="me-2">{user?.nome}</span>
            <span className="badge bg-light text-primary">
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