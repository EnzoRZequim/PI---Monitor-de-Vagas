import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';

import { buscarOcupacaoDoMapa, type OcupacaoDoBackend } from '@/dados/api';
import type { Bloco } from '@/dados/parceiros';
import { criarSorteio, gerarPlanta, type Planta } from '@/dados/mapaVagas';

// Ocupação das vagas de cada bloco. Os blocos com `mapaId` recebem a ocupação real da IA do backend
// (`sincronizarComBackend`); os demais, e os ligados enquanto o backend ainda não respondeu, usam a
// simulação (`simular`), que imita o que a câmera enviaria.
type EstadoBloco = {
  planta: Planta;
  // IDs das vagas ocupadas
  ocupadas: ReadonlySet<string>;
  // Ocupação de partida, em torno da qual a simulação oscila
  ocupadasBase: number;
  sorteio: () => number;
  // Já recebeu a ocupação real do backend: a simulação para de mexer neste bloco
  real: boolean;
  // Total de vagas informado pelo backend, que vale mais que o do bloco
  totalReal?: number;
};

// A cada intervalo, 1 ou 2 vagas trocam de estado (um carro entra ou sai)
const INTERVALO_SIMULACAO = 5000;

const estados = new Map<string, EstadoBloco>();
const ouvintes = new Set<() => void>();
let versao = 0;

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function notificar() {
  versao++;
  ouvintes.forEach((ouvinte) => ouvinte());
}

const chaveDoBloco = (campusId: string, bloco: Bloco) => `${campusId}/${bloco.id}`;

