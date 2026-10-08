import path from "node:path";
import express = require("express");

import { ensureDirectories } from "./config/ensureDirectories";
import { IMAGES_DIR } from "./config/paths";
import mapasRouter from "./routes/mapas";

const app = express();

const porta = 3000;

app.use(express.json());

app.use("/mapas", mapasRouter);

app.use("/imagens", express.static(IMAGES_DIR));

app.get("/editor", (_req, res) => {
  res.sendFile(path.resolve("frontend", "editor.html"));
});

app.get("/saude", (_req, res) => {
  res.json({ status: "ok" });
});

async function iniciarServidor() {
  await ensureDirectories();

  app.listen(porta, () => {
    console.log(`API disponível em http://localhost:${porta}`);
    console.log(`Editor de vagas: http://localhost:${porta}/editor`);
    console.log(`Status da API: http://localhost:${porta}/saude`);
  });
}

iniciarServidor().catch((erro) => {
  console.error("Não foi possível iniciar o servidor:", erro);
  process.exit(1);
});