import { ModuleIcon } from './ModuleSidebar';
import useFullscreen from '../hooks/useFullscreen';

export default function FullscreenButton() {
  const { isFullscreen, isSupported, toggleFullscreen, error } = useFullscreen();
  const label = isFullscreen ? 'Sair da tela cheia' : 'Ativar tela cheia';

  return (
    <button
      className="theme-toggle theme-toggle--compact"
      type="button"
      onClick={toggleFullscreen}
      disabled={!isSupported}
      aria-label={label}
      aria-pressed={isFullscreen}
      title={error || (isSupported ? label : 'Tela cheia indisponível neste navegador')}
    >
      <ModuleIcon name={isFullscreen ? 'minimize' : 'maximize'} size={19} />
    </button>
  );
}
