import { useEffect } from 'react';

export function useWakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock ativo!');
        }
      } catch (err) {
        console.error('Wake Lock falhou:', err);
      }
    };

    requestLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
