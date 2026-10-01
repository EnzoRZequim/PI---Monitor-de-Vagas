import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer = require("multer");
import sharp = require("sharp");
import { z } from "zod";
import { badRequest, conflict, created, internalError, notFound, ok, sendResponse, updated } from "../commun/ResponseHelper";
import { buscarMapa, criarMapa, salvarMapa } from "../services/MapaStorage";
import type { Mapa } from "../types/Mapa";

const router = Router();
const pastaImagens = path.resolve("data", "images");
const formatoID = /^[a-zA-Z0-9-]+$/;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 }
});
const formatoVagas = z.object({
  Vagas: z.array(z.object({
    ID: z.string().min(1),
    Nome: z.string().min(1),
    Pontos: z.array(z.object({
      X: z.number().min(0).max(1),
      Y: z.number().min(0).max(1)
    })).min(3)
  })).refine(vagas => new Set(vagas.map(vaga => vaga.ID)).size === vagas.length)
});

router.post("/", upload.single("Imagem"), async (req, res) => {
  const { ID, Nome } = req.body;

  if (typeof ID !== "string" || !formatoID.test(ID)) {
    return sendResponse(res, badRequest("ID inválido. Use letras, números e hífens."));
  }

  if (typeof Nome !== "string" || !Nome.trim()) {
    return sendResponse(res, badRequest("Nome é obrigatório."));
  }

  if (!req.file) return sendResponse(res, badRequest("Envie uma imagem no campo Imagem."));

  let Largura: number;
  let Altura: number;
  let extensao: string;

  try {
    const dados = await sharp(req.file.buffer).metadata();

    if (dados.format !== "jpeg" && dados.format !== "png") {
      return sendResponse(res, badRequest("A imagem deve ser JPG ou PNG."));
    }

    if (!dados.width || !dados.height) {
      return sendResponse(res, badRequest("Não foi possível ler as dimensões da imagem."));
    }

    Largura = dados.width;
    Altura = dados.height;
    extensao = dados.format === "jpeg" ? "jpg" : "png";
  } catch {
    return sendResponse(res, badRequest("Arquivo de imagem inválido."));
  }

  const Imagem = `${ID}.${extensao}`;
  const caminhoImagem = path.join(pastaImagens, Imagem);
  const mapa: Mapa = { ID, Nome: Nome.trim(), Imagem, Largura, Altura, Vagas: [] };
  let imagemCriada = false;

  try {
    await mkdir(pastaImagens, { recursive: true });
    await writeFile(caminhoImagem, req.file.buffer, { flag: "wx" });
    imagemCriada = true;

    const criadoComSucesso = await criarMapa(mapa);

    if (!criadoComSucesso) {
      await unlink(caminhoImagem);
      return sendResponse(res, conflict("Já existe um mapa com esse ID."));
    }

    return sendResponse(res, created("Mapa criado com sucesso.", mapa));
  } catch (erro) {
    if (imagemCriada) await unlink(caminhoImagem).catch(() => {});
    if ((erro as NodeJS.ErrnoException).code === "EEXIST") {
      return sendResponse(res, conflict("Já existe uma imagem com esse ID."));
    }

    console.error("Erro ao criar mapa:", erro);
    return sendResponse(res, internalError());
  }
});

router.get("/:ID", async (req, res) => {
  const ID = req.params.ID;
  if (!ID || !formatoID.test(ID)) return sendResponse(res, badRequest("ID inválido. Use letras, números e hífens."));

  try {
    const mapa = await buscarMapa(ID);
    if (!mapa) return sendResponse(res, notFound("Mapa não encontrado."));
    return sendResponse(res, ok("Mapa encontrado.", mapa));
  } catch (erro) {
    console.error("Erro ao buscar mapa:", erro);
    return sendResponse(res, internalError());
  }
});

router.put("/:ID/vagas", async (req, res) => {
  const ID = req.params.ID;
  if (!ID || !formatoID.test(ID)) return sendResponse(res, badRequest("ID inválido. Use letras, números e hífens."));

  const resultado = formatoVagas.safeParse(req.body);
  if (!resultado.success) return sendResponse(res, badRequest("Vagas inválidas: informe IDs únicos e pelo menos 3 pontos por vaga, com X e Y entre 0 e 1."));

  try {
    const mapa = await buscarMapa(ID);
    if (!mapa) return sendResponse(res, notFound("Mapa não encontrado."));

    mapa.Vagas = resultado.data.Vagas;
    await salvarMapa(mapa);
    return sendResponse(res, updated("Vagas atualizadas com sucesso.", mapa));
  } catch (erro) {
    console.error("Erro ao salvar vagas:", erro);
    return sendResponse(res, internalError());
  }
});

export default router;