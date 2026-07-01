import { Link } from 'react-router-dom';

export const WelcomePage = () => (
  <main className="public-page welcome-page">
    <section className="welcome-panel">
      <div className="brand-large">
        <h1>Carpool UTEC</h1>
        <p>Viajes compartidos entre estudiantes UTEC.</p>
      </div>
      <div className="welcome-car-icon" aria-hidden="true">
        <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
          <path d="M3 11h18a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1" />
          <path d="M4 17H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1" />
          <path d="M7 17h10" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      </div>
      <div className="public-actions">
        <Link className="btn btn-primary" to="/login">Iniciar sesion</Link>
        <Link className="btn btn-outline light" to="/register">Crear cuenta</Link>
      </div>
    </section>
  </main>
);
