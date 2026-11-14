import type { Ponto } from "../types/Mapa";

const SERVICO_SAM = process.env.SAM_URL ?? "http://localhost:8001";

type RespostaSam = {
    Pontos?: unknown;
};

function validarPonto(ponto: unknown): Ponto | null {
    if (typeof ponto !== "object" || ponto === null) return null;

    const candidato = ponto as Record<string, unknown>;
    const X = candidato.X;
    const Y = candidato.Y;

    if (typeof X !== "number" || typeof Y !== "number") return null;
    if (!Number.isFinite(X) || !Number.isFinite(Y)) return null;
    if (X < 0 || X > 1 || Y < 0 || Y > 1) return null;

    return { X, Y };
}

export async function sugerirVaga(imagem: Buffer, ponto: Ponto, tipoImagem: string): Promise<Ponto[]> {
    const formulario = new FormData();
    formulario.append(
        "Imagem",
        new Blob([new Uint8Array(imagem)], { type: tipoImagem }),
        "imagem"
    );
    formulario.append("X", ponto.X.toString());
    formulario.append("Y", ponto.Y.toString());

    const resposta = await fetch(`${SERVICO_SAM}/sugerir-vaga`, {
        method: "POST",
        body: formulario
    });

    if (!resposta.ok) {
        const detalhe = await resposta.text().catch(() => "");
        throw new Error(
            `O serviço de sugestão de vagas respondeu com status ${resposta.status}. ${detalhe}`
        );
    }

    const dados = (await resposta.json()) as RespostaSam;
    const pontosBrutos = dados.Pontos;

    if (!Array.isArray(pontosBrutos) || pontosBrutos.length !== 4) {
        throw new Error("O serviço de sugestão de vagas não retornou exatamente 4 pontos.");
    }

    const pontos = pontosBrutos
        .map(validarPonto)
        .filter((ponto): ponto is Ponto => ponto !== null);

    if (pontos.length !== 4) {
        throw new Error("O serviço de sugestão de vagas retornou pontos inválidos.");
    }

    return pontos;
}