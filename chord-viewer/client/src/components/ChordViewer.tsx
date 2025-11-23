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
  Add,
  Remove,
  Search,
  Close,
  Menu,
  Delete,
  ExpandMore as ExpandMoreIcon,
  ArrowBack,
  ChevronLeft,
  ChevronRight,
  TextFields,
} from '@mui/icons-material';
import { ChordFile, parseChordFile } from '../lib/chordParser';
import { transposeText } from '../lib/chordTransposer';

const REPERTOIRE_STORAGE_KEY = 'chordCustomRepertoires';
const BRAND_GRADIENT = 'linear-gradient(135deg, #0f172a, #1d4ed8)';
const PANEL_GRADIENT = 'linear-gradient(160deg, #0b1121, #141b2f)';

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
  fontScale: number;
  searchQuery: string;
  searchOpen: boolean;
  searchHistory: string[];
  drawerOpen: boolean;
  customRepertoires: CustomRepertoire[];
}

export default function ChordViewer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const drawerWidth = isMobile ? '100%' : 340;
  const drawerVariant = isMobile ? 'temporary' : 'persistent';
  const contentMaxWidth = isDesktop ? 1400 : 1100;
  
  const [state, setState] = useState<ChordViewerState>({
    files: [],
    currentFileIndex: 0,
    transposition: 0,
    isPlaying: false,
    scrollSpeed: 1,
    fontScale: 1,
    searchQuery: '',
    searchOpen: false,
    searchHistory: [],
    drawerOpen: false,
    customRepertoires: [],
  });
  const [newRepertoireName, setNewRepertoireName] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Abrir biblioteca por padr?o em telas grandes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      drawerOpen: !isMobile,
    }));
  }, [isMobile]);

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
        const chordFiles = await import.meta.glob('../Chords/*.chords', { query: '?raw', import: 'default' });
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
  setState((prev) => {
    const next = Math.min(prev.scrollSpeed + 0.5, 5);
    return { ...prev, scrollSpeed: next, isPlaying: next > 0 };
  });
};

  // Diminuir velocidade
  const decreaseSpeed = () => {
  setState((prev) => {
    const next = Math.max(prev.scrollSpeed - 0.5, 0);
    return { ...prev, scrollSpeed: next, isPlaying: next > 0 };
  });
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
  const adjustedFontSize = (isMobile ? 13 : 15) * state.fontScale;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: BRAND_GRADIENT,
        color: '#e2e8f0',
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 120px)',
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'rgba(15,23,42,0.82)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: isMobile ? '52px' : '72px',
            justifyContent: 'space-between',
            px: { xs: 1.25, sm: 3 },
            gap: 1.5,
          }}
        >
          <IconButton
            onClick={toggleDrawer}
            sx={{
              color: 'white',
              mr: 1,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Menu />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700 }}>
              CifrasApp
            </Typography>
          </Box>
          {!isMobile && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={toggleDrawer}
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'white',
                textTransform: 'none',
              }}
            >
              Biblioteca
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer principal */}
      <Drawer
        anchor="left"
        variant={drawerVariant}
        open={state.drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: drawerWidth,
            background: 'rgba(15,23,42,0.95)',
            color: '#e2e8f0',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(18px)',
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={toggleDrawer}
              sx={{
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="overline" sx={{ opacity: 0.6 }}>
              Biblioteca
            </Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#f8fafc' }}>
              Todas as músicas
            </Typography>
          </Box>
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: '#e2e8f0',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#e2e8f0',
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(226,232,240,0.6)',
                    },
                  },
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
                          sx={{ color: '#e2e8f0' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      ) : (
                        <Search fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Divider sx={{ mb: 1 }} />
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f8fafc' }}>
              Meus repertórios
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 1.5 }}>
              Organize listas para cada evento ou estilo.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                value={newRepertoireName}
                onChange={(event) => setNewRepertoireName(event.target.value)}
                size="small"
                placeholder="Nova lista"
                fullWidth
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    createRepertoire();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: '#e2e8f0',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.12)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(226,232,240,0.65)',
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<Add fontSize="small" />}
                onClick={createRepertoire}
                disabled={!newRepertoireName.trim()}
                sx={{
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  px: 2,
                  background: 'linear-gradient(135deg,#22d3ee,#6366f1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg,#0ea5e9,#4f46e5)',
                  },
                }}
              >
                Adicionar
              </Button>
            </Stack>
            {state.customRepertoires.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Crie listas personalizadas para organizar suas cifras.
              </Typography>
            ) : (
              state.customRepertoires.map((rep) => (
                <Accordion
                  key={rep.id}
                  disableGutters
                  sx={{
                    mb: 1,
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    borderRadius: 2,
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon htmlColor="#94a3b8" />}
                    aria-controls={`${rep.id}-content`}
                    id={`${rep.id}-header`}
                    sx={{ alignItems: 'center', px: 2 }}
                  >
                    <Typography sx={{ flexGrow: 1, fontWeight: 600, color: '#f8fafc' }}>
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
                      sx={{ color: '#f87171' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pt: 0 }}>
                    <Autocomplete
                      size="small"
                      options={state.files}
                      value={null}
                      onChange={(event, newValue) => addSongToRepertoire(rep.id, newValue)}
                      getOptionLabel={(option) => `${option.title} (${option.artist})`}
                      sx={{ mb: 1 }}
                      noOptionsText="Nenhuma música encontrada"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Adicionar música"
                          placeholder="Selecione uma música"
                          sx={{
                            '& .MuiInputLabel-root': {
                              color: 'rgba(226,232,240,0.7)',
                            },
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              color: '#f8fafc',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.12)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.3)',
                              },
                            },
                          }}
                        />
                      )}
                      disabled={state.files.length === 0}
                      clearOnBlur
                    />
                    {rep.songKeys.length === 0 ? (
                      <Typography variant="body2" sx={{ opacity: 0.8, color: '#f8fafc' }}>
                        Nenhuma música adicionada ainda.
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
                                  sx={{ color: '#f87171' }}
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
                              sx={{
                                borderRadius: 1,
                                color: '#f8fafc',
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(99,102,241,0.2)',
                                },
                              }}
                            >
                                <ListItemText
                                  primary={file.title}
                                  secondary={file.artist}
                                  primaryTypographyProps={{ sx: { color: '#f8fafc' } }}
                                  secondaryTypographyProps={{ sx: { color: 'rgba(226,232,240,0.7)' } }}
                                />
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
              <Accordion
                key={artist}
                disableGutters
                sx={{
                  mb: 1,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon htmlColor="#94a3b8" />}
                  aria-controls={`${artist}-content`}
                  id={`${artist}-header`}
                >
                  <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>{artist}</Typography>
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
                            sx={{
                              borderRadius: 1,
                              color: '#f8fafc',
                              px: 1.5,
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(99,102,241,0.2)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={file.title}
                              primaryTypographyProps={{ sx: { color: '#f8fafc' } }}
                            />
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

      {/* Área principal */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          overflowX: 'hidden',
          p: { xs: 1, sm: 2, md: 4 },
          ml: !isMobile && state.drawerOpen ? `${drawerWidth}px` : 0,
          transition: 'margin-left 0.2s ease',
          }}
        >
          <Stack
            sx={{
              width: '100%',
              maxWidth: contentMaxWidth,
              flex: 1,
              gap: { xs: 1.5, md: 2 },
              pb: currentFile ? { xs: 10, md: 6 } : 2,
            }}
          >
          {currentFile && (
            <Paper
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 2.5,
                background: 'rgba(15,23,42,0.88)',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                Tocando agora
              </Typography>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700, mb: 0.25, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {currentFile.title}
    </Typography>
    <Typography variant="body2" sx={{ color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {currentFile.artist}
    </Typography>
  </Box>
  <Stack direction="row" spacing={0.5} alignItems="center">
    <TextFields fontSize="small" sx={{ color: '#f8fafc' }} />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        fontScale: Math.max(0.8, prev.fontScale - 0.1),
                      }))
                    }
                    sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 32, height: 32 }}
                  >
                    <Remove />
    </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        fontScale: Math.min(1.4, prev.fontScale + 0.1),
                      }))
                    }
                    sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 32, height: 32 }}
                  >
                    <Add />
    </IconButton>
  </Stack>
