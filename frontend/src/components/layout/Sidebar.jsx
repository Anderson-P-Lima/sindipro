import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { to: '/dashboard',   icon: 'bi-speedometer2',   label: 'Dashboard',   roles: null },
  { to: '/comunicados', icon: 'bi-megaphone',      label: 'Comunicados', roles: null },
  { to: '/reservas',    icon: 'bi-calendar-check', label: 'Reservas',    roles: null },
  { to: '/ocorrencias', icon: 'bi-tools',          label: 'Ocorrências', roles: null },
  { to: '/financeiro',  icon: 'bi-cash-coin',      label: 'Financeiro',  roles: ['ADMIN_SISTEMA', 'SINDICO'] },
  { to: '/unidades',    icon: 'bi-house-door',     label: 'Unidades',    roles: ['ADMIN_SISTEMA', 'SINDICO'] },
  { to: '/usuarios',    icon: 'bi-people',         label: 'Usuários',    roles: ['ADMIN_SISTEMA'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const visiveis = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside
      className="bg-white border-end d-none d-md-block"
      style={{ width: 240, minHeight: 'calc(100vh - 56px)' }}
    >
      <nav className="nav flex-column p-3" aria-label="Menu principal">
        {visiveis.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link rounded mb-1 d-flex align-items-center ${
                isActive ? 'active bg-primary text-white' : 'text-dark'
              }`
            }
          >
            <i className={`bi ${item.icon} me-2`} aria-hidden="true"></i>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}