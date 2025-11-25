import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanChordText = (text: string): string => {
  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      cleanedLines.push("");
      continue;
    }

    if (/[eBGDAE]\|/.test(line) || line.includes('---')) {
      continue;
    }

    const cleanedLine = line.replace(/<[^>]+>/g, '').trimEnd();
    cleanedLines.push(cleanedLine);
  }

  return cleanedLines.join('\n');
};

const scrapeUrl = async (req: Request, res: Response) => {
  const urlToScrape = req.query.url as string;

  if (!urlToScrape) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const { data } = await axios.get(urlToScrape, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);

    const title = $('h1.t1').text().trim() || "N/A";
    const artist = $('h2.t3 a').first().text().trim() || "N/A";

    let key = "N/A";
    const keyElem = $('#cifra_tom').text();
    const keyMatch = keyElem.match(/Tom:\s*([A-G][#b]?)/);
    if (keyMatch) {
      key = keyMatch[1];
    }

    const cifraContainer = $('div.cifra_cnt pre');
    let chords = "Cifra não encontrada.";
    if (cifraContainer.length) {
      const rawText = cifraContainer.text();
      chords = cleanChordText(rawText);
    }

    res.json({ title, artist, key, chords });
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: "Failed to scrape the URL" });
  }
};

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  app.get("/api/scrape", scrapeUrl);

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
