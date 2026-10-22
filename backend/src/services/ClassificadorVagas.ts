import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { MODELS_DIR } from "../config/paths";

const NOME_MODELO = "classificador_vagas.onnx";
const TAMANHO_ENTRADA = 128;
const LIMIAR_OCUPADA = 0.5;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let sessaoPromise: Promise<ort.InferenceSession> | null = null;

export function carregarClassificador(): Promise<ort.InferenceSession> {
  if (!sessaoPromise) {
    sessaoPromise = ort.InferenceSession.create(
      path.join(MODELS_DIR, NOME_MODELO),
      { executionProviders: ["cpu"] }
    ).catch((erro) => {
      sessaoPromise = null;
      throw erro;
    });
  }
  return sessaoPromise;
}

async function prepararEntrada(recorteBuffer: Buffer): Promise<Float32Array> {
  const { data, info } = await sharp(recorteBuffer)
    .resize(TAMANHO_ENTRADA, TAMANHO_ENTRADA, { fit: "fill" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 3) {
    throw new Error(`Esperado 3 canais, recebido ${info.channels}.`);
  }

  const pixels = TAMANHO_ENTRADA * TAMANHO_ENTRADA;
  const tensor = new Float32Array(3 * pixels);

  for (let i = 0; i < pixels; i++) {
    const base = i * 3;
    tensor[i] = (data[base]! / 255 - MEAN[0]!) / STD[0]!;
    tensor[pixels + i] = (data[base + 1]! / 255 - MEAN[1]!) / STD[1]!;
    tensor[2 * pixels + i] = (data[base + 2]! / 255 - MEAN[2]!) / STD[2]!;
  }

  return tensor;
}

export async function classificarVaga(
  recorteBuffer: Buffer
): Promise<{ ocupada: boolean; confianca: number }> {
  const sessao = await carregarClassificador();
  const tensor = await prepararEntrada(recorteBuffer);

  const resultados = await sessao.run({
    input: new ort.Tensor("float32", tensor, [1, 3, TAMANHO_ENTRADA, TAMANHO_ENTRADA]),
  });

  const saida = resultados["logits"];
  if (!saida) throw new Error("O classificador não retornou saída.");

  const logit = (saida.data as Float32Array)[0]!;
  const probabilidade = 1 / (1 + Math.exp(-logit));

  return { ocupada: probabilidade >= LIMIAR_OCUPADA, confianca: probabilidade };
}