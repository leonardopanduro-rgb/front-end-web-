import { Link } from 'react-router-dom';

export const WelcomePage = () => (
  <main className="public-page welcome-page">
    <section className="welcome-panel">
      <div className="brand-large">
        <h1>Carpool UTEC</h1>
        <p>Viajes compartidos entre estudiantes UTEC.</p>
      </div>
      <div className="route-chips">
        <span>Barranco {'->'} Campus</span>
        <span>Miraflores {'->'} UTEC</span>
        <span>Surco {'->'} Campus</span>
      </div>
      <p className="muted centered">Desde Barranco, Miraflores, Surco, San Isidro y mas.</p>
      <div className="public-actions">
        <Link className="btn btn-primary" to="/login">Iniciar sesion</Link>
        <Link className="btn btn-outline light" to="/register">Crear cuenta</Link>
      </div>
    </section>
  </main>
);
