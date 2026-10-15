import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { MODELS_DIR } from "../config/paths";
import type { Mapa } from "../types/Mapa";



const NOME_MODELO = "yolov8n.onnx";
const TAMANHO_ENTRADA = 640;
const CONFIANCA_MINIMA = 0.25;
const CLASSES_VEICULO = new Set([2, 3, 5, 7]);



export type CaixaVeiculo = {
  X: number;
  Y: number;
  Largura: number;
  Altura: number;
  Confianca: number;
  Classe: number;
};



let sessao: ort.InferenceSession | null = null;



function caminhoModelo(): string {
  return path.join(MODELS_DIR, NOME_MODELO);
}



export async function carregarDetector(): Promise<void> {
  if (sessao) return;



  sessao = await ort.InferenceSession.create(caminhoModelo(), {
    executionProviders: ["cpu"]
  });
}



async function prepararEntrada(imagem: Buffer): Promise<Float32Array> {
  const recorte = await sharp(imagem)
    .resize(TAMANHO_ENTRADA, TAMANHO_ENTRADA, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();



  const tensor = new Float32Array(3 * TAMANHO_ENTRADA * TAMANHO_ENTRADA);
  const pixels = TAMANHO_ENTRADA * TAMANHO_ENTRADA;



  for (let i = 0; i < pixels; i++) {
    tensor[i] = recorte[i * 3]! / 255;
    tensor[pixels + i] = recorte[i * 3 + 1]! / 255;
    tensor[2 * pixels + i] = recorte[i * 3 + 2]! / 255;
  }



  return tensor;
}



export async function detectarVeiculos(
  imagem: Buffer,
  mapa: Mapa
): Promise<CaixaVeiculo[]> {
  await carregarDetector();



  if (!sessao) throw new Error("O detector não foi carregado.");
  if (mapa.Vagas.length === 0) return [];



  const metadados = await sharp(imagem).metadata();
  const larguraImagem = metadados.width ?? TAMANHO_ENTRADA;
  const alturaImagem = metadados.height ?? TAMANHO_ENTRADA;



  const tensor = await prepararEntrada(imagem);



  const entradas = {
    images: new ort.Tensor("float32", tensor, [1, 3, TAMANHO_ENTRADA, TAMANHO_ENTRADA])
  };



  const resultados = await sessao.run(entradas);
  const chavesSaida = Object.keys(resultados);
  const primeiraChave = chavesSaida[0];
  if (!primeiraChave) throw new Error("O detector não retornou saída.");
  const saida = resultados[primeiraChave];
  if (!saida) throw new Error("A saída do detector é inválida.");



  const dados = saida.data as Float32Array;
  const dimensoes = saida.dims;
  const quantidadeCaixas = dimensoes[2] ?? 0;
  const candidatos: CaixaVeiculo[] = [];



  for (let i = 0; i < quantidadeCaixas; i++) {
    let melhorClasse = -1;
    let melhorConfianca = 0;



    for (let c = 4; c < 84; c++) {
      const confianca = dados[c * quantidadeCaixas + i]!;

      if (confianca > melhorConfianca) {
        melhorConfianca = confianca;
        melhorClasse = c - 4;
      }
    }



    if (melhorConfianca < CONFIANCA_MINIMA) continue;
    if (!CLASSES_VEICULO.has(melhorClasse)) continue;



    const cx = dados[0 * quantidadeCaixas + i]!;
    const cy = dados[1 * quantidadeCaixas + i]!;
    const w = dados[2 * quantidadeCaixas + i]!;
    const h = dados[3 * quantidadeCaixas + i]!;



    candidatos.push({
      X: (cx - w / 2) * larguraImagem / TAMANHO_ENTRADA,
      Y: (cy - h / 2) * alturaImagem / TAMANHO_ENTRADA,
      Largura: w * larguraImagem / TAMANHO_ENTRADA,
      Altura: h * alturaImagem / TAMANHO_ENTRADA,
      Confianca: melhorConfianca,
      Classe: melhorClasse
    });
  }



  return candidatos;
}