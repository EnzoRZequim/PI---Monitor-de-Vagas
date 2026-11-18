import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "../config/paths";
import { DatabaseSync } from "node:sqlite";

let banco: DatabaseSync | undefined;

export function abrirBanco(): DatabaseSync {
  if (banco) return banco;

  const caminho = join(DATA_DIR, "vaga-livre.sqlite");
  mkdirSync(DATA_DIR, { recursive: true });
  const conexao = new DatabaseSync(caminho);
  try {
    conexao.exec(`
      PRAGMA busy_timeout = 3000;

      CREATE TABLE IF NOT EXISTS administradores (
        id INTEGER PRIMARY KEY,
        usuario TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS solicitacoes_parceria (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        cnpj TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        senha_hash TEXT NOT NULL,
        nome_contato TEXT NOT NULL,
        telefone TEXT NOT NULL,
        endereco TEXT NOT NULL,
        possui_cameras INTEGER NOT NULL CHECK (possui_cameras IN (0, 1)),
        status TEXT NOT NULL DEFAULT 'pendente',
        criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) STRICT;
    `);
  } catch (erro) {
    conexao.close();
    throw erro;
  }
  banco = conexao;
  return conexao;
}
