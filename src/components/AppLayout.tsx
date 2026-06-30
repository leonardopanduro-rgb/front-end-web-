import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppButton } from './AppButton';
import { Breadcrumbs } from './Breadcrumbs';

export const AppLayout = () => {
  const { user, mode, setMode, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (!window.confirm('Seguro que quieres cerrar sesion?')) return;
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
          <NavLink to="/publish-trip">Publicar viaje</NavLink>
          <NavLink to="/requests">Mis solicitudes</NavLink>
          <NavLink to="/driver-panel">Panel conductor</NavLink>
          <NavLink to="/vehicles">Vehiculos</NavLink>
          <NavLink to="/profile">Perfil</NavLink>
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <strong>{user?.name} {user?.lastName}</strong>
            <span>{user?.career?.replace(/_/g, ' ')}</span>
          </div>
          <div className="topbar-actions">
            <div className="segmented compact">
              <button className={mode === 'passenger' ? 'active' : ''} onClick={() => void setMode('passenger')}>Pasajero</button>
              <button className={mode === 'driver' ? 'active' : ''} onClick={() => void setMode('driver')}>Conductor</button>
            </div>
            <AppButton variant="ghost" onClick={handleLogout}>Salir</AppButton>
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
