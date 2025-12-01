import React, { memo } from "react";
import { Music, Trash2, MoreVertical } from "lucide-react";
import { SongMeta, ChordFile } from "../types";

interface SongItemRowProps {
  song: SongMeta;
  currentSong: ChordFile | null;
  onSelectSong: (song: SongMeta) => void;
  isInsideSetlist?: boolean;
  setlistId?: string;
  searchQuery?: string;
  onRemoveFromSetlist?: (setId: string, songPath: string) => void;
  onOpenOptions?: (e: React.MouseEvent, song: SongMeta) => void;
}

const SongItemRow = memo(({ 
  song, 
  currentSong, 
  onSelectSong, 
  isInsideSetlist = false, 
  setlistId = "", 
  searchQuery = "",
  onRemoveFromSetlist,
  onOpenOptions
}: SongItemRowProps) => {
  const isSelected = currentSong?.title === song.title;

  return (
    <div 
      className={`
        w-full text-left p-2 rounded-md transition-colors flex items-center gap-3 text-sm cursor-pointer group
        ${isSelected
            ? "bg-primary/10 text-primary font-medium border border-primary/20"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }
      `}
      onClick={() => onSelectSong(song)}
    >
      <Music size={14} className={isSelected ? "text-primary" : "opacity-50"} />
      
      <div className="flex-1 overflow-hidden">
        <span className="truncate block">{song.title}</span>
        {(isInsideSetlist || searchQuery) && (
          <span className="text-xs text-muted-foreground/70 truncate block">
            {song.artist}
          </span>
        )}
      </div>

      {/* Botão de Ação (3 Pontos ou Lixeira) */}
      {isInsideSetlist ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromSetlist?.(setlistId, song.path);
          }}
          className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-full"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          onClick={(e) => onOpenOptions?.(e, song)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-colors active:scale-95"
        >
          <MoreVertical size={14} />
        </button>
      )}
    </div>
  );
});

SongItemRow.displayName = "SongItemRow";

export default SongItemRow;
