import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Mapa } from "../types/Mapa";

const pastaMapas = path.resolve("data", "maps");
const formatoID = /^[a-zA-Z0-9-]+$/;

function caminhoMapa(ID: string): string {
  if (!formatoID.test(ID)) throw new Error("ID do mapa inválido.");
  return path.join(pastaMapas, `${ID}.json`);
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

export async function criarMapa(mapa: Mapa): Promise<boolean> {
  const caminho = caminhoMapa(mapa.ID);
  await mkdir(pastaMapas, { recursive: true });

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
  await mkdir(pastaMapas, { recursive: true });

  const temporario = path.join(pastaMapas, `${mapa.ID}.${process.pid}.${Date.now()}.tmp`);

  try {
    await writeFile(temporario, JSON.stringify(mapa, null, 2), "utf-8");
    await rename(temporario, caminho);
  } catch (erro) {
    await unlink(temporario).catch(() => {});
    throw erro;
  }
}