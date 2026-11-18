import { cadastrarAdmin } from "../services/Administradores";

async function executar() {
  const usuario = process.env.ADMIN_USUARIO?.trim();
  const senha = process.env.ADMIN_SENHA;
  if (!usuario || usuario.length > 254 || !senha || senha.length < 12 || senha.length > 256) {
    throw new Error("Defina ADMIN_USUARIO (até 254 caracteres) e ADMIN_SENHA (12 a 256 caracteres).");
  }
  if (!(await cadastrarAdmin(usuario, senha))) {
    throw new Error("Já existe um administrador com esse login.");
  }
  console.log("Administrador cadastrado.");
}

executar().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : "Falha ao cadastrar administrador.");
  process.exitCode = 1;
});
