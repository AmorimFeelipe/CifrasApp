import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Paper,
  Collapse,
  Fab,
  AppBar,
  Toolbar,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Autocomplete,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Add,
  Remove,
  Search,
  Close,
  Menu,
  Delete,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { ChordFile, parseChordFile } from '../lib/chordParser';
import { transposeText } from '../lib/chordTransposer';

const REPERTOIRE_STORAGE_KEY = 'chordCustomRepertoires';

interface CustomRepertoire {
  id: string;
  name: string;
  songKeys: string[];
}

interface ChordViewerState {
  files: ChordFile[];
  currentFileIndex: number;
  transposition: number;
  isPlaying: boolean;
  scrollSpeed: number;
  searchQuery: string;
  searchOpen: boolean;
  searchHistory: string[];
  drawerOpen: boolean;
  customRepertoires: CustomRepertoire[];
}

export default function ChordViewer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [state, setState] = useState<ChordViewerState>({
    files: [],
    currentFileIndex: 0,
    transposition: 0,
    isPlaying: false,
    scrollSpeed: 1,
    searchQuery: '',
    searchOpen: false,
    searchHistory: [],
    drawerOpen: false,
    customRepertoires: [],
  });
  const [newRepertoireName, setNewRepertoireName] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar histórico do localStorage ao montar o componente
  useEffect(() => {
    const savedHistory = localStorage.getItem('chordSearchHistory');
    if (savedHistory) {
      setState((prev) => ({
        ...prev,
        searchHistory: JSON.parse(savedHistory),
      }));
    }
  }, []);

  // Salvar histórico no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('chordSearchHistory', JSON.stringify(state.searchHistory));
  }, [state.searchHistory]);

  // Carregar repert��rios personalizados
  useEffect(() => {
    const savedRepertoires = localStorage.getItem(REPERTOIRE_STORAGE_KEY);
    if (savedRepertoires) {
      try {
        const parsed = JSON.parse(savedRepertoires);
        if (Array.isArray(parsed)) {
          const sanitized: CustomRepertoire[] = parsed
            .filter(
              (rep: any) =>
                rep &&
                typeof rep.id === 'string' &&
                typeof rep.name === 'string' &&
                Array.isArray(rep.songKeys)
            )
            .map((rep: any) => ({
              id: rep.id,
              name: rep.name,
              songKeys: rep.songKeys.filter((key: any) => typeof key === 'string'),
            }));
          setState((prev) => ({
            ...prev,
            customRepertoires: sanitized,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar repert��rios personalizados:', error);
      }
    }
  }, []);

  // Persistir repert��rios personalizados
  useEffect(() => {
    localStorage.setItem(REPERTOIRE_STORAGE_KEY, JSON.stringify(state.customRepertoires));
  }, [state.customRepertoires]);

  // Carregar arquivos .chords recursivamente
  useEffect(() => {
    const loadChordFiles = async () => {
      try {
        // Importar todos os arquivos .chords da pasta Chords
        const chordFiles = await import.meta.glob('../Chords/*.chords', { as: 'raw' });
        const files: ChordFile[] = [];
        
        for (const path in chordFiles) {
          const content = await chordFiles[path]();
          const parsed = parseChordFile(content);
          files.push(parsed);
        }
        
        // Ordenar os arquivos por título em ordem alfabética
        files.sort((a, b) => a.title.localeCompare(b.title));

        setState(prev => ({
          ...prev,
          files,
        }));
      } catch (error) {
        console.error('Erro ao carregar arquivos de cifras:', error);
      }
    };

    loadChordFiles();
  }, []);

  const getSongKey = (file: ChordFile) => `${file.title}|||${file.artist}`;

  const createRepertoire = () => {
    const trimmedName = newRepertoireName.trim();
    if (!trimmedName) {
      return;
    }
    setState((prev) => ({
      ...prev,
      customRepertoires: [
        ...prev.customRepertoires,
        {
          id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: trimmedName,
          songKeys: [],
        },
      ],
    }));
    setNewRepertoireName('');
  };

  const deleteRepertoire = (repertoireId: string) => {
    setState((prev) => ({
      ...prev,
      customRepertoires: prev.customRepertoires.filter((rep) => rep.id !== repertoireId),
    }));
  };

  const addSongToRepertoire = (repertoireId: string, file: ChordFile | null) => {
    if (!file) {
      return;
    }
    const songKey = getSongKey(file);
    setState((prev) => ({
      ...prev,
      customRepertoires: prev.customRepertoires.map((rep) =>
        rep.id === repertoireId
          ? rep.songKeys.includes(songKey)
            ? rep
            : { ...rep, songKeys: [...rep.songKeys, songKey] }
          : rep
      ),
    }));
  };

  const removeSongFromRepertoire = (repertoireId: string, songKey: string) => {
    setState((prev) => ({
      ...prev,
      customRepertoires: prev.customRepertoires.map((rep) =>
        rep.id === repertoireId
          ? { ...rep, songKeys: rep.songKeys.filter((key) => key !== songKey) }
          : rep
      ),
    }));
  };

  const findFileByKey = (songKey: string) =>
    state.files.find((file) => getSongKey(file) === songKey);

  // Alternar play/pause
  const togglePlayPause = () => {
    setState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  // Aumentar tom
  const increaseKey = () => {
    setState((prev) => ({
      ...prev,
      transposition: prev.transposition + 1,
    }));
  };

  // Diminuir tom
  const decreaseKey = () => {
    setState((prev) => ({
      ...prev,
      transposition: prev.transposition - 1,
    }));
  };

  // Aumentar velocidade
  const increaseSpeed = () => {
    setState((prev) => ({
      ...prev,
      scrollSpeed: Math.min(prev.scrollSpeed + 0.5, 5),
    }));
  };

  // Diminuir velocidade
  const decreaseSpeed = () => {
    setState((prev) => ({
      ...prev,
      scrollSpeed: Math.max(prev.scrollSpeed - 0.5, 0.5),
    }));
  };

  // Resetar transposição
  const resetTransposition = () => {
    setState((prev) => ({
      ...prev,
      transposition: 0,
    }));
  };

  // Toggle drawer
  const toggleDrawer = () => {
    setState((prev) => ({
      ...prev,
      drawerOpen: !prev.drawerOpen,
    }));
  };

  // Filtrar músicas
  const filteredFiles = state.files.filter((file) => {
    const query = state.searchQuery.toLowerCase();
    return (
      file.title.toLowerCase().includes(query) ||
      file.artist.toLowerCase().includes(query)
    );
  });

  // Autoscroll
  useEffect(() => {
    if (state.isPlaying && contentRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop += state.scrollSpeed;
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [state.isPlaying, state.scrollSpeed]);

  const currentFile = state.files[state.currentFileIndex];

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header compacto */}
      <AppBar position="static" sx={{ 
        backgroundColor: '#1976d2',
        boxShadow: 2,
        minHeight: isMobile ? '56px' : '64px'
      }}>
        <Toolbar sx={{ 
          minHeight: isMobile ? '56px' : '64px',
          justifyContent: 'space-between',
          px: { xs: 1, sm: 2 }
        }}>
          <IconButton 
            onClick={toggleDrawer}
            sx={{ 
              color: 'white',
              mr: 1
            }}
          >
            <Menu />
          </IconButton>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
            fontWeight: 'bold',
            flexGrow: 1,
            mr: 2
          }}>
            🎸 Cifras
          </Typography>
          
        </Toolbar>
      </AppBar>

      {/* Drawer para lista de músicas */}
      <Drawer
        anchor="left"
        open={state.drawerOpen}
        onClose={toggleDrawer}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Todas as Músicas
          </Typography>
          <Autocomplete
            freeSolo
            options={state.searchHistory}
            getOptionLabel={(option) => option}
            value={state.searchQuery}
            onInputChange={(event, newInputValue) => {
              setState((prev) => ({
                ...prev,
                searchQuery: newInputValue,
                searchOpen: newInputValue.trim().length > 0,
              }));
            }}
            onChange={(event, newValue) => {
              if (typeof newValue === 'string') {
                const trimmedValue = newValue.trim();
                if (trimmedValue) {
                  // Atualiza histórico: move para o topo se existir, ou adiciona novo
                  setState((prev) => {
                    let newHistory = [...prev.searchHistory];
                    const index = newHistory.indexOf(trimmedValue);
                    if (index > -1) {
                      newHistory.splice(index, 1);
                    }
                    newHistory.unshift(trimmedValue);
                    return {
                      ...prev,
                      searchHistory: newHistory.slice(0, 10), // Limita a 10 itens
                      searchQuery: trimmedValue,
                      searchOpen: true,
                    };
                  });
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Buscar música..."
                sx={{ 
                  width: '100%',
                  mb: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position="end">
                      {state.searchQuery ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              searchQuery: '',
                              searchOpen: false,
                            }))
                          }
                        >
                          <Close />
                        </IconButton>
                      ) : (
                        <Search fontSize="small" />
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Meus repertorios
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                value={newRepertoireName}
                onChange={(event) => setNewRepertoireName(event.target.value)}
                size="small"
                placeholder="Nome do repertorio"
                fullWidth
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    createRepertoire();
                  }
                }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<Add fontSize="small" />}
                onClick={createRepertoire}
                disabled={!newRepertoireName.trim()}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap', px: 2 }}
              >
                Adicionar
              </Button>
            </Stack>
            {state.customRepertoires.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Crie listas personalizadas para organizar suas cifras.
              </Typography>
            ) : (
              state.customRepertoires.map((rep) => (
                <Accordion key={rep.id} disableGutters sx={{ mb: 1 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${rep.id}-content`}
                    id={`${rep.id}-header`}
                    sx={{ alignItems: 'center' }}
                  >
                    <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
                      {rep.name}
                    </Typography>
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        deleteRepertoire(rep.id);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Autocomplete
                      size="small"
                      options={state.files}
                      value={null}
                      onChange={(event, newValue) => addSongToRepertoire(rep.id, newValue)}
                      getOptionLabel={(option) => `${option.title} (${option.artist})`}
                      sx={{ mb: 1 }}
                      noOptionsText="Nenhuma musica encontrada"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Adicionar musica"
                          placeholder="Selecione uma musica"
                        />
                      )}
                      disabled={state.files.length === 0}
                      clearOnBlur
                    />
                    {rep.songKeys.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma musica adicionada ainda.
                      </Typography>
                    ) : (
                      <List disablePadding dense>
                        {rep.songKeys.map((songKey) => {
                          const file = findFileByKey(songKey);
                          if (!file) {
                            return null;
                          }
                          const originalIndex = state.files.findIndex(
                            (f) => f.title === file.title && f.artist === file.artist
                          );
                          return (
                            <ListItem
                              key={`${rep.id}-${songKey}`}
                              disablePadding
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => removeSongFromRepertoire(rep.id, songKey)}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemButton
                                selected={originalIndex === state.currentFileIndex}
                                onClick={() => {
                                  setState((prev) => ({
                                    ...prev,
                                    currentFileIndex: originalIndex,
                                    drawerOpen: false,
                                    searchOpen: false,
                                    searchQuery: '',
                                  }));
                                }}
                              >
                                <ListItemText primary={file.title} secondary={file.artist} />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
          <Divider sx={{ mb: 1 }} />
          {(() => {
            const grouped = state.files.reduce((acc: Record<string, ChordFile[]>, f) => {
              const key = f.artist || 'Artista desconhecido';
              (acc[key] ||= []).push(f);
              return acc;
            }, {} as Record<string, ChordFile[]>);
            const artists = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
            return artists.map((artist) => (
              <Accordion key={artist} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${artist}-content`} id={`${artist}-header`}>
                  <Typography sx={{ fontWeight: 600 }}>{artist}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List disablePadding>
                    {grouped[artist].map((file) => {
                      const originalIndex = state.files.findIndex(
                        (f) => f.title === file.title && f.artist === file.artist
                      );
                      return (
                        <ListItem key={`${file.title}-${originalIndex}`} disablePadding>
                          <ListItemButton
                            selected={originalIndex === state.currentFileIndex}
                            onClick={() => {
                              setState((prev) => ({
                                ...prev,
                                currentFileIndex: originalIndex,
                                drawerOpen: false,
                                searchOpen: false,
                                searchQuery: '',
                              }));
                            }}
                          >
                            <ListItemText primary={file.title} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            ));
          })()}
        </Box>
      </Drawer>

      {/* Área principal de conteúdo */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {state.searchOpen && state.searchQuery ? (
          <Box sx={{ p: 2, overflowY: 'auto' }}>
            <Typography variant="h6">Resultados da busca:</Typography>
            {filteredFiles.length > 0 ? (
              <Stack spacing={1}>
                {filteredFiles.map((file, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    onClick={() => {
                      // Encontra o índice original no array completo
                      const originalIndex = state.files.findIndex((f) => f.title === file.title && f.artist === file.artist);
                      setState((prev) => ({
                        ...prev,
                        currentFileIndex: originalIndex,
                        searchQuery: '', // Limpa a busca
                        searchOpen: false, // Fecha o campo de busca
                      }));
                    }}
                  >
                    {file.title} - {file.artist}
                  </Button>
                ))}
              </Stack>
            ) : (
              <Typography color="textSecondary">Nenhuma música encontrada.</Typography>
            )}
          </Box>
        ) : currentFile ? (
          <>
            {/* Título da música (compacto) */}
            <Paper sx={{ 
              p: 1, 
              mx: 1, 
              mt: 1,
              backgroundColor: '#f9f9f9',
              minHeight: 'auto'
            }}>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {currentFile.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ 
                textAlign: 'center'
              }}>
                {currentFile.artist}
              </Typography>
            </Paper>

            {/* Conteúdo das cifras com scroll */}
            <Box
              ref={contentRef}
              sx={{
                flex: 1,
                p: 2,
                mx: 1,
                mb: 8, // Espaço para controles fixos
                overflowY: 'auto',
                backgroundColor: '#fafafa',
                fontFamily: 'monospace',
                fontSize: isMobile ? '12px' : '14px',
                lineHeight: '2',
                border: '1px solid #ddd',
                borderRadius: 1,
              }}
            >
              {currentFile.content.map((line, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      color: '#d32f2f',
                      fontFamily: 'monospace',
                      fontSize: isMobile ? '12px' : '14px',
                      minHeight: '1.5em',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {transposeText(line.chords, state.transposition)}
                  </Typography>
                  <Typography
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: isMobile ? '12px' : '14px',
                      minHeight: '1.5em',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {line.lyrics}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : state.files.length === 0 ? (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4
          }}>
            <Typography variant="h6" color="textSecondary" sx={{ textAlign: 'center' }}>
              Carregando cifras...
            </Typography>
          </Box>
        ) : null}
      </Box>

      {/* Controles fixos na parte inferior */}
      {currentFile && (
        <Paper sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          backgroundColor: '#1976d2',
          color: 'white',
          zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            {/* Controles de Play */}
            <Fab
              size="small"
              color="secondary"
              onClick={togglePlayPause}
              sx={{ 
                backgroundColor: state.isPlaying ? '#f44336' : '#4caf50',
                '&:hover': {
                  backgroundColor: state.isPlaying ? '#d32f2f' : '#388e3c',
                }
              }}
            >
              {state.isPlaying ? <Pause /> : <PlayArrow />}
            </Fab>

            {/* Controles de Velocidade */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ minWidth: '60px', textAlign: 'center' }}>
                {state.scrollSpeed.toFixed(1)}x
              </Typography>
              <IconButton 
                size="small" 
                onClick={decreaseSpeed}
                sx={{ color: 'white' }}
              >
                <Remove />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={increaseSpeed}
                sx={{ color: 'white' }}
              >
                <Add />
              </IconButton>
            </Stack>

            {/* Controles de Transposição */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'center' }}>
                Tom: {state.transposition > 0 ? '+' : ''}{state.transposition}
              </Typography>
              <IconButton 
                size="small" 
                onClick={decreaseKey}
                sx={{ color: 'white' }}
              >
                <Remove />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={increaseKey}
                sx={{ color: 'white' }}
              >
                <Add />
              </IconButton>
              <Button
                size="small"
                variant="text"
                onClick={resetTransposition}
                sx={{ 
                  color: 'white',
                  minWidth: 'auto',
                  px: 1
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
