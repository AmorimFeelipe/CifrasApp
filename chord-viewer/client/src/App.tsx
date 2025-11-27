import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/RealErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChordViewer from "./components/ChordViewer";

function AppRouter() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Switch>
        <Route path={"/"} component={ChordViewer} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  // FIX CRÍTICO: Calcula a altura real da janela para evitar problemas com barra de endereço mobile
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    
    // Executa ao carregar e ao redimensionar
    window.addEventListener('resize', setAppHeight);
    setAppHeight();
    
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="cifras-ui-theme">
        <TooltipProvider>
          {/* Container Principal Blindado contra Scroll Externo */}
          <div 
            className="flex flex-col w-full bg-background overflow-hidden"
            style={{ height: 'var(--app-height, 100vh)' }}
          >
            <Toaster />
            <AppRouter />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;