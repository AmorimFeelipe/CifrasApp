import { useRef, useEffect, useCallback } from "react";

interface AutoScrollerOptions {
  isPlaying: boolean;
  scrollSpeed: number;
}

export function useAutoScroller(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  { isPlaying, scrollSpeed }: AutoScrollerOptions
) {
  const requestRef = useRef<number>(0);
  const fractionalPos = useRef(0);
  const lastTimestamp = useRef<number>(0);

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimestamp.current) lastTimestamp.current = timestamp;

      // Calcula o tempo que passou desde o último quadro (em segundos)
      // Isso garante que a velocidade seja igual em monitores 60Hz, 120Hz ou 144Hz
      const deltaTime = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      if (scrollContainerRef.current && scrollSpeed > 0) {
        const element = scrollContainerRef.current;

        // Detecção de intervenção manual:
        // Se a posição real mudou muito (usuário tocou na tela), atualizamos nossa referência
        if (Math.abs(element.scrollTop - fractionalPos.current) > 10) {
          fractionalPos.current = element.scrollTop;
        }

        // --- AJUSTE DE VELOCIDADE ---
        // Definimos uma base: Velocidade 1.0 = 30 pixels por segundo.
        // É lento o suficiente para ler, mas constante.
        const pixelsPerSecond = 30 * scrollSpeed;

        fractionalPos.current += pixelsPerSecond * deltaTime;
        element.scrollTop = fractionalPos.current;
      }

      requestRef.current = requestAnimationFrame(animate);
    },
    [scrollSpeed]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimestamp.current = 0; // Reseta o tempo

      // Sincroniza a posição inicial ao dar Play
      if (scrollContainerRef.current) {
        fractionalPos.current = scrollContainerRef.current.scrollTop;
      }

      // Inicia o loop de animação
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, animate]);
}
