import React from 'react';
import HopLogo from './HopLogo';
import { resetOperationState } from '../data/operationStore';
import { navigateTo } from '../utils/navigation';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HOP ErrorBoundary capturou um erro de execução:', error, errorInfo);
  }

  handleResetAndReload = () => {
    try {
      resetOperationState();
    } catch (e) {
      console.error('Falha ao resetar operationState:', e);
      try {
        window.localStorage.clear();
      } catch {
        /* storage indisponível */
      }
    }
    navigateTo('/');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          className="d-flex align-items-center justify-content-center min-vh-100 p-4"
          style={{ backgroundColor: 'var(--color-background, #0c1017)', color: 'var(--color-text, #f0f4f8)' }}
        >
          <div
            className="app-card text-center p-4 p-md-5 shadow-lg border"
            style={{ maxWidth: '520px', borderRadius: 'var(--radius-lg, 16px)' }}
          >
            <div className="mb-4 d-flex justify-content-center">
              <HopLogo size="home" />
            </div>
            <h1 className="fs-4 fw-bold mb-2">Intercorrência na Demonstração</h1>
            <p className="text-secondary mb-4" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
              Detectamos uma inconsistência nos dados de sessão temporários. Para garantir uma apresentação estável, você pode restaurar o estado limpo da demonstração com um clique.
            </p>
            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="btn btn-primary btn-lg fw-bold w-100"
                onClick={this.handleResetAndReload}
              >
                Restaurar dados e reiniciar
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 mt-2"
                onClick={() => {
                  navigateTo('/');
                  window.location.reload();
                }}
              >
                Voltar à página inicial
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
