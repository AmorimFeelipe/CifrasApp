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
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Add,
  Remove,
  Search,
  Close,
  Menu,
} from '@mui/icons-material';
import { ChordFile, parseChordFile } from '../lib/chordParser';
import { transposeText } from '../lib/chordTransposer';

interface ChordViewerState {
  files: ChordFile[];
  currentFileIndex: number;
  transposition: number;
  isPlaying: boolean;
  scrollSpeed: number;
  searchQuery: string;
  searchOpen: boolean;
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
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Toggle search
  const toggleSearch = () => {
    setState((prev) => ({
      ...prev,
      searchOpen: !prev.searchOpen,
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
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
            fontWeight: 'bold',
            flexGrow: 1,
            mr: 2
          }}>
            🎸 Cifras
          </Typography>
          
          {/* Campo de busca colapsável */}
          <Collapse in={state.searchOpen} orientation="horizontal">
            <TextField
              size="small"
              placeholder="Buscar música..."
              value={state.searchQuery}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              sx={{ 
                width: isMobile ? '200px' : '300px',
                backgroundColor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={toggleSearch}>
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Collapse>
          
          <IconButton 
            onClick={toggleSearch}
            sx={{ 
              color: 'white',
              ml: state.searchOpen ? 1 : 0
            }}
          >
            <Search />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Lista de músicas (colapsável) */}
      {filteredFiles.length > 0 && (
        <Paper sx={{ 
          p: 1, 
          mx: 1, 
          mt: 1,
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: '#f5f5f5'
        }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {filteredFiles.map((file, index) => (
              <Button
                key={index}
                variant={state.files[state.currentFileIndex] === file ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    currentFileIndex: state.files.indexOf(file),
                    transposition: 0,
                    isPlaying: false,
                  }));
                }}
                sx={{ 
                  mb: 1,
                  textTransform: 'none',
                  fontSize: '0.75rem'
                }}
              >
                {file.title} - {file.artist}
              </Button>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Área principal de conteúdo */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {currentFile && (
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
        )}

        {!currentFile && state.files.length === 0 && (
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
        )}
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