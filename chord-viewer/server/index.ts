import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- CABEÇALHOS PARA FINGIR SER UM NAVEGADOR (EVITA BLOQUEIOS) ---
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.google.com/",
};

// --- ROTA DE BUSCA (AGORA USANDO DUCKDUCKGO LITE) ---
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);

  try {
    // Limpeza: remove termos comuns para focar no nome da música
    const cleanQuery = query.replace(/cifra|club|tablatura/gi, "").trim();

    // Estratégia: DuckDuckGo Lite (HTML Puro, difícil de bloquear)
    const url = "https://lite.duckduckgo.com/lite/";
    const searchPayload = new URLSearchParams();
    searchPayload.append("q", `${cleanQuery} site:cifraclub.com.br`);
    searchPayload.append("kl", "br-pt"); // Região Brasil

    console.log(`🔍 Buscando no DDG Lite: ${cleanQuery}...`);

    const { data } = await axios.post(url, searchPayload, {
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://lite.duckduckgo.com",
      },
    });

    const $ = cheerio.load(data);
    const results: any[] = [];

    // O DDG Lite retorna uma tabela. Os links estão na classe .result-link
    $(".result-link").each((_, el) => {
      const href = $(el).attr("href");
      const title = $(el).text();

      if (
        href &&
        href.includes("cifraclub.com.br") &&
        !href.includes("/letra/")
      ) {
        // Remove sufixos do título para ficar limpo
        const cleanTitle = title
          .replace(" | Cifra Club", "")
          .replace(" - Cifra Club", "")
          .trim();

        results.push({ title: cleanTitle, path: href });
      }
    });

    // Remove duplicatas e limita a 10 resultados
    const unique = results
      .filter((v, i, a) => a.findIndex(v2 => v2.path === v.path) === i)
      .slice(0, 10);

    console.log(`✅ Encontrados: ${unique.length} resultados.`);
    res.json(unique);
  } catch (error) {
    console.error("❌ Erro na busca:", error);
    // Retorna array vazio em vez de erro para não quebrar o front
    res.json([]);
  }
});

// --- ROTA DE EXTRAÇÃO (LEITURA DA PÁGINA) ---
app.get("/api/extract", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "URL necessária" });

  try {
    console.log(`📥 Baixando cifra: ${url}`);

    // Tenta baixar a página
    const { data } = await axios.get(url, { headers: BROWSER_HEADERS });
    const $ = cheerio.load(data);

    const title = $("h1.t1").text().trim() || "Desconhecido";
    const artist = $("h2.t3").text().trim() || "Desconhecido";

    // Tenta pegar o tom (pode ser um link 'a' ou span direto)
    let tom = $("#cifra_tom a").text().trim();
    if (!tom) tom = $("#cifra_tom").text().trim();
    if (!tom) tom = "N/A";

    // Extrai o conteúdo do container <pre>
    // O CifraClub usa <pre> e dentro dele <b> para acordes.
    // O cheerio .text() remove as tags e deixa só o texto, o que é ótimo, mas perde a distinção do acorde.
    // Vamos pegar o HTML e limpar manualmente para manter a estrutura.

    const preContainer = $("pre").first();

    if (preContainer.length === 0) {
      throw new Error("Container de cifra não encontrado");
    }

    let content = "";

    // Itera sobre os nós de texto e tags para reconstruir a cifra
    preContainer.contents().each((_, el) => {
      if (el.type === "text") {
        content += el.data;
      } else if (el.type === "tag") {
        if (el.name === "b") content += $(el).text(); // Acorde
        if (el.name === "br") content += "\n"; // Quebra de linha
      }
    });

    // Limpeza Final: Remove tablaturas (linhas com muitos hifens ou cordas E| A|)
    const cleanLines = content.split("\n").filter(line => {
      const isTab =
        /^[eBGDAE]\|/.test(line.trim()) || (line.match(/-/g) || []).length > 6;
      return !isTab;
    });

    // Remove excesso de quebras de linha
    const finalContent = cleanLines.join("\n").replace(/\n{3,}/g, "\n\n");

    res.json({
      title,
      artist,
      key: tom,
      content: finalContent,
    });
  } catch (error) {
    console.error("❌ Erro ao extrair:", error);
    res
      .status(500)
      .json({
        error: "Falha ao ler a cifra. O site pode ter bloqueado o acesso.",
      });
  }
});

// --- CONFIGURAÇÃO PADRÃO DO EXPRESS/VITE (NÃO ALTERAR) ---

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
