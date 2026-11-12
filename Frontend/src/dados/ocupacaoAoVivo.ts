import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';

import type { Bloco } from '@/dados/parceiros';
import { criarSorteio, gerarPlanta, type Planta } from '@/dados/mapaVagas';

// Ocupação das vagas de cada bloco, simulando o que a câmera enviaria. Dados provisórios: quando o
// backend estiver integrado, `aplicarOcupacao` recebe o OcupacaoMapa (Vagas[].Ocupada) no lugar do
// sorteio de `simular`.
type EstadoBloco = {
  planta: Planta;
  // IDs das vagas ocupadas
  ocupadas: ReadonlySet<string>;
  // Ocupação de partida, em torno da qual a simulação oscila
  ocupadasBase: number;
  sorteio: () => number;
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

  estado = { planta, ocupadas: new Set(ids.slice(0, quantidade)), ocupadasBase: quantidade, sorteio };
  estados.set(chave, estado);
  return estado;
}

export function plantaDoBloco(campusId: string, bloco: Bloco) {
  return estadoDoBloco(campusId, bloco).planta;
}

// Lido pelas listas: antes do mapa ser aberto vale o número do bloco, depois vale o da simulação
export function ocupacaoDoBloco(campusId: string, bloco: Bloco) {
  const estado = estados.get(chaveDoBloco(campusId, bloco));
  return { vagasOcupadas: estado ? estado.ocupadas.size : bloco.vagasOcupadas, vagasTotais: bloco.vagasTotais };
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
