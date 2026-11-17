/*
 * Camada de dados das telas públicas.
 *
 * Hoje responde com dados de exemplo (MOCK), porque o backend ainda não expõe
 * o conceito de "Local" nem o estado de ocupação por bloco. Quando essas rotas
 * existirem, basta trocar o corpo das funções abaixo por chamadas fetch:
 *
 *   GET /locais                      -> ResumoLocal[]
 *   GET /locais/:localID             -> Local (com blocos e contagens)
 *   GET /locais/:localID/blocos/:id  -> Bloco (com a lista de vagas)
 *   POST /parceiros                  -> cadastro de um novo parceiro
 *
 * A assinatura das funções já é assíncrona justamente para que a troca não
 * exija mudanças nas telas.
 */
import type { Bloco, CadastroParceiro, Local, Nivel, ResumoLocal, VagaMapa } from "./tipos";

const ATRASO_SIMULADO = 120;

function responder<T>(valor: T): Promise<T> {
  return new Promise((resolver) => setTimeout(() => resolver(valor), ATRASO_SIMULADO));
}

/** Sorteio determinístico: o mesmo bloco sempre gera o mesmo desenho. */
function gerarVagas(prefixo: string, total: number, livres: number): VagaMapa[] {
  const estados: VagaMapa["Estado"][] = Array.from({ length: total }, (_, i) =>
    i < livres ? "livre" : "ocupada"
  );

  let semente = total * 31 + livres;

  for (let i = estados.length - 1; i > 0; i--) {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    const j = semente % (i + 1);
    const atual = estados[i]!;
    estados[i] = estados[j]!;
    estados[j] = atual;
  }

  return estados.map((estado, i) => ({
    ID: `${prefixo}-${i + 1}`,
    Nome: `${prefixo}${String(i + 1).padStart(2, "0")}`,
    Estado: estado
  }));
}

function criarBloco(nome: string, total: number, livres: number): Bloco {
  return { ID: nome.toLowerCase().replace(/\s+/g, "-"), Nome: nome, Total: total, Livres: livres, Vagas: gerarVagas(nome.replace(/\D/g, "") || nome.slice(-1), total, livres) };
}

const LOCAIS: Local[] = [
  {
    ID: "imt-1",
    Nome: "Instituto Mauá de Tecnologia 1",
    Endereco: "Praça Mauá, 1 — São Caetano do Sul",
    Blocos: [
      criarBloco("Bloco A", 50, 40),
      criarBloco("Bloco B", 50, 45),
      criarBloco("Bloco C", 50, 20),
      criarBloco("Bloco D", 50, 15),
      criarBloco("Bloco E", 50, 10),
      criarBloco("Bloco F", 50, 30),
      criarBloco("Bloco U", 50, 22)
    ]
  },
  {
    ID: "imt-2",
    Nome: "Instituto Mauá de Tecnologia 2",
    Endereco: "Praça Mauá, 2 — São Caetano do Sul",
    Blocos: [criarBloco("Bloco A", 150, 120), criarBloco("Bloco B", 150, 100), criarBloco("Bloco C", 150, 80)]
  },
  {
    ID: "imt-3",
    Nome: "Instituto Mauá de Tecnologia 3",
    Endereco: "Praça Mauá, 3 — São Caetano do Sul",
    Blocos: [criarBloco("Bloco A", 150, 30), criarBloco("Bloco B", 150, 25), criarBloco("Bloco C", 150, 25)]
  },
  {
    ID: "imt-4",
    Nome: "Instituto Mauá de Tecnologia 4",
    Endereco: "Praça Mauá, 4 — São Caetano do Sul",
    Blocos: [criarBloco("Bloco A", 150, 140), criarBloco("Bloco B", 150, 130), criarBloco("Bloco C", 150, 120)]
  }
];

function somar(blocos: Bloco[], campo: "Total" | "Livres"): number {
  return blocos.reduce((soma, bloco) => soma + bloco[campo], 0);
}

export function listarLocais(): Promise<ResumoLocal[]> {
  return responder(
    LOCAIS.map((local) => ({
      ID: local.ID,
      Nome: local.Nome,
      Total: somar(local.Blocos, "Total"),
      Livres: somar(local.Blocos, "Livres")
    }))
  );
}

export function buscarLocal(localID: string): Promise<Local | null> {
  return responder(LOCAIS.find((local) => local.ID === localID) ?? null);
}

export function buscarBloco(localID: string, blocoID: string): Promise<{ local: Local; bloco: Bloco } | null> {
  const local = LOCAIS.find((item) => item.ID === localID);
  const bloco = local?.Blocos.find((item) => item.ID === blocoID);

  return responder(local && bloco ? { local, bloco } : null);
}

/** Faixa de ocupação usada para colorir os selos. */
export function nivelDeVagas(livres: number, total: number): Nivel {
  if (total === 0) return "baixa";

  const proporcao = livres / total;

  if (proporcao >= 0.5) return "alta";
  if (proporcao >= 0.25) return "media";
  return "baixa";
}

/**
 * Envia a solicitacao de cadastro de parceiro.
 *
 * Ainda nao existe rota no backend: por enquanto apenas registra no console e
 * responde com sucesso. Ao criar o endpoint, troque o corpo por:
 *
 *   const resposta = await fetch("/parceiros", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(dados)
 *   });
 *   if (!resposta.ok) throw new Error("Falha ao enviar o cadastro.");
 *
 * A senha nunca deve ser gravada em texto puro: o hash e responsabilidade do backend.
 */
export function enviarCadastroParceiro(dados: CadastroParceiro): Promise<void> {
  const { Senha, ...semSenha } = dados;
  void Senha;
  console.info("Cadastro de parceiro (exemplo, nao enviado):", semSenha);

  return responder(undefined);
}
