import sharp from "sharp";
import { classificarVaga } from "./ClassificadorVagas";
import type { Mapa } from "../types/Mapa";
import type { OcupacaoMapa, EstadoVaga } from "../types/Ocupacao";

/**
 * Converte os 4 pontos normalizados (0 a 1) de uma vaga para um retângulo
 * delimitador em pixels, com base na largura/altura da imagem analisada.
 */
function pontosParaRetangulo(
  pontos: { X: number; Y: number }[],
  largura: number,
  altura: number
): { x: number; y: number; w: number; h: number } {
  const xs = pontos.map((p) => p.X * largura);
  const ys = pontos.map((p) => p.Y * altura);

  const x = Math.min(largura - 1, Math.max(0, Math.floor(Math.min(...xs))));
  const y = Math.min(altura - 1, Math.max(0, Math.floor(Math.min(...ys))));
  const w = Math.max(1, Math.min(largura - x, Math.ceil(Math.max(...xs) - Math.min(...xs))));
  const h = Math.max(1, Math.min(altura - y, Math.ceil(Math.max(...ys) - Math.min(...ys))));

  return { x, y, w, h };
}

/**
 * Analisa uma imagem contra um mapa e retorna o estado (ocupada/livre)
 * de cada vaga, recortando cada região da vaga e classificando com o
 * modelo treinado (MobileNet V3 Small ONNX).
 */
export async function analisarOcupacao(
  imagem: Buffer,
  mapa: Mapa
): Promise<OcupacaoMapa> {
  const meta = await sharp(imagem).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Não foi possível ler as dimensões da imagem.");
  }
  const largura = meta.width;
  const altura = meta.height;

  const vagas: EstadoVaga[] = await Promise.all(
    mapa.Vagas.map(async (vaga) => {
      const ret = pontosParaRetangulo(vaga.Pontos, largura, altura);

      const recorte = await sharp(imagem)
        .extract({ left: ret.x, top: ret.y, width: ret.w, height: ret.h })
        .toBuffer();

      const { ocupada, confianca } = await classificarVaga(recorte);

      return {
        ID: vaga.ID,
        Nome: vaga.Nome,
        Ocupada: ocupada,
        Sobreposicao: Math.round(confianca * 100) / 100,
      };
    })
  );

  return {
    MapaID: mapa.ID,
    Data: new Date().toISOString(),
    Vagas: vagas,
  };
}