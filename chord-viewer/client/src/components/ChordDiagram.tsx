import React from "react";
import { ChordShape } from "../lib/chords-db";

interface ChordDiagramProps {
  chord: ChordShape;
}

const ChordDiagram: React.FC<ChordDiagramProps> = ({ chord }) => {
  const strings = 6;
  const frets = 5; // Mostrar 5 casas

  // Encontrar casa inicial (se o acorde for agudo, ex: pestana na 5ª)
  const minFret = Math.min(...chord.frets.filter(f => f > 0));
  const maxFret = Math.max(...chord.frets);
  const baseFret = maxFret > 5 ? minFret : 1;

  return (
    <div className="flex flex-col items-center p-4 bg-card rounded-2xl border border-border shadow-lg w-full max-w-[300px] mx-auto">
      <h3 className="text-2xl font-bold text-primary mb-4">{chord.name}</h3>

      <svg viewBox="0 0 200 240" className="w-full h-auto">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Nut (Pestana Zero) ou Texto da Casa Base */}
        {baseFret === 1 ? (
          <rect
            x="25"
            y="20"
            width="150"
            height="8"
            fill="currentColor"
            className="text-foreground"
          />
        ) : (
          <text
            x="10"
            y="45"
            fontSize="24"
            className="fill-muted-foreground font-bold"
          >
            {baseFret}ª
          </text>
        )}

        {/* Cordas Verticais */}
        {Array.from({ length: strings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={25 + i * 30}
            y1={25}
            x2={25 + i * 30}
            y2={220}
            stroke="currentColor"
            strokeWidth={i > 2 ? "1" : "2"} // Cordas graves mais grossas
            className="text-muted-foreground"
          />
        ))}

        {/* Trastes Horizontais */}
        {Array.from({ length: frets }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={25}
            y1={25 + (i + 1) * 40}
            x2={175}
            y2={25 + (i + 1) * 40}
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
        ))}

        {/* Pestanas (Barres) */}
        {chord.barres?.map(fret => {
          const relativeFret = fret - baseFret + 1;
          if (relativeFret < 1) return null;
          return (
            <rect
              key={`barre-${fret}`}
              x="25"
              y={25 + relativeFret * 40 - 30}
              width="150"
              height="20"
              rx="10"
              className="fill-primary opacity-80"
            />
          );
        })}

        {/* Dedos / Notas */}
        {chord.frets.map((fret, stringIndex) => {
          if (fret === -1) {
            // Corda Muda (X)
            return (
              <text
                key={`mute-${stringIndex}`}
                x={25 + stringIndex * 30}
                y="15"
                textAnchor="middle"
                className="fill-muted-foreground text-sm font-bold"
              >
                X
              </text>
            );
          }
          if (fret === 0) {
            // Corda Solta (O)
            return (
              <circle
                key={`open-${stringIndex}`}
                cx={25 + stringIndex * 30}
                cy="10"
                r="4"
                fill="none"
                stroke="currentColor"
                className="text-muted-foreground"
                strokeWidth="2"
              />
            );
          }

          const relativeFret = fret - baseFret + 1;

          // Se já houver pestana cobrindo, não desenha bolinha, a menos que seja nota diferente da pestana
          const isBarre = chord.barres?.includes(fret);
          // Simplificação: Desenhamos todos os dedos definidos explicitamente

          return (
            <g key={`note-${stringIndex}`}>
              <circle
                cx={25 + stringIndex * 30}
                cy={25 + relativeFret * 40 - 20}
                r="12"
                className="fill-primary"
                filter="url(#glow)"
              />
              {chord.fingers[stringIndex] > 0 && (
                <text
                  x={25 + stringIndex * 30}
                  y={25 + relativeFret * 40 - 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {chord.fingers[stringIndex]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ChordDiagram;
