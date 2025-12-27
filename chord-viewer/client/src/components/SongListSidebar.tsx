import React, { useMemo, useState, useCallback } from "react";
import {
  Search,
  X,
  Music2,
  User,
  FolderPlus,
  ListMusic,
  Trash2,
} from "lucide-react";
import { SongMeta, Setlist, ChordFile } from "../types";

// Componentes UI restaurados
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SongItemRow from "./SongItemRow";

interface SongListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  songList: SongMeta[];
  setlists: Setlist[];
  currentSong: ChordFile | null;
  onSelectSong: (song: any) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onCreateSetlist: (name: string) => void;
  onDeleteSetlist: (id: string) => void;
  onAddToSetlist: (setId: string, songPath: string) => void;
  onRemoveFromSetlist: (setId: string, songPath: string) => void;
}

const SongListSidebar: React.FC<SongListSidebarProps> = ({
  isOpen,
  onClose,
  songList,
  currentSong,
  onSelectSong,
  searchQuery,
  onSearchQueryChange,
  setlists,
  onCreateSetlist,
  onDeleteSetlist,
  onAddToSetlist,
  onRemoveFromSetlist,
}) => {
  const [newListName, setNewListName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Estado para controlar qual música está sendo adicionada via "3 pontinhos"
  const [songToAddToSetlist, setSongToAddToSetlist] = useState<SongMeta | null>(null);

  // 1. RESTAURADO: Lógica de agrupar por Artista
  const groupedSongs = useMemo(() => {
    const groups: Record<string, SongMeta[]> = {};
    songList.forEach(song => {
      const artist = song.artist || "Desconhecido";
      if (!groups[artist]) groups[artist] = [];
      groups[artist].push(song);
    });
    return Object.keys(groups)
      .sort()
      .reduce((obj, key) => {
        obj[key] = groups[key];
        return obj;
      }, {} as Record<string, SongMeta[]>);
  }, [songList]);

  const handleCreate = () => {
    if (newListName.trim()) {
      onCreateSetlist(newListName);
      setNewListName("");
      setIsCreateDialogOpen(false);
    }
  };

  const handleOpenOptions = useCallback((e: React.MouseEvent, song: SongMeta) => {
    e.stopPropagation();
    setSongToAddToSetlist(song);
  }, []);

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-85 md:w-80 bg-background/95 border-r border-border backdrop-blur-xl transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-1/3 lg:w-1/4 flex flex-col
        `}
      >
          {/* Header de Busca */}
          <div className="p-4 pb-2 border-b border-border shrink-0">
             <div className="flex items-center justify-between mb-4 md:hidden">
                <h2 className="font-bold flex items-center gap-2"><Music2 size={18}/> CifrasApp</h2>
                <button onClick={onClose}><X size={20}/></button>
             </div>

            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Filtrar biblioteca..."
                className="w-full bg-secondary rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={e => onSearchQueryChange(e.target.value)}
              />
            </div>
          </div>

          {/* 2. RESTAURADO: Abas (Tabs) */}
          <Tabs
            defaultValue="library"
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="px-4 pt-2">
              <TabsList className="w-full bg-secondary/50 grid grid-cols-2 p-1 rounded-lg">
                <TabsTrigger
                  value="library"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Biblioteca
                </TabsTrigger>
                <TabsTrigger
                  value="setlists"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Repertórios
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTEÚDO: BIBLIOTECA (Organizado por Artista) */}
            <TabsContent
              value="library"
              className="flex-1 min-h-0 flex flex-col mt-2 data-[state=inactive]:hidden"
            >
              <ScrollArea className="flex-1 px-2">
                {searchQuery.length > 0 ? (
                  // Se tiver busca, mostra lista plana
                  <div className="space-y-1 pb-4 pt-2">
                    {songList.map(song => (
                      <SongItemRow 
                        key={song.path} 
                        song={song} 
                        currentSong={currentSong}
                        onSelectSong={onSelectSong}
                        searchQuery={searchQuery}
                        onOpenOptions={handleOpenOptions}
                      />
                    ))}
                  </div>
                ) : (
                  // Se não tiver busca, mostra Accordion de Artistas
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-2 pb-20 pt-2"
                  >
                    {Object.entries(groupedSongs).map(([artist, songs]) => (
                      <AccordionItem
                        key={artist}
                        value={artist}
                        className="border border-border bg-card/50 rounded-lg px-2"
                      >
                        <AccordionTrigger className="text-foreground hover:text-primary py-3 text-sm hover:no-underline">
                          <div className="flex items-center gap-2 text-left">
                            <User size={16} className="text-primary" />{" "}
                            {artist}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({songs.length})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 space-y-1">
                          {songs.map(song => (
                            <SongItemRow 
                              key={song.path} 
                              song={song} 
                              currentSong={currentSong}
                              onSelectSong={onSelectSong}
                              onOpenOptions={handleOpenOptions}
                            />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </ScrollArea>
            </TabsContent>

            {/* CONTEÚDO: REPERTÓRIOS (Expansível) */}
            <TabsContent
              value="setlists"
              className="flex-1 min-h-0 flex flex-col mt-2 data-[state=inactive]:hidden"
            >
              <div className="px-4 mb-2">
                <Button
                  variant="outline"
                  className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <FolderPlus className="mr-2 h-4 w-4" /> Criar Novo Repertório
                </Button>
              </div>

              <ScrollArea className="flex-1 px-2">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-2 pb-20"
                >
                  {setlists.map(list => (
                    <AccordionItem
                      key={list.id}
                      value={list.id}
                      className="border border-border bg-card/50 rounded-lg px-2"
                    >
                      <div className="flex items-center justify-between pr-2">
                        <AccordionTrigger className="text-foreground hover:text-primary py-3 text-sm flex-1 hover:no-underline">
                          <div className="flex items-center gap-2 text-left">
                            <ListMusic size={16} className="text-primary" />
                            {list.name}
                            <span className="text-xs text-muted-foreground font-normal">({list.songs.length})</span>
                          </div>
                        </AccordionTrigger>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteSetlist(list.id);
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <AccordionContent className="pb-2 space-y-1">
                         {list.songs.length === 0 && (
                            <p className="text-xs text-muted-foreground py-2 text-center">Lista vazia.</p>
                         )}
                        {list.songs.map(path => {
                          const song = songList.find(s => s.path === path);
                          if (!song) return null;
                          return (
                            <SongItemRow
                              key={path}
                              song={song}
                              currentSong={currentSong}
                              onSelectSong={onSelectSong}
                              isInsideSetlist
                              setlistId={list.id}
                              onRemoveFromSetlist={onRemoveFromSetlist}
                            />
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </TabsContent>
          </Tabs>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* DIALOG: CRIAR REPERTÓRIO */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Repertório</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Input
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="Nome da lista..."
              className="bg-secondary border-input text-foreground"
            />
            <Button onClick={handleCreate}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADICIONAR AO REPERTÓRIO (Ao clicar nos 3 pontos) */}
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
                        // Opcional: Fechar o modal após adicionar? 
                        // Se quiser fechar, descomente a linha abaixo:
                        // setSongToAddToSetlist(null);
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
          <DialogFooter>
             <Button variant="ghost" onClick={() => setSongToAddToSetlist(null)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SongListSidebar;