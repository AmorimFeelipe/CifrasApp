import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { 
  Menu, Search, X, ChevronLeft, ChevronRight, 
  Minus, Plus, Play, Pause, Music2, AlertCircle 
} from 'lucide-react';
import { ChordFile, parseChordFile } from '../lib/chordParser';
import { transposeText } from '../lib/chordTransposer';

// --- HOOKS AUXILIARES ---

// 1. Wake Lock (Tela sempre ligada)
function useWakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock ativo!');
        }
      } catch (err) { console.error('Wake Lock falhou:', err); }
    };
    
    // Tenta ativar ao montar e quando a visibilidade muda (usuário volta pro app)
    requestLock();
    const handleVisibility = () => document.visibilityState === 'visible' && requestLock();
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      wakeLock?.release();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}

// 2. Intervalo customizado para scroll suave
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// --- TIPOS ---

interface SongMeta {
  path: string;
  title: string;
  artist: string;
  loader: () => Promise<string>;
}

// --- COMPONENTE PRINCIPAL ---

export default function ChordViewer() {
  useWakeLock(); // Ativa tela ligada

  // Estados Globais
  const [songList, setSongList] = useState<SongMeta[]>([]);
  const [currentSong, setCurrentSong] = useState<ChordFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de Leitura
  const [transposition, setTransposition] = useState(0);
  const [fontSize, setFontSize] = useState(16); // px
  const [scrollSpeed, setScrollSpeed] = useState(0); // 0 = parado
  const [isPlaying, setIsPlaying] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Carregamento Inicial (Lazy Load Index)
  useEffect(() => {
    const loadIndex = async () => {
      // Importa apenas os caminhos, não o conteúdo
      const modules = import.meta.glob('../Chords/*.chords', { query: '?raw', import: 'default' });
      
      const list: SongMeta[] = Object.entries(modules).map(([path, loader]) => {
        // Tenta extrair Artista - Musica do nome do arquivo
        const filename = path.split('/').pop()?.replace('.chords', '') || 'Desconhecido';
        const parts = filename.split(' - ');
        
        return {
          path,
          artist: parts.length > 1 ? parts[0].trim() : 'Desconhecido',
          title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : filename,
          loader: loader as () => Promise<string>
        };
      });

      // Ordena alfabeticamente
      list.sort((a, b) => a.title.localeCompare(b.title));
      setSongList(list);
    };
    loadIndex();
  }, []);

  // 2. Carregar conteúdo de uma música
  const loadSong = async (meta: SongMeta) => {
    setIsLoading(true);
    setSidebarOpen(false); // Fecha menu no mobile
    try {
      const rawContent = await meta.loader();
      const parsed = parseChordFile(rawContent);
      
      // Se o parser falhar em pegar título/artista do conteúdo, usa o do arquivo
      if (parsed.title === 'Sem título') parsed.title = meta.title;
      if (parsed.artist === 'Artista desconhecido') parsed.artist = meta.artist;
      
      setCurrentSong(parsed);
      setTransposition(0); // Reseta tom
      setIsPlaying(false); // Para scroll
      setScrollSpeed(0);
    } catch (error) {
      console.error("Erro ao abrir cifra:", error);
      alert("Não foi possível carregar este arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Lógica de Scroll Automático (Suave a 60fps)
  useInterval(() => {
    if (isPlaying && scrollSpeed > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += scrollSpeed;
    }
  }, isPlaying ? 16 : null); // ~60fps

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setScrollSpeed(0);
    } else {
      setIsPlaying(true);
      setScrollSpeed(1); // Começa devagar
    }
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
      
      {/* --- SIDEBAR / BIBLIOTECA --- */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-1/3 lg:w-1/4
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Biblioteca
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
                <X size={20} />
              </button>
            </div>
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Buscar música ou artista..."
                className="w-full bg-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Lista Virtualizada (Simples) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredList.map((song) => (
              <button
                key={song.path}
                onClick={() => loadSong(song)}
                className={`w-full text-left p-3 rounded-lg transition-colors group
                  ${currentSong?.title === song.title ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-800'}
                `}
              >
                <div className="font-medium text-slate-200 truncate">{song.title}</div>
                <div className="text-xs text-slate-500 group-hover:text-slate-400 truncate">{song.artist}</div>
              </button>
            ))}
            {filteredList.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">
                Nenhuma música encontrada.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* --- SIDEBAR OVERLAY (Mobile) --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Header Mobile / Desktop */}
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
          
          {/* Controles Rápidos Topo */}
          {currentSong && (
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFontSize(s => Math.max(10, s - 2))}
                  className="p-2 text-slate-400 hover:bg-slate-800 rounded hidden sm:block"
                >
                  <span className="text-xs font-bold">A-</span>
                </button>
                <button 
                  onClick={() => setFontSize(s => Math.min(32, s + 2))}
                  className="p-2 text-slate-400 hover:bg-slate-800 rounded hidden sm:block"
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
              <Music2 size={48} className="mb-2" />
              <span className="sr-only">Carregando...</span>
            </div>
          ) : currentSong ? (
            <div 
              className="min-h-full p-4 pb-48 md:p-8 md:pb-48 max-w-4xl mx-auto"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentSong.content.map((line, idx) => (
                <div key={idx} className="mb-4 leading-relaxed font-mono whitespace-pre-wrap">
                  {/* Acordes */}
                  <div className="text-yellow-400 font-bold mb-1 select-none">
                     {transposeText(line.chords, transposition)}
                  </div>
                  {/* Letra */}
                  <div className="text-slate-300">
                    {line.lyrics || <br/>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <Music2 size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Bem-vindo ao CifrasApp</p>
              <p className="text-sm mt-2 max-w-xs">Abra o menu lateral para escolher uma música e começar o show.</p>
            </div>
          )}
        </div>

        {/* --- BARRA DE CONTROLE FLUTUANTE (BOTTOM) --- */}
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

              {/* Scroll / Play */}
              <div className="flex items-center flex-1 justify-center gap-3">
                 <button 
                   onClick={togglePlay}
                   className={`
                     w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg
                     ${isPlaying 
                       ? 'bg-red-500 hover:bg-red-600 text-white' 
                       : 'bg-blue-500 hover:bg-blue-600 text-white'}
                   `}
                 >
                   {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                 </button>
              </div>

              {/* Velocidade Scroll (Só aparece se playing ou para ajuste) */}
              <div className="flex items-center bg-slate-800/50 rounded-xl px-2 py-1">
                 <button 
                   onClick={() => setScrollSpeed(s => Math.max(0, s - 0.5))} 
                   className="p-2 text-slate-300 hover:text-white"
                 >
                   <ChevronLeft size={18} />
                 </button>
                 <div className="flex flex-col items-center w-12 mx-1">
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Veloc.</span>
                   <span className="font-bold text-green-400">{scrollSpeed.toFixed(1)}x</span>
                 </div>
                 <button 
                   onClick={() => setScrollSpeed(s => Math.min(10, s + 0.5))} 
                   className="p-2 text-slate-300 hover:text-white"
                 >
                   <ChevronRight size={18} />
                 </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
