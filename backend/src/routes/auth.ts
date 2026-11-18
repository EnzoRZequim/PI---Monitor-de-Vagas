import { randomBytes } from "node:crypto";
import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { badRequest, createError, internalError, ok, sendResponse } from "../common/ResponseHelper";

import { validarAdmin } from "../services/Administradores";

const router = Router();
const cookie = "vaga_livre_admin";
const duracaoSessao = 8 * 60 * 60 * 1000;
const janelaTentativas = 60_000;
const sessoes = new Map<string, { usuario: string; expira: number }>();
const tentativas = new Map<string, { total: number; expira: number }>();

const credenciais = z.object({
  usuario: z.string().trim().min(1).max(254),
  senha: z.string().min(1).max(256),
  transporte: z.enum(["cookie", "bearer"]).default("cookie")
});

const opcoesCookie = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function lerToken(req: Request): string | undefined {
  const autorizacao = req.get("Authorization");
  if (autorizacao) return /^Bearer ([a-f0-9]{64})$/.exec(autorizacao)?.[1];
  const valor = req.headers.cookie?.split(";").map(item => item.trim())
    .find(item => item.startsWith(cookie + "="))?.slice(cookie.length + 1);
  return valor && /^[a-f0-9]{64}$/.test(valor) ? valor : undefined;
}

function buscarSessao(req: Request) {
  const token = lerToken(req);
  const sessao = token ? sessoes.get(token) : undefined;
  return sessao && sessao.expira > Date.now() ? sessao : undefined;
}

export const origemFrontend = process.env.FRONTEND_ORIGEM?.trim() ||
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:8081");

export function origemPermitida(req: Request): boolean {
  const origem = req.get("Origin");
  return !origem || origem === origemFrontend || origem === `${req.protocol}://${req.get("Host")}`;
}

export const exigirAdmin: RequestHandler = (req, res, next) => {
  if (!origemPermitida(req)) {
    sendResponse(res, createError("Origem não autorizada.", 403));
    return;
  }
  if (!buscarSessao(req)) {
    sendResponse(res, createError("Entre como administrador para continuar.", 401));
    return;
  }
  next();
};

function limparSessao(req: Request, res: Response): void {
  const token = lerToken(req);
  if (token) sessoes.delete(token);
  res.clearCookie(cookie, opcoesCookie);
}

router.use((req, res, next) => {
  if (!origemPermitida(req)) {
    sendResponse(res, createError("Origem não autorizada.", 403));
    return;
  }
  res.set("Cache-Control", "no-store");
  next();
});

router.post("/login", async (req, res) => {
  if (!req.is("application/json")) {
    return sendResponse(res, createError("Envie as credenciais em JSON.", 415));
  }
  const entrada = credenciais.safeParse(req.body);
  if (!entrada.success) return sendResponse(res, badRequest("Informe usuário e senha."));

  const agora = Date.now();
  for (const [ip, tentativa] of tentativas) {
    if (tentativa.expira <= agora) tentativas.delete(ip);
  }
  const ip = req.ip ?? "desconhecido";
  const tentativa = tentativas.get(ip) ?? { total: 0, expira: agora + janelaTentativas };
  if (tentativa.total >= 5 || (!tentativas.has(ip) && tentativas.size >= 1_000)) {
    res.set("Retry-After", String(Math.ceil((tentativa.expira - agora) / 1000)));
    return sendResponse(res, createError("Muitas tentativas. Tente novamente em instantes.", 429));
  }

  tentativa.total++;
  tentativas.set(ip, tentativa);

  const { usuario, senha } = entrada.data;
  try {
    if (!(await validarAdmin(usuario, senha))) {
      return sendResponse(res, createError("Usuário ou senha inválidos.", 401));
    }
  } catch {
    return sendResponse(res, internalError("Não foi possível verificar as credenciais."));
  }

  for (const [token, sessao] of sessoes) {
    if (sessao.expira <= agora) sessoes.delete(token);
  }
  const anterior = lerToken(req);
  if (anterior) sessoes.delete(anterior);
  const token = randomBytes(32).toString("hex");
  sessoes.set(token, { usuario, expira: Date.now() + duracaoSessao });
  if (entrada.data.transporte === "bearer") {
    return sendResponse(res, ok("Login realizado.", { usuario, perfil: "admin", token }));
  }
  res.cookie(cookie, token, { ...opcoesCookie, maxAge: duracaoSessao });

  return sendResponse(res, ok("Login realizado.", { usuario, perfil: "admin" }));
});

router.get("/sessao", (req, res) => {
  const sessao = buscarSessao(req);
  if (!sessao) {
    limparSessao(req, res);
    return sendResponse(res, createError("Sessão inválida ou expirada.", 401));
  }

  return sendResponse(res, ok("Sessão ativa.", {
    usuario: sessao.usuario,
    perfil: "admin"
  }));
});

router.post("/logout", (req, res) => {
  if (!req.is("application/json")) {
    return sendResponse(res, createError("Use Content-Type application/json.", 415));
  }
  limparSessao(req, res);
  return sendResponse(res, ok("Sessão encerrada.", { autenticado: false }));
});

export default router;
