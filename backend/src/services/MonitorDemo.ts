import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { IMAGES_DIR, TEMP_DIR, VIDEOS_DIR } from "../config/paths";
import { Fatiador } from "./Fatiador";
import { buscarMapa } from "./MapaStorage";
import { registrarOcupacao } from "./OcupacaoAtual";
import { separarVagas } from "./SeparadorVaga";

// Demonstração para o app: deixa a ocupação dos mapas de teste disponível sem ninguém enviar vídeo.
// Só roda com MONITOR_DEMO=true. Não altera a lógica da IA: usa o Fatiador e o `separarVagas` como
// estão. O MonitorSession não serve aqui porque, sem a otimização de movimento, ele pula frames até
// passar o intervalo e um vídeo curto como o de teste (3 frames) termina antes de analisar algum.

// Mapa "Teste": só tem uma foto, então é analisada uma única vez
const MAPA_FOTO = "Teste";

// Mapa "Video": os frames do vídeo são analisados em sequência, repetindo para sempre
const MAPA_VIDEO = "Video";
const ARQUIVO_VIDEO = "TesteVideo.mp4";
const INTERVALO_SEGUNDOS = 5;
const ESPERA_ERRO_MS = 30000;

// Os polígonos do mapa "Video" foram desenhados na Video.jpg (640x480), que é o vídeo (16:9) dentro de
// um quadro 4:3 com faixas pretas. Os frames saem do vídeo em 16:9, sem faixas, então são encaixados
// no tamanho do mapa do mesmo jeito; sem isso as vagas ficam deslocadas e a IA lê os lugares errados.
const encaixarNoMapa = (frame: Buffer, largura: number, altura: number) =>
  sharp(frame).resize(largura, altura, { fit: "contain", background: "#000000" }).jpeg().toBuffer();

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

async function analisarFoto(): Promise<void> {
  const mapa = await buscarMapa(MAPA_FOTO);
  if (!mapa) throw new Error(`Mapa ${MAPA_FOTO} não encontrado.`);

  const imagem = await readFile(path.join(IMAGES_DIR, mapa.Imagem));
  registrarOcupacao(await separarVagas(imagem, mapa));
  console.log(`[DEMO] ${MAPA_FOTO}: foto analisada.`);
}

async function repetirVideo(): Promise<void> {
  const mapa = await buscarMapa(MAPA_VIDEO);
  if (!mapa) throw new Error(`Mapa ${MAPA_VIDEO} não encontrado.`);

  const frames = await Fatiador.extractFrames({
    inputPath: path.join(VIDEOS_DIR, ARQUIVO_VIDEO),
    outputDir: path.join(TEMP_DIR, "frames_demo-video"),
    intervalSeconds: INTERVALO_SEGUNDOS,
  });
  if (frames.length === 0) throw new Error("Nenhum frame extraído do vídeo.");
  console.log(`[DEMO] ${MAPA_VIDEO}: ${frames.length} frames, repetindo em loop.`);

  for (;;) {
    for (const frame of frames) {
      const imagem = await encaixarNoMapa(await readFile(frame), mapa.Largura, mapa.Altura);
      registrarOcupacao(await separarVagas(imagem, mapa));
      await esperar(INTERVALO_SEGUNDOS * 1000);
    }
  }
}

async function repetirVideoSempre(): Promise<void> {
  for (;;) {
    try {
      await repetirVideo();
    } catch (erro) {
      console.error(`[DEMO] ${MAPA_VIDEO}:`, erro);
      await esperar(ESPERA_ERRO_MS);
    }
  }
}

export function iniciarMonitorDemo(): void {
  console.log("[DEMO] MONITOR_DEMO ligado: analisando os mapas de teste.");
  analisarFoto().catch((erro) => console.error(`[DEMO] ${MAPA_FOTO}:`, erro));
  void repetirVideoSempre();
}
