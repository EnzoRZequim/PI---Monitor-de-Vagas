import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { abrirBanco } from "./BancoDados";

const opcoes = { N: 2 ** 17, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };

function derivarChave(senha: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    scrypt(senha, salt, 64, opcoes, (erro, chave) => {
      if (erro) rejeitar(erro);
      else resolver(chave);
    });
  });
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const chave = await derivarChave(senha, salt);
  return `${salt.toString("hex")}:${chave.toString("hex")}`;
}

export async function cadastrarAdmin(usuario: string, senha: string): Promise<boolean> {
  const hash = await gerarHashSenha(senha);
  return abrirBanco().prepare(`
    INSERT INTO administradores (usuario, senha_hash) VALUES (?, ?)
    ON CONFLICT (usuario) DO NOTHING
  `).run(usuario, hash).changes === 1;
}

export async function validarAdmin(usuario: string, senha: string): Promise<boolean> {
  const registro = abrirBanco().prepare(
    "SELECT senha_hash FROM administradores WHERE usuario = ?"
  ).get(usuario);
  const hash = typeof registro?.senha_hash === "string" ? registro.senha_hash : "";
  const partes = /^([0-9a-f]{32}):([0-9a-f]{128})$/.exec(hash);
  // Executa a mesma derivação mesmo quando o usuário não existe.
  const salt = partes?.[1] ? Buffer.from(partes[1], "hex") : Buffer.alloc(16);
  const esperado = partes?.[2] ? Buffer.from(partes[2], "hex") : Buffer.alloc(64);
  const chave = await derivarChave(senha, salt);
  return timingSafeEqual(chave, esperado) && !!partes;
}
