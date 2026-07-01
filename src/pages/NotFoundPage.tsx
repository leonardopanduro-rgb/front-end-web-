import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <main className="public-page">
    <section className="center-card">
      <h1>404</h1>
      <p>La pagina que buscas no existe o fue movida.</p>
      <div className="stack-actions">
        <Link className="btn btn-primary" to="/home">Ir al inicio</Link>
      </div>
    </section>
  </main>
);
