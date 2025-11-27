import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";

// Caminho para o arquivo que servirá de banco de dados
const DB_FILE = path.join(__dirname, "setlists_db.json");

// Função auxiliar para ler o banco de dados
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return []; // Retorna lista vazia se o arquivo não existir
  }
  const data = fs.readFileSync(DB_FILE, "utf-8");
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Função auxiliar para salvar no banco de dados
function writeDB(data: any[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function registerRoutes(app: Express): Server {
  // Rota para PEGAR todos os repertórios
  app.get("/api/setlists", (req, res) => {
    const setlists = readDB();
    res.json(setlists);
  });

  // Rota para CRIAR ou ATUALIZAR a lista completa (Sincronização Simples)
  // Nota: Em um app maior, faríamos rotas separadas para criar/editar, 
  // mas para manter seu hook simples, vamos salvar a lista inteira.
  app.post("/api/setlists", (req, res) => {
    const newSetlists = req.body;
    if (Array.isArray(newSetlists)) {
      writeDB(newSetlists);
      res.json({ success: true, message: "Salvo com sucesso" });
    } else {
      res.status(400).json({ error: "Formato inválido" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}