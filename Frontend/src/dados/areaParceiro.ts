import { useSyncExternalStore } from 'react';

import { buscarParceiro, type Bloco, type Ocupacao } from '@/dados/parceiros';

// Dados provisórios até a integração com a API do backend: as alterações feitas na área do parceiro
// ficam só na memória e somem ao recarregar a página
export type BlocoParceiro = Bloco & {
  // Bloco desligado não entra na contagem de vagas monitoradas
  ativo: boolean;
};

export type LocalParceiro = {
  id: string;
  nome: string;
  endereco: string;
  camerasAtivas: number;
  camerasTotais: number;
  blocos: BlocoParceiro[];
};

// Sem autenticação ainda: a área do parceiro sempre abre como o IMT
export const parceiroLogado = buscarParceiro('imt')!;

const DETALHES: Record<string, Pick<LocalParceiro, 'endereco' | 'camerasAtivas' | 'camerasTotais'>> = {
  'sao-caetano': { endereco: 'Praça Mauá, 1', camerasAtivas: 12, camerasTotais: 12 },
  'sao-paulo': { endereco: 'Rua Pedro de Toledo, 1071', camerasAtivas: 8, camerasTotais: 8 },
};

let locais: LocalParceiro[] = parceiroLogado.campi.map((campus) => ({
  id: campus.id,
  nome: campus.nome,
  ...(DETALHES[campus.id] ?? { endereco: '', camerasAtivas: 0, camerasTotais: 0 }),
  blocos: campus.blocos.map((bloco) => ({ ...bloco, ativo: true })),
}));

const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function definir(novos: LocalParceiro[]) {
  locais = novos;
  ouvintes.forEach((ouvinte) => ouvinte());
}

// Re-renderiza a tela quando um local é criado, editado ou removido
export function useLocaisParceiro() {
  return useSyncExternalStore(inscrever, () => locais);
}

// Cria o local ou substitui o que tiver o mesmo id
export function salvarLocal(local: LocalParceiro) {
  const existe = locais.some((l) => l.id === local.id);
  definir(existe ? locais.map((l) => (l.id === local.id ? local : l)) : [...locais, local]);
}

export function removerLocal(id: string) {
  definir(locais.filter((l) => l.id !== id));
}

export function novoId(prefixo: string) {
  return `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function porcentagem(parte: number, total: number) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

// Soma só os blocos ativos
export function ocupacaoDoLocal(local: LocalParceiro): Ocupacao {
  return local.blocos
    .filter((bloco) => bloco.ativo)
    .reduce(
      (total, bloco) => ({
        vagasOcupadas: total.vagasOcupadas + bloco.vagasOcupadas,
        vagasTotais: total.vagasTotais + bloco.vagasTotais,
      }),
      { vagasOcupadas: 0, vagasTotais: 0 },
    );
}

// Números dos cartões do painel
export function resumoDosLocais(lista: LocalParceiro[]) {
  const ocupacoes = lista.map(ocupacaoDoLocal);
  const somar = (valores: number[]) => valores.reduce((total, valor) => total + valor, 0);

  return {
    locaisAtivos: lista.filter((local) => local.blocos.some((bloco) => bloco.ativo)).length,
    blocosAtivos: somar(lista.map((local) => local.blocos.filter((bloco) => bloco.ativo).length)),
    vagasOcupadas: somar(ocupacoes.map((o) => o.vagasOcupadas)),
    vagasTotais: somar(ocupacoes.map((o) => o.vagasTotais)),
    camerasAtivas: somar(lista.map((local) => local.camerasAtivas)),
    camerasTotais: somar(lista.map((local) => local.camerasTotais)),
  };
}
