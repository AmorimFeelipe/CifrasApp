// client/src/components/SongListSidebar.tsx

import React, { useMemo, useState } from "react";
import {
  Search,
  X,
  Music,
  User,
  Plus,
  Trash2,
  MoreVertical,
  FolderPlus,
  ListMusic,
  Globe,
  Download,
  Loader2,
} from "lucide-react";
import { SongMeta, Setlist } from "../types";
import { useOnlineSearch } from "../hooks/useOnlineSearch"; // NOVO HOOK
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SongListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  songList: SongMeta[];
  setlists: Setlist[];
  currentSong: { title: string } | null;
  onSelectSong: (song: any) => void; // Aceita SongMeta ou Cifra Direta
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- MODO ONLINE ---
  const [mode, setMode] = useState<"local" | "online">("local");
  const { isSearching, searchResults, searchOnline, fetchCifra } =
    useOnlineSearch();
  const [onlineQuery, setOnlineQuery] = useState("");

  const handleOnlineSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchOnline(onlineQuery);
  };

  const handleOnlineSelect = async (result: any) => {
    // 1. Baixa a cifra
    const cifra = await fetchCifra(result.path);
    if (cifra) {
      // 2. Carrega no visualizador como se fosse uma música local
      // Truque: Criamos um objeto fake que já tem o conteúdo carregado
      onSelectSong({
        title: cifra.title,
        artist: cifra.artist,
        path: "temp-online",
        loader: async () => JSON.stringify(cifra), // Loader falso que retorna o que já temos
      });
      onClose(); // Fecha sidebar no mobile
    }
  };
  // -------------------

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
      setIsDialogOpen(false);
    }
  };

  const SongItem = ({
    song,
    isInsideSetlist = false,
    setlistId = "",
  }: {
    song: SongMeta;
    isInsideSetlist?: boolean;
    setlistId?: string;
  }) => (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          onClick={() => onSelectSong(song)}
          className={`w-full text-left p-2 rounded-md transition-colors flex items-center gap-3 text-sm
            ${
              currentSong?.title === song.title
                ? "bg-primary/10 text-primary font-medium border border-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }
          `}
        >
          <Music
            size={14}
            className={
              currentSong?.title === song.title ? "text-primary" : "opacity-50"
            }
          />
          <span className="truncate flex-1">{song.title}</span>
          {(isInsideSetlist || searchQuery) && (
            <span className="text-xs text-muted-foreground/70 truncate max-w-[100px]">
              {song.artist}
            </span>
          )}
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56 bg-popover border-border text-popover-foreground">
        {isInsideSetlist ? (
          <ContextMenuItem
            className="focus:bg-destructive/10 focus:text-destructive cursor-pointer text-destructive"
            onClick={e => {
              e.stopPropagation();
              onRemoveFromSetlist(setlistId, song.path);
            }}
          >
            <Trash2 size={14} className="mr-2" /> Remover da Lista
          </ContextMenuItem>
        ) : (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
              <Plus size={14} className="mr-2" /> Adicionar ao Repertório
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-popover border-border text-popover-foreground">
              {setlists.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  Crie uma lista primeiro
                </div>
              )}
              {setlists.map(list => (
                <ContextMenuItem
                  key={list.id}
                  onClick={e => {
                    e.stopPropagation();
                    onAddToSetlist(list.id, song.path);
                  }}
                  className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  <ListMusic size={14} className="mr-2 text-primary" />
                  {list.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-background/95 border-r border-border backdrop-blur-xl transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-1/3 lg:w-1/4 flex flex-col
        `}
      >
        {/* Toggle Local/Online */}
        <div className="p-2 border-b border-border/50 flex gap-1 bg-muted/30">
          <button
            onClick={() => setMode("local")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2
               ${
                 mode === "local"
                   ? "bg-background shadow text-foreground"
                   : "text-muted-foreground hover:text-foreground"
               }
             `}
          >
            <Music size={14} /> Minhas Cifras
          </button>
          <button
            onClick={() => setMode("online")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2
               ${
                 mode === "online"
                   ? "bg-background shadow text-primary"
                   : "text-muted-foreground hover:text-foreground"
               }
             `}
          >
            <Globe size={14} /> Buscar Online
          </button>
        </div>

        {mode === "local" ? (
          // --- MODO LOCAL (Igual antes) ---
          <>
            <div className="p-4 pb-2 border-b border-border shrink-0">
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

            <Tabs
              defaultValue="library"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 pt-2">
                <TabsList className="w-full bg-muted/80 grid grid-cols-2 p-1 rounded-lg">
                  <TabsTrigger
                    value="library"
                    className="data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
                  >
                    Biblioteca
                  </TabsTrigger>
                  <TabsTrigger
                    value="setlists"
                    className="data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
                  >
                    Repertórios
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="library"
                className="flex-1 overflow-hidden flex flex-col mt-2 data-[state=inactive]:hidden"
              >
                <ScrollArea className="flex-1 px-2">
                  {searchQuery.length > 0 ? (
                    <div className="space-y-1 pb-4">
                      {songList.map(song => (
                        <SongItem key={song.path} song={song} />
                      ))}
                    </div>
                  ) : (
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-2 pb-20"
                    >
                      {Object.entries(groupedSongs).map(([artist, songs]) => (
                        <AccordionItem
                          key={artist}
                          value={artist}
                          className="border border-border bg-card/50 rounded-lg px-2"
                        >
                          <AccordionTrigger className="text-foreground hover:text-primary py-3 text-sm">
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
                              <SongItem key={song.path} song={song} />
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="setlists"
                className="flex-1 overflow-hidden flex flex-col mt-2 data-[state=inactive]:hidden"
              >
                <div className="px-4 mb-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-dashed border-border bg-secondary/50 hover:bg-secondary hover:text-primary text-muted-foreground"
                      >
                        <FolderPlus className="mr-2 h-4 w-4" /> Criar Novo
                        Repertório
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border text-card-foreground">
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
                          <AccordionTrigger className="text-foreground hover:text-primary py-3 text-sm flex-1">
                            <div className="flex items-center gap-2 text-left">
                              <MoreVertical
                                size={16}
                                className="text-primary"
                              />{" "}
                              {list.name}
                            </div>
                          </AccordionTrigger>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteSetlist(list.id);
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <AccordionContent className="pb-2 space-y-1">
                          {list.songs.map(path => {
                            const song = songList.find(s => s.path === path);
                            if (!song) return null;
                            return (
                              <SongItem
                                key={path}
                                song={song}
                                isInsideSetlist
                                setlistId={list.id}
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
          </>
        ) : (
          // --- MODO ONLINE (NOVO) ---
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 pb-2 border-b border-border shrink-0">
              <form onSubmit={handleOnlineSearch} className="relative">
                <Globe
                  className="absolute left-3 top-2.5 text-primary animate-pulse"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Digite música ou artista..."
                  className="w-full bg-secondary rounded-lg pl-9 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  value={onlineQuery}
                  onChange={e => setOnlineQuery(e.target.value)}
                  autoFocus
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-3 top-2.5 text-primary animate-spin"
                    size={16}
                  />
                )}
              </form>
              <div className="text-[10px] text-muted-foreground mt-2 text-center">
                Busca direta no CifraClub via Servidor
              </div>
            </div>

            <ScrollArea className="flex-1 px-2 pt-2">
              <div className="space-y-1 pb-20">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOnlineSelect(res)}
                    className="w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 text-sm hover:bg-secondary group border border-transparent hover:border-border"
                  >
                    <Download
                      size={14}
                      className="text-muted-foreground group-hover:text-primary"
                    />
                    <span className="text-foreground font-medium truncate">
                      {res.title}
                    </span>
                  </button>
                ))}
                {searchResults.length === 0 && !isSearching && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Digite algo e dê Enter para buscar na web.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </aside>
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
