const { spawn } = require("node:child_process");

const isWindows = process.platform === "win32";
const comandoNpm = isWindows ? "npm.cmd" : "npm";

function iniciar(nome, args, opcoes = {}) {
  const filho = spawn(comandoNpm, args, {
    stdio: "inherit",
    shell: true,
    ...opcoes
  });

  filho.on("error", (erro) => {
    console.error(`[${nome}] erro ao iniciar:`, erro);
  });

  return filho;
}

const backend = iniciar("backend", ["run", "dev"]);
const frontend = iniciar("frontend", ["--prefix", "frontend", "run", "dev"]);

let encerrando = false;

function encerrar(codigo = 0) {
  if (encerrando) return;
  encerrando = true;

  try {
    backend.kill();
  } catch {}

  try {
    frontend.kill();
  } catch {}

  process.exit(codigo);
}

process.on("SIGINT", () => encerrar(0));
process.on("SIGTERM", () => encerrar(0));

backend.on("exit", (codigo) => {
  if (!encerrando) {
    console.error(`\n[backend] processo encerrado com código ${codigo}.`);
    encerrar(codigo ?? 1);
  }
});

frontend.on("exit", (codigo) => {
  if (!encerrando) {
    console.error(`\n[frontend] processo encerrado com código ${codigo}.`);
    encerrar(codigo ?? 1);
  }
});

console.log("Backend:  http://localhost:3000");
console.log("Frontend: http://localhost:5173");
console.log("Pressione Ctrl+C para encerrar ambos.");