</Stack>
            </Paper>
          )}

          <Paper
            sx={{
              flex: 1,
              minHeight: { xs: '65vh', md: '70vh' },
              maxHeight: { xs: '80vh', md: '85vh' },
              borderRadius: 2.5,
              background: PANEL_GRADIENT,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 50px rgba(15,23,42,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {state.searchOpen && state.searchQuery ? (
              <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Resultados da busca
                </Typography>
                {filteredFiles.length > 0 ? (
                  <Stack spacing={1}>
                    {filteredFiles.map((file, idx) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        color="inherit"
                        sx={{
                          justifyContent: 'flex-start',
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: '#e2e8f0',
                          textTransform: 'none',
                        }}
                        onClick={() => {
                          const originalIndex = state.files.findIndex(
                            (f) => f.title === file.title && f.artist === file.artist
                          );
                          setState((prev) => ({
                            ...prev,
                            currentFileIndex: originalIndex,
                            searchQuery: '',
                            searchOpen: false,
                          }));
                        }}
                      >
                        {file.title} · {file.artist}
                      </Button>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="rgba(226,232,240,0.7)">
                    Nenhuma música encontrada.
                  </Typography>
                )}
              </Box>
            ) : currentFile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box
                  ref={contentRef}
                  sx={{
                    flex: 1,
                    height: '100%',
                    overflowY: 'auto',
                    p: { xs: 2, md: 3 },
                    pb: { xs: 18, md: 14 },
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: `${adjustedFontSize}px`,
                    lineHeight: 2,
                    color: '#e2e8f0',
                  }}
                >
                  {currentFile.content.map((line, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography
                        component="div"
                        sx={{
                          fontWeight: 600,
                          color: '#fde047',
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
                          minHeight: '1.5em',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          color: '#f8fafc',
                        }}
                      >
                        {line.lyrics}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : state.files.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                }}
              >
                <Typography variant="h6" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                  Carregando cifras...
                </Typography>
              </Box>
            ) : null}
          </Paper>
        </Stack>
      </Box>

          {/* Controles fixos */}
      {currentFile && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 16,
            alignSelf: 'center',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {state.controlsCollapsed ? (
            <IconButton
              size="medium"
              onClick={() => setState((prev) => ({ ...prev, controlsCollapsed: false }))}
              sx={{
                color: 'white',
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                width: 40,
                height: 40,
              }}
            >
              <ChevronRight />
            </IconButton>
          ) : (
            <Paper
              sx={{
                width: { xs: 'calc(100% - 24px)', sm: '70%', md: '60%', lg: '720px' },
                maxWidth: '100%',
                mt: 1.5,
                px: { xs: 1.25, sm: 1.75 },
                py: { xs: 1.1, sm: 1.2 },
                pb: { xs: 'calc(1.1rem + env(safe-area-inset-bottom, 0px))', sm: 'calc(1.1rem + env(safe-area-inset-bottom, 0px))' },
                borderRadius: 10,
                background: 'rgba(15,23,42,0.92)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 16px 30px rgba(15,23,42,0.55)',
              }}
            >
              <Stack
                direction="row"
                spacing={{ xs: 0.75, sm: 1.25 }}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="nowrap"
              >
                <IconButton
                  size="small"
                  onClick={() => setState((prev) => ({ ...prev, controlsCollapsed: true }))}
                  sx={{
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    width: 32,
                    height: 32,
                  }}
                >
                  <ChevronLeft />
                </IconButton>

                {/* Velocidade (auto start/stop) */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton size="small" onClick={decreaseSpeed} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                    <Remove />
                  </IconButton>
                  <Typography variant="caption" sx={{ minWidth: '36px', textAlign: 'center', opacity: 0.8 }}>
                    {state.scrollSpeed.toFixed(1)}x
                  </Typography>
                  <IconButton size="small" onClick={increaseSpeed} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                    <Add />
                  </IconButton>
                </Stack>

                {/* Transposição */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'center', opacity: 0.8 }}>
                    Tom: {state.transposition > 0 ? '+' : ''}{state.transposition}
                  </Typography>
                  <IconButton size="small" onClick={decreaseKey} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                    <Remove />
                  </IconButton>
                  <IconButton size="small" onClick={increaseKey} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                    <Add />
                  </IconButton>
                  <Button size="small" variant="text" onClick={resetTransposition} sx={{ color: 'white', minWidth: 'auto', px: 1, textTransform: 'none' }}>
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}
