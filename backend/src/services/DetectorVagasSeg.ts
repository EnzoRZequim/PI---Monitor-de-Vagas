import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { MODELS_DIR } from "../config/paths";

const NOME_MODELO = "vagas_seg.onnx";
const TAMANHO_ENTRADA = 640;
const CONFIANCA_MINIMA = 0.45;
const IOU_NMS = 0.45;

export type PoligonoVaga = {
    Pontos: {
        X: number;
        Y: number;
    }[];
};

type Caixa = {
    X1: number;
    Y1: number;
    X2: number;
    Y2: number;
    Confianca: number;
};

let sessao: ort.InferenceSession | null = null;

function caminhoModelo(): string {
    return path.join(MODELS_DIR, "mapa", NOME_MODELO);
}

export async function carregarDetectorVagas(): Promise<void> {
    if (sessao) return;

    sessao = await ort.InferenceSession.create(caminhoModelo(), {
        executionProviders: ["cpu"]
    });
}

type PreparoImagem = {
    tensor: Float32Array;
    escala: number;
    offsetX: number;
    offsetY: number;
    larguraOriginal: number;
    alturaOriginal: number;
};

async function prepararEntrada(
    imagem: Buffer
): Promise<PreparoImagem> {
    const metadados = await sharp(imagem).metadata();

    const larguraOriginal = metadados.width ?? TAMANHO_ENTRADA;
    const alturaOriginal = metadados.height ?? TAMANHO_ENTRADA;

    const escala = Math.min(
        TAMANHO_ENTRADA / larguraOriginal,
        TAMANHO_ENTRADA / alturaOriginal
    );

    const novaLargura = Math.round(larguraOriginal * escala);
    const novaAltura = Math.round(alturaOriginal * escala);

    const offsetX = Math.round((TAMANHO_ENTRADA - novaLargura) / 2);
    const offsetY = Math.round((TAMANHO_ENTRADA - novaAltura) / 2);

    const imagemRedimensionada = await sharp(imagem)
        .resize(novaLargura, novaAltura, { fit: "fill" })
        .removeAlpha()
        .raw()
        .toBuffer();

    const fundo = Buffer.alloc(
        TAMANHO_ENTRADA * TAMANHO_ENTRADA * 3,
        114
    );

    for (let y = 0; y < novaAltura; y++) {
        const origem = y * novaLargura * 3;
        const destino = ((y + offsetY) * TAMANHO_ENTRADA + offsetX) * 3;

        imagemRedimensionada.copy(
            fundo,
            destino,
            origem,
            origem + novaLargura * 3
        );
    }

    const tensor = new Float32Array(3 * TAMANHO_ENTRADA * TAMANHO_ENTRADA);
    const pixels = TAMANHO_ENTRADA * TAMANHO_ENTRADA;

    for (let i = 0; i < pixels; i++) {
        tensor[i] = fundo[i * 3]! / 255;
        tensor[pixels + i] = fundo[i * 3 + 1]! / 255;
        tensor[2 * pixels + i] = fundo[i * 3 + 2]! / 255;
    }

    return {
        tensor,
        escala,
        offsetX,
        offsetY,
        larguraOriginal,
        alturaOriginal
    };
}

function aplicarNMS(caixas: Caixa[]): Caixa[] {
    const ordenadas = [...caixas].sort(
        (a, b) => b.Confianca - a.Confianca
    );

    const selecionadas: Caixa[] = [];

    for (const caixa of ordenadas) {
        let manter = true;

        for (const selecionada of selecionadas) {
            const iou = calcularIOU(caixa, selecionada);

            if (iou > IOU_NMS) {
                manter = false;
                break;
            }
        }

        if (manter) {
            selecionadas.push(caixa);
        }
    }

    return selecionadas;
}

