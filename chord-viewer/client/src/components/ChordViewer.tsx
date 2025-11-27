import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Menu,
  Minus,
  Plus,
  Play,
  Pause,
  Music2,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
} from "lucide-react";
import { ChordFile, SongMeta } from "../types";
import { parseChordFile } from "../lib/chordParser";
import { transposeText } from "../lib/chordTransposer";
import { useWakeLock } from "../hooks/useWakeLock";
import { useAutoScroller } from "../hooks/useAutoScroller";
import SongListSidebar from "./SongListSidebar";
import { useSetlists } from "../hooks/useSetlists";
import { useTheme } from "../contexts/ThemeContext";
import { Drawer, DrawerContent } from "@/components/ui/drawer"; 
import ChordDiagram from "./ChordDiagram";
import { getChordData, ChordShape } from "../lib/chords-db";

export default function ChordViewer() {
  useWakeLock();
  const {
    setlists,
    createSetlist,
    deleteSetlist,
    addToSetlist,
    removeFromSetlist,
  } = useSetlists();
  const { theme, setTheme } = useTheme();

  // Estados
  const [songList, setSongList] = useState<SongMeta[]>([]);
  const [currentSong, setCurrentSong] = useState<ChordFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // UI & Dicionário
  const [isToolbarMinimized, setIsToolbarMinimized] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [selectedChord, setSelectedChord] = useState<ChordShape | null>(null);

  // Leitura
  const [transposition, setTransposition] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useAutoScroller(scrollContainerRef, { isPlaying, scrollSpeed });

  // Scroll Header Logic
  const lastScrollY = useRef(0);
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const currentY = scrollContainerRef.current.scrollTop;
    const isScrollingDown = currentY > lastScrollY.current;
    
    // Só esconde o header se rolar mais que 50px
    if (currentY > 50) setIsHeaderVisible(!isScrollingDown);
    else setIsHeaderVisible(true);
    
    lastScrollY.current = currentY;
  };

  // --- NOVO: Cálculo Automático de Fonte ao Abrir Música ---
  useEffect(() => {
    if (!currentSong || !scrollContainerRef.current) return;

    // 1. Encontrar a linha mais longa (focando nas cifras que não quebram linha - whitespace-pre)
    let maxLineLength = 0;
    currentSong.content.forEach(line => {
      // Verifica o tamanho da linha de acordes (geralmente a que causa overflow horizontal)
      if (line.chords && line.chords.length > maxLineLength) {
        maxLineLength = line.chords.length;
      }
    });

    // Fallback para músicas muito curtas ou só letra
    if (maxLineLength < 30) maxLineLength = 40;

    // 2. Obter largura disponível (subtraindo padding, ex: 32px)
    const containerWidth = scrollContainerRef.current.clientWidth - 32;

    // 3. Constante de proporção (Fontes monoespaçadas tem largura aprox 0.6 da altura)
    // Formula: TamanhoFonte = LarguraTela / (NumCaracteres * 0.6)
    let idealFontSize = containerWidth / (maxLineLength * 0.6);

    // 4. Limites de Legibilidade (Min 10px, Max 18px inicial)
    if (idealFontSize < 10) idealFontSize = 10;
    if (idealFontSize > 18) idealFontSize = 18;

    setFontSize(Math.floor(idealFontSize));

  }, [currentSong]); // Roda sempre que a música muda
  // --------------------------------------------------------

  // Renderizador de Linha Interativa (Cifra Clicável)
  const renderInteractiveLine = (lineText: string, semitones: number) => {
    const transposedLine = transposeText(lineText, semitones);
    const regex = /([A-G][#b]?(?:m|maj|dim|aug|sus|add|5|6|7|9|11|13|\+|-|º)*)(?:\/[A-G][#b]?)?/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(transposedLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`sp-${lastIndex}`}>
            {transposedLine.substring(lastIndex, match.index)}
          </span>
        );
      }

      const chordName = match[0];
      const chordData = getChordData(chordName);
      const isClickable = !!chordData;

      parts.push(
        <span
          key={`ch-${match.index}`}
          onClick={e => {
            if (isClickable) {
              e.stopPropagation();
              setSelectedChord(chordData);
            }
          }}
          className={`
            font-bold mb-1.5 select-none tracking-wide inline-block rounded px-0.5 -mx-0.5 transition-all
            ${
              isClickable
                ? "chord-highlight cursor-pointer hover:bg-primary/10 active:scale-95"
                : "text-muted-foreground opacity-70"
            }
          `}
        >
          {chordName}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < transposedLine.length) {
      parts.push(<span key="end">{transposedLine.substring(lastIndex)}</span>);
    }
    return parts;
  };

  // Carregar Index
  useEffect(() => {
    const loadSongIndex = async () => {
      const modules = import.meta.glob("../Chords/*.{chords,json}", {
        query: "?raw",
        import: "default",
      });
      const list: SongMeta[] = Object.entries(modules).map(([path, loader]) => {
        const filename = path.split("/").pop()?.replace(/\.(chords|json)$/, "") || "Desconhecido";
        const parts = filename.split(" - ");
        return {
          path,
          artist: parts.length > 1 ? parts[0].trim() : "Desconhecido",
          title: parts.length > 1 ? parts.slice(1).join(" - ").trim() : filename,
          loader: loader as () => Promise<string>,
        };
      });
      list.sort((a, b) => a.title.localeCompare(b.title));
      setSongList(list);
    };
    loadSongIndex();
  }, []);

  const loadSong = async (song: SongMeta | ChordFile) => {
    setIsLoading(true);
    setSidebarOpen(false);

    if ("content" in song) {
      setCurrentSong(song);
      setTransposition(0);
      setIsPlaying(false);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      setIsLoading(false);
      return;
    }

    try {
      const rawContent = await song.loader();
      const parsed = parseChordFile(rawContent);
      if (parsed.title === "Sem título") parsed.title = song.title;
      if (parsed.artist === "Artista desconhecido") parsed.artist = song.artist;
      setCurrentSong(parsed);
      setTransposition(0);
      setIsPlaying(false);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return songList.filter(
      s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [songList, searchQuery]);

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 transition-colors duration-300">
      <SongListSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        songList={filteredList}
        setlists={setlists}
        currentSong={currentSong}
        onSelectSong={loadSong}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onCreateSetlist={createSetlist}
        onDeleteSetlist={deleteSetlist}
        onAddToSetlist={addToSetlist}
        onRemoveFromSetlist={removeFromSetlist}
      />

      <main className="flex-1 flex flex-col h-full relative text-base">
        
        {/* HEADER */}
        <header
          className={`
            absolute top-0 left-0 right-0 z-20 h-16 px-4 flex items-center justify-between
            bg-background/95 border-b border-border/50 backdrop-blur-md
            transition-transform duration-300 ease-in-out shadow-sm
            ${isHeaderVisible ? "translate-y-0" : "-translate-y-full"}
          `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors flex-shrink-0"
            >
              <Menu size={24} />
            </button>
            {currentSong ? (
              <div className="flex flex-col overflow-hidden">
                <h1 className="font-bold text-foreground truncate text-sm md:text-base leading-tight">
                  {currentSong.title}
                </h1>
                <p className="text-xs text-muted-foreground truncate font-medium">
                  {currentSong.artist}
                </p>
              </div>
            ) : (
              <span className="text-foreground font-bold tracking-tight flex items-center gap-2">
                <Music2 size={20} className="text-primary" /> CifrasApp
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center h-9 bg-secondary rounded-full border border-border px-1 flex-shrink-0">
              <button
                onClick={() => setFontSize(s => Math.max(12, s - 2))}
                className="w-8 h-full flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                A-
              </button>
              <div className="w-px h-4 bg-border mx-0.5"></div>
              <button
                onClick={() => setFontSize(s => Math.min(40, s + 2))}
                className="w-8 h-full flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                A+
              </button>
            </div>
          </div>
        </header>

        {/* SCROLL AREA */}
        {/* CORREÇÃO DE SCROLL: Removido 'scroll-smooth' e 'smooth-scroll-container' para não conflitar com JS */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar bg-background"
          onClick={() => setIsHeaderVisible(true)}
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-primary gap-4">
              <Music2 size={48} className="animate-bounce opacity-50" />
              <span className="text-sm font-medium text-muted-foreground animate-pulse">
                Carregando...
              </span>
            </div>
          ) : currentSong ? (
            <div
              className="min-h-full w-full max-w-full px-5 pt-24 pb-[50vh] mx-auto transition-all duration-200 ease-out selectable-text overflow-hidden"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentSong.content.map((line, idx) => (
                <div
                  key={idx}
                  className="mb-6 leading-relaxed font-mono whitespace-pre-wrap break-words break-all max-w-full"
                >
                  {/* CIFRA INTERATIVA */}
                  {line.chords && (
                    <div className="mb-1.5 whitespace-pre overflow-x-auto no-scrollbar">
                      {renderInteractiveLine(line.chords, transposition)}
                    </div>
                  )}
                  <div className="text-foreground/90 font-normal tracking-normal opacity-90">
                    {line.lyrics || (
                      <span className="opacity-0 select-none">.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center border border-border mb-4">
                <Music2 size={48} className="text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Seu Palco Digital
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Selecione uma música para começar.
              </p>
            </div>
          )}
        </div>

        {/* DRAWER (GAVETA) DE ACORDES */}
        <Drawer
          open={!!selectedChord}
          onOpenChange={open => !open && setSelectedChord(null)}
        >
          <DrawerContent className="bg-background border-border max-h-[80vh]">
            <div className="mx-auto w-full max-w-sm pb-8 pt-4">
              {selectedChord && <ChordDiagram chord={selectedChord} />}
            </div>
          </DrawerContent>
        </Drawer>

        {/* BOTTOM TOOLBAR */}
        {currentSong && (
          <div
            className={`absolute bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none transition-transform duration-500 ease-in-out ${
              isToolbarMinimized ? "translate-y-[150%]" : "translate-y-0"
            }`}
          >
            <div className="w-full max-w-md bg-background/90 backdrop-blur-xl border border-border/60 rounded-full shadow-2xl flex items-center justify-between p-2 pl-6 pointer-events-auto ring-1 ring-black/5 text-base">
              
              <div className="flex flex-col items-center gap-0.5 mr-4 flex-shrink-0">
                <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                  Tom
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTransposition(t => t - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-accent rounded-full transition-colors text-foreground flex-shrink-0"
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    className={`w-6 text-center font-bold text-sm ${
                      transposition !== 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {transposition > 0 ? `+${transposition}` : transposition}
                  </span>
                  <button
                    onClick={() => setTransposition(t => t + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-accent rounded-full transition-colors text-foreground flex-shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isPlaying && scrollSpeed === 0) setScrollSpeed(1);
                  setIsPlaying(!isPlaying);
                }}
                className={`w-14 h-14 -mt-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 ring-4 ring-background flex-shrink-0 ${
                  isPlaying
                    ? "bg-destructive text-white shadow-destructive/40"
                    : "bg-primary text-primary-foreground shadow-primary/40"
                }`}
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </button>

              <div className="flex flex-col items-center gap-0.5 ml-4 flex-shrink-0">
                <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                  Vel
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setScrollSpeed(s => Math.max(0.1, +(s - 0.1).toFixed(1)))
                    }
                    className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-accent rounded-full transition-colors text-foreground flex-shrink-0"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-muted-foreground">
                    {scrollSpeed.toFixed(1)}
                  </span>
                  <button
                    onClick={() =>
                      setScrollSpeed(s => Math.min(5, +(s + 0.1).toFixed(1)))
                    }
                    className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-accent rounded-full transition-colors text-foreground flex-shrink-0"
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}