export const LoadingState = ({ message = 'Cargando...' }: { message?: string }) => (
  <div className="state state-loading" role="status">
    <span className="spinner" />
    <span>{message}</span>
  </div>
);
