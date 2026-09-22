let sharedAudioContext = null;

const getAudioContext = () => {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedAudioContext = new AudioContextClass();
  return sharedAudioContext;
};

export const playNotificationSound = () => {
  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }

    const start = context.currentTime;
    const signature = [523.25, 659.25, 783.99];

    signature.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const pulseStart = start + index * 0.105;
      const pulseEnd = pulseStart + 0.085;
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, pulseStart);
      gain.gain.setValueAtTime(0.0001, pulseStart);
      gain.gain.exponentialRampToValueAtTime(index === 2 ? 0.038 : 0.03, pulseStart + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(pulseStart);
      oscillator.stop(pulseEnd);
    });
  } catch {
    // O navegador pode bloquear áudio antes da primeira interação; o aviso visual permanece ativo.
  }
};
