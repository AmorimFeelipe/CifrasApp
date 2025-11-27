import React, { useState } from "react";
import {
  Music2,
  Search,
  X,
  Plus,
  Trash2,
  MoreVertical, // Novo ícone importado
} from "lucide-react";
import { SongMeta, Setlist, ChordFile } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

interface SongListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  songList: SongMeta[];
  setlists: Setlist[];
  currentSong: ChordFile | null;
  onSelectSong: (song: SongMeta) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onCreateSetlist: (name: string) => void;
  onDeleteSetlist: (id: string) => void;
  onAddToSetlist: (setlistId: string, songPath: string) => void;
  onRemoveFromSetlist: (setlistId: string, songPath: string) => void;
}

export default function SongListSidebar({
  isOpen,
  onClose,
  songList,
  setlists,
  currentSong,
  onSelectSong,
  searchQuery,
  onSearchQueryChange,
  onCreateSetlist,
  onDeleteSetlist,
  onAddToSetlist,
  onRemoveFromSetlist,
}: SongListSidebarProps) {
  const [newSetlistName, setNewSetlistName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [songToAddToSetlist, setSongToAddToSetlist] = useState<SongMeta | null>(
    null
  );

  const handleCreateSetlist = () => {
    if (newSetlistName.trim()) {
      onCreateSetlist(newSetlistName);
      setNewSetlistName("");
      setIsCreateDialogOpen(false);
    }
  };

  const handleOpenOptions = (e: React.MouseEvent, song: SongMeta) => {
    e.stopPropagation(); // Impede que a música abra ao clicar nos 3 pontos
    setSongToAddToSetlist(song);
  };

  return (
    <>
      {/* Overlay Escuro (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-[85vw] md:w-80 
          bg-card border-r border-border shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Cabeçalho da Sidebar */}
        <div className="p-4 border-b border-border flex flex-col gap-4 bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <Music2 className="text-primary" /> Músicas
            </h2>
            <button
              onClick={onClose}
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <Search
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar artista ou música..."
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
        </div>

        {/* Lista Scrollável */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {searchQuery === "" && (
            <div className="px-4 py-2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="setlists" className="border-border">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline hover:text-primary py-3">
                    Meus Repertórios
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pt-1 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 mb-2 text-primary hover:text-primary border-dashed border-primary/30 hover:border-primary hover:bg-primary/5"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <Plus size={14} /> Novo Repertório
                      </Button>

                      {setlists.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Nenhum repertório criado
                        </p>
                      ) : (
                        setlists.map((setlist) => (
                          <div
                            key={setlist.id}
                            className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
                          >
                            <span className="text-sm truncate font-medium flex-1 text-foreground">
                              {setlist.name}
                              <span className="ml-2 text-xs text-muted-foreground font-normal">
                                ({setlist.songs.length})
                              </span>
                            </span>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSetlist(setlist.id);
                                }}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                title="Excluir repertório"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <div className="pb-20 md:pb-4">
            {songList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma música encontrada.
              </div>
            ) : (
              songList.map((song) => (
                <div
                  key={song.path}
                  className={`
                    w-full text-left px-4 py-2 hover:bg-accent/50 transition-colors
                    flex items-center gap-3 border-b border-border/30 last:border-0
                    ${
                      currentSong?.title === song.title
                        ? "bg-accent text-accent-foreground border-l-4 border-l-primary pl-3"
                        : "text-foreground"
                    }
                  `}
                >
                  {/* Área Clicável da Música (Abre a Cifra) */}
                  <div 
                    className="flex-1 flex items-center gap-3 overflow-hidden cursor-pointer py-1"
                    onClick={() => onSelectSong(song)}
                  >
                    <div className={`
                      p-2 rounded-full flex-shrink-0
                      ${currentSong?.title === song.title ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}
                    `}>
                      <Music2 size={18} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h3 className="font-medium text-sm truncate leading-tight">
                        {song.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Botão de Opções (3 Pontinhos) - Substituto do Long Press */}
                  <button
                    onClick={(e) => handleOpenOptions(e, song)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors flex-shrink-0 active:scale-95"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* DIALOG: CRIAR REPERTÓRIO */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Repertório</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Crie uma lista para organizar suas músicas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input
              id="name"
              placeholder="Nome da lista (ex: Show Barzinho)"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              className="bg-secondary/50 border-input text-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleCreateSetlist()}
            />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-foreground"
            >
              Cancelar
            </Button>
            <Button type="submit" onClick={handleCreateSetlist} className="bg-primary text-primary-foreground">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADICIONAR AO REPERTÓRIO (CORRIGIDO VISUALMENTE) */}
      <Dialog
        open={!!songToAddToSetlist}
        onOpenChange={(open) => !open && setSongToAddToSetlist(null)}
      >
        <DialogContent className="sm:max-w-md bg-card border-border max-w-[90vw] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar ao Repertório</DialogTitle>
            <DialogDescription className="text-muted-foreground truncate">
              Escolha onde salvar "{songToAddToSetlist?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-2 py-4 max-h-[50vh] overflow-y-auto">
            {setlists.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhum repertório criado.
                </p>
                <Button 
                  onClick={() => {
                    setSongToAddToSetlist(null);
                    setIsCreateDialogOpen(true);
                  }}
                  variant="outline"
                  className="w-full text-foreground"
                >
                  Criar Primeiro Repertório
                </Button>
              </div>
            ) : (
              setlists.map((setlist) => {
                const isAlreadyIn = setlist.songs.includes(songToAddToSetlist?.path || "");
                return (
                  <Button
                    key={setlist.id}
                    // Mudança aqui: Variant Secondary + Classes manuais para garantir contraste
                    variant={isAlreadyIn ? "destructive" : "secondary"}
                    className={`
                      justify-between w-full h-auto py-3 px-4 
                      ${isAlreadyIn 
                        ? "opacity-90 hover:opacity-100" 
                        : "bg-secondary/80 hover:bg-secondary text-foreground border border-border"
                      }
                    `}
                    onClick={() => {
                      if (songToAddToSetlist) {
                        if (isAlreadyIn) {
                          onRemoveFromSetlist(setlist.id, songToAddToSetlist.path);
                        } else {
                          onAddToSetlist(setlist.id, songToAddToSetlist.path);
                        }
                        setSongToAddToSetlist(null);
                      }
                    }}
                  >
                    <span className="font-medium truncate">{setlist.name}</span>
                    <span className="text-xs opacity-70 ml-2">
                      {isAlreadyIn ? "Remover" : "Adicionar"}
                    </span>
                  </Button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}