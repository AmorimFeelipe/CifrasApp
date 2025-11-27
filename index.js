// server/serverroutes.ts
import { createServer } from "http";
import fs from "fs";
import path from "path";
var DB_FILE = path.join(process.cwd(), "server", "setlists_db.json");
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, "[]");
}
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler banco de dados:", e);
    return [];
  }
}
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log("\u2705 Dados salvos com sucesso em:", DB_FILE);
  } catch (e) {
    console.error("\u274C Erro ao salvar dados:", e);
  }
}
function registerRoutes(app2) {
  app2.get("/api/setlists", (req, res) => {
    console.log("\u{1F4E5} Recebendo pedido de repert\xF3rios...");
    const setlists = readDB();
    res.json(setlists);
  });
  app2.post("/api/setlists", (req, res) => {
    console.log("\u{1F4BE} Salvando repert\xF3rio...");
    const newSetlists = req.body;
    if (Array.isArray(newSetlists)) {
      writeDB(newSetlists);
      res.json({ success: true, message: "Salvo com sucesso" });
    } else {
      console.error("\u26A0\uFE0F Tentativa de salvar dados inv\xE1lidos");
      res.status(400).json({ error: "Formato inv\xE1lido" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/servervite.ts
import express2 from "express";
import fs2 from "fs";
import path2, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var log = (message, source = "express") => {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};
async function setupVite(app2, server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: path2.resolve(__dirname, "..", "client"),
    // Aponta para a pasta client
    configFile: path2.resolve(__dirname, "..", "vite.config.ts")
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      let template = fs2.readFileSync(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Math.random()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname, "..", "dist");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
