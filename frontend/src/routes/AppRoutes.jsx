import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import PoliticaPrivacidade from '../pages/PoliticaPrivacidade';
import TermosUso from '../pages/TermosUso';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import Comunicados from '../pages/Comunicados';
import AreasComuns from '../pages/AreasComuns';
import Ocorrencias from '../pages/Ocorrencias';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/privacidade" element={<PoliticaPrivacidade />} />
      <Route path="/termos" element={<TermosUso />} />

      {/* Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/comunicados" element={<Comunicados />} />
          <Route path="/areas-comuns" element={<AreasComuns />} />
          <Route path="/ocorrencias" element={<Ocorrencias />} />
        </Route>
      </Route>

      {/* Redirecionamentos */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}