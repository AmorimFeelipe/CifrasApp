import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu, Minus, Plus, Play, Pause, Music2
} from 'lucide-react';
import { ChordFile, SongMeta } from '../types';
import { parseChordFile } from '../lib/chordParser';
import { transposeText } from '../lib/chordTransposer';
import { useWakeLock } from '../hooks/useWakeLock';
import { useAutoScroller } from '../hooks/useAutoScroller';
import SongListSidebar from './SongListSidebar'; // Componente extraído

// --- COMPONENTE PRINCIPAL ---

export default function ChordViewer() {
  useWakeLock(); // Ativa tela sempre ligada

  // Estados Globais
  const [songList, setSongList] = useState<SongMeta[]>([]);
  const [currentSong, setCurrentSong] = useState<ChordFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de Leitura
  const [transposition, setTransposition] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hook de scroll automático
  useAutoScroller(scrollContainerRef, { isPlaying, scrollSpeed });

  // 1. Carregamento Inicial do Índice de Músicas
  useEffect(() => {
    const loadSongIndex = async () => {
      // Agora busca .json e .chords
const modules = import.meta.glob('../Chords/*.{chords,json}', { query: '?raw', import: 'default' });

      const list: SongMeta[] = Object.entries(modules).map(([path, loader]) => {
        const filename = path.split('/').pop()?.replace(/\.(chords|json)$/, '') || 'Desconhecido';
        const parts = filename.split(' - ');
        return {
          path,
          artist: parts.length > 1 ? parts[0].trim() : 'Desconhecido',
          title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : filename,
          loader: loader as () => Promise<string>,
        };
      });

      list.sort((a, b) => a.title.localeCompare(b.title));
      setSongList(list);
    };
    loadSongIndex();
  }, []);

  // 2. Carregar o conteúdo da música selecionada
  const loadSong = async (meta: SongMeta) => {
    setIsLoading(true);
    setSidebarOpen(false);
    try {
      const rawContent = await meta.loader();
      const parsed = parseChordFile(rawContent);
      if (parsed.title === 'Sem título') parsed.title = meta.title;
      if (parsed.artist === 'Artista desconhecido') parsed.artist = meta.artist;
      setCurrentSong(parsed);
      setTransposition(0);
      setIsPlaying(false);
    } catch (error) {
      console.error("Erro ao abrir cifra:", error);
      alert("Não foi possível carregar este arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Lógica do player de scroll
  const togglePlay = () => {
    if (!isPlaying && scrollSpeed === 0) setScrollSpeed(1); // Inicia com velocidade padrão
    setIsPlaying(!isPlaying);
  };

  // Filtro de busca
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return songList.filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [songList, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">

      {/* --- SIDEBAR (Componente Extraído) --- */}
      <SongListSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        songList={filteredList}
        currentSong={currentSong}
        onSelectSong={loadSong}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 backdrop-blur justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-300">
              <Menu size={24} />
            </button>
            {currentSong ? (
              <div className="overflow-hidden">
                <h1 className="font-bold text-slate-100 truncate text-sm md:text-base leading-tight">
                  {currentSong.title}
                </h1>
                <p className="text-xs text-slate-400 truncate">{currentSong.artist}</p>
              </div>
            ) : (
              <span className="text-slate-500 text-sm">Selecione uma música</span>
            )}
          </div>

          {currentSong && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(s => Math.max(10, s - 2))}
                className="p-2 text-slate-400 hover:bg-slate-800 rounded hidden sm:block"
                aria-label="Diminuir fonte"
              >
                <span className="text-xs font-bold">A-</span>
              </button>
              <button
                onClick={() => setFontSize(s => Math.min(32, s + 2))}
                className="p-2 text-slate-400 hover:bg-slate-800 rounded hidden sm:block"
                aria-label="Aumentar fonte"
              >
                <span className="text-xs font-bold">A+</span>
              </button>
            </div>
          )}
        </header>

        {/* Visualizador da Cifra */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-[#0b0f19] relative scroll-smooth"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-blue-400 animate-pulse">
              <Music2 size={48} />
            </div>
          ) : currentSong ? (
            <div
              className="min-h-full p-4 pb-48 md:p-8 md:pb-48 max-w-4xl mx-auto"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentSong.content.map((line, idx) => (
                <div key={idx} className="mb-4 leading-relaxed font-mono whitespace-pre-wrap">
                  <div className="text-yellow-400 font-bold mb-1 select-none">
                    {transposeText(line.chords, transposition)}
                  </div>
                  <div className="text-slate-300">
                    {line.lyrics || <br />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <Music2 size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Bem-vindo ao CifrasApp</p>
              <p className="text-sm mt-2 max-w-xs">Abra o menu para escolher uma música.</p>
            </div>
          )}
        </div>

        {/* --- BARRA DE CONTROLE FLUTUANTE --- */}
        {currentSong && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-2 z-30">
            <div className="flex items-center justify-between gap-1">

              {/* Tom */}
              <div className="flex items-center bg-slate-800/50 rounded-xl px-2 py-1">
                <button onClick={() => setTransposition(t => t - 1)} className="p-2 text-slate-300 hover:text-white"><Minus size={18} /></button>
                <div className="flex flex-col items-center w-10 mx-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tom</span>
                  <span className="font-bold text-blue-400">{transposition > 0 ? `+${transposition}` : transposition}</span>
                </div>
                <button onClick={() => setTransposition(t => t + 1)} className="p-2 text-slate-300 hover:text-white"><Plus size={18} /></button>
              </div>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isPlaying ? 'bg-red-500' : 'bg-blue-500'}`}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>

              {/* Velocidade */}
              <div className="flex items-center bg-slate-800/50 rounded-xl px-2 py-1">
                <button onClick={() => setScrollSpeed(s => Math.max(0.5, s - 0.5))} className="p-2 text-slate-300 hover:text-white"><Minus size={18} /></button>
                <div className="flex flex-col items-center w-12 mx-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Veloc.</span>
                  <span className="font-bold text-green-400">{scrollSpeed.toFixed(1)}x</span>
                </div>
                <button onClick={() => setScrollSpeed(s => Math.min(10, s + 0.5))} className="p-2 text-slate-300 hover:text-white"><Plus size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
