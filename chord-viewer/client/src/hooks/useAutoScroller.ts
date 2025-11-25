import { useRef, useEffect } from 'react';

// Hook de intervalo customizado para scroll suave
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), 16); // ~60fps
      return () => clearInterval(id);
    }
  }, [delay]);
}

interface AutoScrollerOptions {
  isPlaying: boolean;
  scrollSpeed: number;
}

export function useAutoScroller(scrollContainerRef: React.RefObject<HTMLDivElement | null>, { isPlaying, scrollSpeed }: AutoScrollerOptions) {
  useInterval(() => {
    if (isPlaying && scrollSpeed > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += scrollSpeed;
    }
  }, isPlaying ? 16 : null); // Ativa o intervalo apenas quando isPlaying é true
}
