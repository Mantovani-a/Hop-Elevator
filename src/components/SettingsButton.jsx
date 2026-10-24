import { useState } from 'react';
import Modal from './Modal';
import { ModuleIcon } from './ModuleSidebar';
import ThemeToggle from './ThemeToggle';
import useFullscreen from '../hooks/useFullscreen';
import { navigateTo } from '../utils/navigation';

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { isFullscreen, isSupported, toggleFullscreen, error } = useFullscreen();

  return (
    <>
      <button
        className="module-demo-link module-demo-link--icon-only"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Configurações"
        aria-haspopup="dialog"
        title="Configurações"
      >
        <ModuleIcon name="settings" size={18} />
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Configurações" titleId="hop-settings-title" className="hop-settings-modal">
        <div className="hop-settings-modal__options">
          <div className="hop-settings-modal__option">
            <div><strong>Tela cheia</strong><small>Exibir o HOP em toda a tela</small></div>
            <button className="theme-toggle" type="button" onClick={toggleFullscreen} disabled={!isSupported} aria-pressed={isFullscreen}>
              <ModuleIcon name={isFullscreen ? 'minimize' : 'maximize'} size={18} />
              <span>{isSupported ? (isFullscreen ? 'Desativar' : 'Ativar') : 'Indisponível'}</span>
            </button>
          </div>
          {error && <p className="hop-settings-modal__error" role="status">{error}</p>}
          <div className="hop-settings-modal__option">
            <div><strong>Aparência</strong><small>Preferência de tema do HOP</small></div>
            <ThemeToggle />
          </div>
          <div className="hop-settings-modal__navigation">
            <div><strong>Voltar ao Painel de Demonstração</strong><small>Retornar à seleção das experiências</small></div>
            <button className="theme-toggle" type="button" onClick={() => { setOpen(false); navigateTo('/'); }}>
              <ModuleIcon name="home" size={18} />
              <span>Voltar para o Painel de Demonstração</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
