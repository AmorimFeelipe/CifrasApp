import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* O ThemeProvider PRECISA estar por volta do App */}
    <ThemeProvider defaultTheme="dark" storageKey="cifras-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
