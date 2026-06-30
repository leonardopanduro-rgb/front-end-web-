import { Component, ErrorInfo, ReactNode } from 'react';
import { AppButton } from './AppButton';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="state state-error">
          <strong>Algo salio mal</strong>
          <span>Recarga la pagina para intentarlo nuevamente.</span>
          <AppButton onClick={() => window.location.reload()}>Recargar</AppButton>
        </div>
      );
    }

    return this.props.children;
  }
}
