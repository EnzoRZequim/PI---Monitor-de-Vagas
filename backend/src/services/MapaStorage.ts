import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAPS_DIR } from "../config/paths";
import type { Mapa } from "../types/Mapa";

const formatoID = /^[a-zA-Z0-9-]+$/;

export type ResumoMapa = {
  ID: string;
  Nome: string;
  Imagem: string;
  QuantidadeVagas: number;
};

function caminhoMapa(ID: string): string {
  if (!formatoID.test(ID)) throw new Error("ID do mapa inválido.");
  return path.join(MAPS_DIR, `${ID}.json`);
}

export async function buscarMapa(ID: string): Promise<Mapa | null> {
  const caminho = caminhoMapa(ID);

  try {
    const conteudo = await readFile(caminho, "utf-8");
    return JSON.parse(conteudo) as Mapa;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw erro;
  }
}

export async function listarMapas(): Promise<ResumoMapa[]> {
  let arquivos: string[];

  try {
    arquivos = await readdir(MAPS_DIR);
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw erro;
  }

  const resumos: ResumoMapa[] = [];

  for (const arquivo of arquivos) {
    if (!arquivo.endsWith(".json")) continue;

    const ID = arquivo.slice(0, -".json".length);
    if (!formatoID.test(ID)) continue;

    const mapa = await buscarMapa(ID).catch(() => null);
    if (!mapa) continue;

    resumos.push({
      ID: mapa.ID,
      Nome: mapa.Nome,
      Imagem: mapa.Imagem,
      QuantidadeVagas: mapa.Vagas.length
    });
  }

  return resumos.sort((a, b) => a.Nome.localeCompare(b.Nome));
}

export async function criarMapa(mapa: Mapa): Promise<boolean> {
  const caminho = caminhoMapa(mapa.ID);
  await mkdir(MAPS_DIR, { recursive: true });

  try {
    await writeFile(caminho, JSON.stringify(mapa, null, 2), { encoding: "utf-8", flag: "wx" });
    return true;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw erro;
  }
}

export async function salvarMapa(mapa: Mapa): Promise<void> {
  const caminho = caminhoMapa(mapa.ID);
  await mkdir(MAPS_DIR, { recursive: true });

  const temporario = path.join(MAPS_DIR, `${mapa.ID}.${process.pid}.${Date.now()}.tmp`);

  try {
    await writeFile(temporario, JSON.stringify(mapa, null, 2), "utf-8");
    await rename(temporario, caminho);
  } catch (erro) {
    await unlink(temporario).catch(() => {});
    throw erro;
  }
}