// Cria a planta e a ocupação inicial na primeira vez que o bloco é pedido: o número de vagas ocupadas
// é exatamente o do cartão do bloco
function estadoDoBloco(campusId: string, bloco: Bloco): EstadoBloco {
  const chave = chaveDoBloco(campusId, bloco);
  let estado = estados.get(chave);
  if (estado) return estado;

  const planta = gerarPlanta({
    letra: bloco.id.charAt(0).toUpperCase(),
    prefixoId: chave,
    total: bloco.vagasTotais,
    vagas: bloco.vagas,
  });

  // Embaralha com semente fixa e ocupa as primeiras
  const sorteio = criarSorteio(chave);
  const ids = planta.Vagas.map((vaga) => vaga.ID);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(sorteio() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const quantidade = Math.min(Math.max(bloco.vagasOcupadas, 0), ids.length);

  estado = { planta, ocupadas: new Set(ids.slice(0, quantidade)), ocupadasBase: quantidade, sorteio, real: false };
  estados.set(chave, estado);
  return estado;
}

export function plantaDoBloco(campusId: string, bloco: Bloco) {
  return estadoDoBloco(campusId, bloco).planta;
}

// Lido pelas listas: antes do mapa ser aberto vale o número do bloco, depois vale o da simulação
export function ocupacaoDoBloco(campusId: string, bloco: Bloco) {
  const estado = estados.get(chaveDoBloco(campusId, bloco));
  return {
    vagasOcupadas: estado ? estado.ocupadas.size : bloco.vagasOcupadas,
    vagasTotais: estado?.totalReal ?? bloco.vagasTotais,
  };
}

function aplicarOcupacao(chave: string, ocupadas: ReadonlySet<string>) {
  const estado = estados.get(chave);
  if (!estado) return;
  estados.set(chave, { ...estado, ocupadas });
  notificar();
}

// Faz 1 ou 2 vagas trocarem de estado. A chance de um carro entrar sobe quando há menos carros que
// na ocupação de partida (e desce quando há mais), para o bloco oscilar em torno do valor dele.
function simular(campusId: string, bloco: Bloco) {
  if (bloco.ocupacaoFixa) return;
  const chave = chaveDoBloco(campusId, bloco);
  const estado = estadoDoBloco(campusId, bloco);
  if (estado.real) return;
  const ocupadas = new Set(estado.ocupadas);
  const total = estado.planta.Vagas.length;
  const trocas = estado.sorteio() < 0.5 ? 1 : 2;

  for (let i = 0; i < trocas; i++) {
    const desvio = (estado.ocupadasBase - ocupadas.size) / Math.max(4, total * 0.1);
    const chanceDeEntrar = Math.min(Math.max(0.5 + desvio * 0.5, 0.1), 0.9);
    const entra = estado.sorteio() < chanceDeEntrar;
    const candidatas = estado.planta.Vagas.filter((vaga) => ocupadas.has(vaga.ID) !== entra);
    if (candidatas.length === 0) continue;
    const vaga = candidatas[Math.floor(estado.sorteio() * candidatas.length)];
    if (entra) ocupadas.add(vaga.ID);
    else ocupadas.delete(vaga.ID);
  }

  aplicarOcupacao(chave, ocupadas);
}

// Troca a ocupação do bloco pela que a IA do backend mediu. Só vagas que existem na planta entram.
function aplicarOcupacaoReal(campusId: string, bloco: Bloco, ocupacao: OcupacaoDoBackend) {
  const chave = chaveDoBloco(campusId, bloco);
  const estado = estadoDoBloco(campusId, bloco);
  const idsDaPlanta = new Set(estado.planta.Vagas.map((vaga) => vaga.ID));
  const ocupadas = new Set(
    ocupacao.Vagas.filter((vaga) => vaga.Ocupada && idsDaPlanta.has(vaga.ID)).map((vaga) => vaga.ID),
  );
  estados.set(chave, { ...estado, ocupadas, real: true, totalReal: ocupacao.Vagas.length });
  notificar();
}

// O backend caiu: o bloco volta para a simulação, partindo da última ocupação real
function voltarParaSimulacao(campusId: string, bloco: Bloco) {
  const estado = estados.get(chaveDoBloco(campusId, bloco));
  if (!estado?.real) return;
  const { totalReal: _totalReal, ...resto } = estado;
  estados.set(chaveDoBloco(campusId, bloco), { ...resto, real: false, ocupadasBase: estado.ocupadas.size });
  notificar();
}

// Re-renderiza a tela quando a ocupação de qualquer bloco muda
export function useOcupacaoAoVivo() {
  return useSyncExternalStore(inscrever, () => versao);
}

// IDs das vagas ocupadas do bloco (re-renderiza a cada mudança)
export function useVagasOcupadas(campusId: string, bloco: Bloco) {
  useOcupacaoAoVivo();
  return estadoDoBloco(campusId, bloco).ocupadas;
}

// Mantém a simulação rodando só enquanto a tela está em foco, para não gastar bateria à toa
export function useSimulacaoAoVivo(campusId: string, bloco: Bloco) {
  useFocusEffect(
    useCallback(() => {
      if (bloco.ocupacaoFixa) return;
      const id = setInterval(() => simular(campusId, bloco), INTERVALO_SIMULACAO);
      return () => clearInterval(id);
    }, [campusId, bloco]),
  );
}

// Blocos de uma tela que têm mapa no backend. Um mapa pode estar ligado a mais de um bloco.
export type BlocoDoCampus = { campusId: string; bloco: Bloco };

// Falhas seguidas antes de largar o dado real: uma só (um tempo limite, por exemplo) não faz a planta
// oscilar entre o real e o simulado
const FALHAS_PARA_SIMULAR = 2;

const AVISADOS = new Set<string>();
const EM_ANDAMENTO = new Set<string>();
const FALHAS_SEGUIDAS = new Map<string, number>();

async function sincronizarMapa(mapaId: string, blocos: BlocoDoCampus[]) {
  if (EM_ANDAMENTO.has(mapaId)) return;
  EM_ANDAMENTO.add(mapaId);
  try {
    const ocupacao = await buscarOcupacaoDoMapa(mapaId);
    blocos.forEach(({ campusId, bloco }) => aplicarOcupacaoReal(campusId, bloco, ocupacao));
    AVISADOS.delete(mapaId);
    FALHAS_SEGUIDAS.delete(mapaId);
  } catch (erro) {
    const falhas = (FALHAS_SEGUIDAS.get(mapaId) ?? 0) + 1;
    FALHAS_SEGUIDAS.set(mapaId, falhas);
    if (falhas >= FALHAS_PARA_SIMULAR) blocos.forEach(({ campusId, bloco }) => voltarParaSimulacao(campusId, bloco));
    // Sem backend ou sem análise ainda: o bloco segue com a simulação. Avisa uma vez por mapa.
    if (!AVISADOS.has(mapaId)) {
      AVISADOS.add(mapaId);
      console.warn(`Ocupação real do mapa "${mapaId}" indisponível, usando a simulação.`, erro);
    }
  } finally {
    EM_ANDAMENTO.delete(mapaId);
  }
}

function sincronizarComBackend(blocos: readonly BlocoDoCampus[]) {
  const porMapa = new Map<string, BlocoDoCampus[]>();
  blocos.forEach((item) => {
    if (!item.bloco.mapaId) return;
    porMapa.set(item.bloco.mapaId, [...(porMapa.get(item.bloco.mapaId) ?? []), item]);
  });
  porMapa.forEach((lista, mapaId) => void sincronizarMapa(mapaId, lista));
}

// Busca a ocupação real dos blocos ligados ao backend, na hora e depois a cada intervalo, só enquanto
// a tela está em foco. Use nas telas que mostram a ocupação (listas e mapa do bloco).
// A lista precisa ter sempre a mesma identidade (use blocosDoCampus/blocosDoParceiro/blocoDoCampus):
// uma lista nova a cada render reiniciaria o intervalo e buscaria de novo a cada atualização.
export function useOcupacaoReal(blocos: readonly BlocoDoCampus[]) {
  useFocusEffect(
    useCallback(() => {
      if (!blocos.some((item) => item.bloco.mapaId)) return;
      const buscar = () => sincronizarComBackend(blocos);
      buscar();
      const id = setInterval(buscar, INTERVALO_SIMULACAO);
      return () => clearInterval(id);
    }, [blocos]),
  );
}
