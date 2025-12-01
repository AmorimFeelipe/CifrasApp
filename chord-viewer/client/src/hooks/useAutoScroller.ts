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
  
  // Ref para velocidade atual, permitindo que o loop leia o valor mais recente
  // sem precisar ser recriado (o que causaria "pulos" ou reinícios).
  const speedRef = useRef(scrollSpeed);

  useEffect(() => {
    speedRef.current = scrollSpeed;
  }, [scrollSpeed]);
  
  // Flag para saber se o usuário está segurando a tela (Toque/Clique)
  const isUserInteracting = useRef(false);

  // Configura os ouvintes de toque (Touch/Mouse)
  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const onInteractStart = () => {
      isUserInteracting.current = true;
    };

    const onInteractEnd = () => {
      isUserInteracting.current = false;
      // Sincroniza a posição ao soltar para evitar pulos
      fractionalPos.current = element.scrollTop;
    };

    // Mobile (Touch)
    element.addEventListener("touchstart", onInteractStart, { passive: true });
    element.addEventListener("touchend", onInteractEnd);
    element.addEventListener("touchcancel", onInteractEnd);

    // Desktop (Mouse - opcional, ajuda se o usuário clicar na barra de rolagem)
    element.addEventListener("mousedown", onInteractStart);
    element.addEventListener("mouseup", onInteractEnd);
    // detecta se o mouse saiu da janela soltando o clique
    element.addEventListener("mouseleave", onInteractEnd); 

    return () => {
      element.removeEventListener("touchstart", onInteractStart);
      element.removeEventListener("touchend", onInteractEnd);
      element.removeEventListener("touchcancel", onInteractEnd);
      element.removeEventListener("mousedown", onInteractStart);
      element.removeEventListener("mouseup", onInteractEnd);
      element.removeEventListener("mouseleave", onInteractEnd);
    };
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimestamp.current) lastTimestamp.current = timestamp;

      // Calcula o delta de tempo
      const deltaTime = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      if (scrollContainerRef.current) {
        const currentSpeed = speedRef.current;
        
        if (currentSpeed > 0) {
          const element = scrollContainerRef.current;

          // SE O USUÁRIO ESTIVER TOCANDO NA TELA:
          // Apenas atualizamos nossa referência interna para acompanhar o dedo,
          // mas NÃO forçamos o element.scrollTop (deixamos o navegador nativo cuidar disso).
          if (isUserInteracting.current) {
            fractionalPos.current = element.scrollTop;
          } else {
            // SE ESTIVER LIVRE:
            // Aplicamos a rolagem automática.
            
            // Detecção extra: Se a posição real mudou muito bruscamente (scroll do mouse), sincroniza.
            if (Math.abs(element.scrollTop - fractionalPos.current) > 50) {
              fractionalPos.current = element.scrollTop;
            }

            const pixelsPerSecond = 30 * currentSpeed;
            fractionalPos.current += pixelsPerSecond * deltaTime;
            element.scrollTop = fractionalPos.current;
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    },
    [] // Sem dependências: o loop nunca é recriado, ele lê speedRef.current
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimestamp.current = 0;
      
      if (scrollContainerRef.current) {
        fractionalPos.current = scrollContainerRef.current.scrollTop;
      }

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