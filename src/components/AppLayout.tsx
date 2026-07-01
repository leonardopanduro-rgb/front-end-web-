import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUiFeedback } from '../hooks/useUiFeedback';
import { Breadcrumbs } from './Breadcrumbs';

export const AppLayout = () => {
  const { user, mode, logout } = useAuth();
  const { confirm } = useUiFeedback();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Cerrar sesion', message: 'Seguro que quieres cerrar sesion?', confirmLabel: 'Cerrar sesion', danger: true });
    if (!ok) return;
    await logout();
    navigate('/');
  };

  const goHome = () => {
    setIsMenuOpen(false);
    navigate('/home');
  };

  return (
    <div className={`app-shell ${isMenuOpen ? 'menu-open' : ''}`}>
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <button
        className="sidebar-backdrop"
        type="button"
        aria-label="Cerrar menu"
        onClick={() => setIsMenuOpen(false)}
      />

      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand" onClick={goHome} role="button" tabIndex={0}>
          <span className="brand-mark">CU</span>
          <div>
            <strong>Carpool UTEC</strong>
            <span>{mode === 'driver' ? 'Modo conductor' : 'Modo pasajero'}</span>
          </div>
        </div>
        <nav className="nav" onClick={() => setIsMenuOpen(false)}>
          <NavLink to="/home">Inicio</NavLink>
          <NavLink to="/search-trips">Buscar viajes</NavLink>
          <NavLink to="/requests">Mis solicitudes</NavLink>
          {mode === 'driver' ? <NavLink to="/publish-trip">Publicar viaje</NavLink> : null}
          {mode === 'driver' ? <NavLink to="/driver-panel">Panel conductor</NavLink> : null}
          {mode === 'driver' ? <NavLink to="/vehicles">Vehiculos</NavLink> : null}
          <NavLink to="/profiles">Perfiles</NavLink>
          <NavLink to="/profile">Perfil</NavLink>
        </nav>
        <button className="sidebar-logout" type="button" aria-label="Cerrar sesion" title="Cerrar sesion" onClick={() => void handleLogout()}>
          <span className="logout-power" aria-hidden="true" />
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <strong>{user?.name} {user?.lastName}</strong>
            <span>{user?.career?.replace(/_/g, ' ')}</span>
          </div>
        </header>
        <main className="page-frame">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
