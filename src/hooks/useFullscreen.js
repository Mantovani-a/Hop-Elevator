import { useCallback, useEffect, useState } from 'react';

export default function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [error, setError] = useState('');
  const isSupported = typeof document.documentElement.requestFullscreen === 'function'
    && typeof document.exitFullscreen === 'function';

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setError('');
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!isSupported) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setError('Não foi possível alterar o modo de tela cheia neste dispositivo.');
    }
  }, [isSupported]);

  return { isFullscreen, isSupported, toggleFullscreen, error };
}
