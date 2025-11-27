import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";

// CORREÇÃO: Usamos process.cwd() para pegar a raiz do projeto,
// pois __dirname não funciona nativamente com "type": "module".
const DB_FILE = path.join(process.cwd(), "server", "setlists_db.json");

// Garante que o arquivo existe iniciando com array vazio
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

function writeDB(data: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log("✅ Dados salvos com sucesso em:", DB_FILE);
  } catch (e) {
    console.error("❌ Erro ao salvar dados:", e);
  }
}

export function registerRoutes(app: Express): Server {
  app.get("/api/setlists", (req, res) => {
    console.log("📥 Recebendo pedido de repertórios...");
    const setlists = readDB();
    res.json(setlists);
  });

  app.post("/api/setlists", (req, res) => {
    console.log("💾 Salvando repertório...");
    const newSetlists = req.body;
    if (Array.isArray(newSetlists)) {
      writeDB(newSetlists);
      res.json({ success: true, message: "Salvo com sucesso" });
    } else {
      console.error("⚠️ Tentativa de salvar dados inválidos");
      res.status(400).json({ error: "Formato inválido" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}