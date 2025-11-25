import React from 'react';
import { Search, X } from 'lucide-react';
import { SongMeta } from '../types'; // Assuming types are moved to a separate file

interface SongListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  songList: SongMeta[];
  currentSong: { title: string } | null;
  onSelectSong: (song: SongMeta) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const SongListSidebar: React.FC<SongListSidebarProps> = ({
  isOpen,
  onClose,
  songList,
  currentSong,
  onSelectSong,
  searchQuery,
  onSearchQueryChange,
}) => {
  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
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
              <button onClick={onClose} className="md:hidden p-2 text-slate-400">
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
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Músicas */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {songList.map((song) => (
              <button
                key={song.path}
                onClick={() => onSelectSong(song)}
                className={`w-full text-left p-3 rounded-lg transition-colors group
                  ${currentSong?.title === song.title ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-800'}
                `}
              >
                <div className="font-medium text-slate-200 truncate">{song.title}</div>
                <div className="text-xs text-slate-500 group-hover:text-slate-400 truncate">{song.artist}</div>
              </button>
            ))}
            {songList.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">
                Nenhuma música encontrada.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay para fechar no mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default SongListSidebar;
