import cors = require("cors");
import express = require("express");
import { createServer } from "node:http";

import { ensureDirectories } from "./config/ensureDirectories";
import { IMAGES_DIR, TEMP_DIR } from "./config/paths";
import mapasRouter from "./routes/mapas";
import { carregarClassificador } from "./services/ClassificadorVagas";
import { monitorRouter, anexarWebSocket } from "./routes/monitor";

const app = express();

const porta = 3000;

app.use(cors());
app.use(express.json());

app.use("/mapas", mapasRouter);
app.use("/monitorar", monitorRouter);

app.use("/imagens", express.static(IMAGES_DIR));
app.use("/temp", express.static(TEMP_DIR));

app.get("/saude", (_req, res) => {
  res.json({ status: "ok" });
});

async function iniciarServidor() {
  await ensureDirectories();
  await carregarClassificador();
  console.log("Classificador de vagas carregado.");

  // Cria servidor HTTP para permitir anexar WebSocket
  const httpServer = createServer(app);

  // Anexa WebSocket para monitoramento de vídeo
  anexarWebSocket(httpServer);
  console.log("WebSocket de monitoramento disponível em ws://localhost:" + porta + "/ws/monitor");

  httpServer.listen(porta, () => {
    console.log(`API disponível em http://localhost:${porta}`);
    console.log(`Status da API: http://localhost:${porta}/saude`);
  });
}

iniciarServidor().catch((erro) => {
  console.error("Não foi possível iniciar o servidor:", erro);
  process.exit(1);
});
