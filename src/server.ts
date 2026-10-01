import path from "node:path";
import express = require("express");
import mapasRouter from "./routes/mapas";


const app = express();
const porta = 3000;


app.use(express.json());


app.use("/mapas", mapasRouter);
app.use("/imagens", express.static(path.resolve("data", "images")));


app.get("/editor", (_req, res) => {
  res.sendFile(path.resolve("Frontend", "editor.html"));
});


app.get("/saude", (_req, res) => {
  res.json({ status: "ok" });
});


app.listen(porta, () => {
  console.log(`API disponível em http://localhost:${porta}`);
});