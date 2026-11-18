import { Router } from "express";
import { z } from "zod";
import { badRequest, conflict, createError, created, internalError, sendResponse } from "../common/ResponseHelper";
import { cnpjValido } from "../common/cnpj";
import { gerarHashSenha } from "../services/Administradores";
import { abrirBanco } from "../services/BancoDados";
import { origemPermitida } from "./auth";

const router = Router();
const formulario = z.object({
  nome: z.string().trim().min(1).max(200),
  cnpj: z.string().trim().max(18)
    .transform(valor => valor.replace(/[.\/-]/g, "").toUpperCase())
    .refine(cnpjValido, "CNPJ inválido."),
  email: z.string().trim().max(254).email(),
  senha: z.string().min(8).max(256),
  nomeContato: z.string().trim().min(1).max(200),
  telefone: z.string().trim().max(20).regex(/^[0-9() -]+$/)
    .transform(valor => valor.replace(/\D/g, "")).pipe(z.string().regex(/^\d{10,11}$/)),
  endereco: z.string().trim().min(1).max(500),
  possuiCameras: z.boolean()
});

let enviosEmAndamento = 0;

router.post("/", async (req, res) => {
  if (!origemPermitida(req)) return sendResponse(res, createError("Origem não autorizada.", 403));
  if (!req.is("application/json")) return sendResponse(res, createError("Envie os dados em JSON.", 415));

  const entrada = formulario.safeParse(req.body);
  if (!entrada.success) {
    return sendResponse(res, badRequest("Confira o CNPJ, a senha, os dados de contato e os demais campos."));
  }

  if (enviosEmAndamento >= 4) {
    return sendResponse(res, createError("Servidor ocupado. Tente novamente em instantes.", 503));
  }

  const { nome, cnpj, email, senha, nomeContato, telefone, endereco, possuiCameras } = entrada.data;
  enviosEmAndamento++;
  try {
    const banco = abrirBanco();
    const duplicado = banco.prepare("SELECT id FROM solicitacoes_parceria WHERE cnpj = ?").get(cnpj);
    if (duplicado) return sendResponse(res, conflict("Já existe uma solicitação para este CNPJ."));
    const senhaHash = await gerarHashSenha(senha);
    const resultado = banco.prepare(`
      INSERT INTO solicitacoes_parceria (nome, cnpj, email, senha_hash, nome_contato, telefone, endereco, possui_cameras)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (cnpj) DO NOTHING
    `).run(nome, cnpj, email, senhaHash, nomeContato, telefone, endereco, Number(possuiCameras));

    if (!resultado.changes) {
      return sendResponse(res, conflict("Já existe uma solicitação para este CNPJ."));
    }
    return sendResponse(res, created("Solicitação recebida.", {
      id: Number(resultado.lastInsertRowid), status: "pendente"
    }));
  } catch {
    return sendResponse(res, internalError("Não foi possível salvar a solicitação."));
  } finally {
    enviosEmAndamento--;
  }
});

export default router;