function calcularIOU(a: Caixa, b: Caixa): number {
    const x1 = Math.max(a.X1, b.X1);
    const y1 = Math.max(a.Y1, b.Y1);
    const x2 = Math.min(a.X2, b.X2);
    const y2 = Math.min(a.Y2, b.Y2);

    const larguraIntersecao = Math.max(0, x2 - x1);
    const alturaIntersecao = Math.max(0, y2 - y1);

    const areaIntersecao = larguraIntersecao * alturaIntersecao;

    const areaA = (a.X2 - a.X1) * (a.Y2 - a.Y1);
    const areaB = (b.X2 - b.X1) * (b.Y2 - b.Y1);

    const areaUniao = areaA + areaB - areaIntersecao;

    if (areaUniao <= 0) return 0;

    return areaIntersecao / areaUniao;
}

function converterParaImagemOriginal(
    caixa: Caixa,
    preparo: PreparoImagem
): Caixa {
    const { escala, offsetX, offsetY, larguraOriginal, alturaOriginal } =
        preparo;

    const limitarX = (valor: number) =>
        Math.max(0, Math.min(larguraOriginal, valor));
    const limitarY = (valor: number) =>
        Math.max(0, Math.min(alturaOriginal, valor));

    return {
        X1: limitarX((caixa.X1 - offsetX) / escala),
        Y1: limitarY((caixa.Y1 - offsetY) / escala),
        X2: limitarX((caixa.X2 - offsetX) / escala),
        Y2: limitarY((caixa.Y2 - offsetY) / escala),
        Confianca: caixa.Confianca
    };
}

function criarPoligono(caixa: Caixa, preparo: PreparoImagem): PoligonoVaga {
    const { larguraOriginal, alturaOriginal } = preparo;

    const normalizarX = (valor: number) =>
        Math.max(0, Math.min(1, valor / larguraOriginal));

    const normalizarY = (valor: number) =>
        Math.max(0, Math.min(1, valor / alturaOriginal));

    return {
        Pontos: [
            {
                X: normalizarX(caixa.X1),
                Y: normalizarY(caixa.Y1)
            },
            {
                X: normalizarX(caixa.X2),
                Y: normalizarY(caixa.Y1)
            },
            {
                X: normalizarX(caixa.X2),
                Y: normalizarY(caixa.Y2)
            },
            {
                X: normalizarX(caixa.X1),
                Y: normalizarY(caixa.Y2)
            }
        ]
    };
}

export async function detectarVagas(
    imagem: Buffer
): Promise<PoligonoVaga[]> {
    await carregarDetectorVagas();

    if (!sessao) {
        throw new Error("O detector de vagas não foi carregado.");
    }

    const preparo = await prepararEntrada(imagem);

    const entradas = {
        images: new ort.Tensor(
            "float32",
            preparo.tensor,
            [1, 3, TAMANHO_ENTRADA, TAMANHO_ENTRADA]
        )
    };

    const resultados = await sessao.run(entradas);

    const chaves = Object.keys(resultados);
    const chave = chaves[0];

    if (!chave) throw new Error("O modelo não retornou saída.");

    const saida = resultados[chave]!;
    const dados = saida.data as Float32Array;
    const dimensoes = saida.dims;

    const quantidadeCaixas = dimensoes[2] ?? 0;
    const candidatas: Caixa[] = [];

    for (let i = 0; i < quantidadeCaixas; i++) {
        const confianca = dados[4 * quantidadeCaixas + i]!;

        if (confianca < CONFIANCA_MINIMA) continue;

        const cx = dados[0 * quantidadeCaixas + i]!;
        const cy = dados[1 * quantidadeCaixas + i]!;
        const largura = dados[2 * quantidadeCaixas + i]!;
        const altura = dados[3 * quantidadeCaixas + i]!;

        candidatas.push({
            X1: cx - largura / 2,
            Y1: cy - altura / 2,
            X2: cx + largura / 2,
            Y2: cy + altura / 2,
            Confianca: confianca
        });
    }

    const filtradas = aplicarNMS(candidatas);

    return filtradas
        .map((caixa) => converterParaImagemOriginal(caixa, preparo))
        .map((caixa) => criarPoligono(caixa, preparo));
}