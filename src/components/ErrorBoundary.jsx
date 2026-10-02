import React from 'react';
import HopLogo from './HopLogo';
import { resetOperationState } from '../data/operationStore';
import { navigateTo } from '../utils/navigation';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isLoop: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HOP ErrorBoundary capturou um erro:', error, errorInfo);

    try {
      const now = Date.now();
      const lastAttempt = Number(window.sessionStorage.getItem('hop_auto_recovery_timestamp') || 0);

      // Se não houve tentativa de auto-cura nos últimos 6 segundos, tenta recuperar silenciosamente
      if (!lastAttempt || now - lastAttempt > 6000) {
        window.sessionStorage.setItem('hop_auto_recovery_timestamp', now.toString());
        console.warn('HOP: Executando auto-recuperação silenciosa do estado operacional...');
        try {
          resetOperationState();
        } catch {
          try { window.localStorage.removeItem('hop-shared-operation-v5'); } catch { /* noop */ }
        }
        window.location.reload();
        return;
      }

      // Se já tentou recuperar recentemente e falhou de novo, é um bug real de componente (não inconsistência de storage)
      this.setState({ isLoop: true });
    } catch (e) {
      console.error('Falha no mecanismo de auto-recovery do ErrorBoundary:', e);
      this.setState({ isLoop: true });
    }
  }

  handleManualReset = () => {
    try {
      resetOperationState();
      window.sessionStorage.removeItem('hop_auto_recovery_timestamp');
    } catch {
      try { window.localStorage.clear(); } catch { /* noop */ }
    }
    navigateTo('/');
    window.location.reload();
  };

  handleReload = () => {
    window.sessionStorage.removeItem('hop_auto_recovery_timestamp');
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
            style={{ maxWidth: '540px', borderRadius: 'var(--radius-lg, 16px)' }}
          >
            <div className="mb-4 d-flex justify-content-center">
              <HopLogo size="home" />
            </div>
            <h1 className="fs-4 fw-bold mb-2">Intercorrência na Aplicação</h1>
            <p className="text-secondary mb-3" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
              Ocorreu uma falha inesperada na renderização da interface.
            </p>

            {this.state.error?.message && (
              <div
                className="text-start p-3 mb-4 rounded bg-dark border border-secondary font-monospace"
                style={{ fontSize: '0.8rem', color: '#ff7b72', overflowX: 'auto', maxHeight: '120px' }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="btn btn-primary fw-bold w-100 py-2"
                onClick={this.handleReload}
              >
                Recarregar página
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  window.sessionStorage.removeItem('hop_auto_recovery_timestamp');
                  navigateTo('/');
                  window.location.reload();
                }}
              >
                Voltar à página inicial
              </button>
              <button
                type="button"
                className="btn btn-link text-secondary text-decoration-none btn-sm w-100 mt-2"
                style={{ fontSize: '0.8rem' }}
                onClick={this.handleManualReset}
              >
                Limpar cache e restaurar demonstração limpa
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
