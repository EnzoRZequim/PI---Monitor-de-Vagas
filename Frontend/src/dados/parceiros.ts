import { VAGAS_TESTE, VAGAS_VIDEO } from '@/dados/mapasBackend';
import { ocupacaoDoBloco } from '@/dados/ocupacaoAoVivo';

// Dados provisórios até a integração com a API do backend
export type Bloco = {
  id: string;
  nome: string;
  vagasOcupadas: number;
  vagasTotais: number;
  // Vagas que já existem no backend (mesmo ID e nome); sem isso a planta gera os IDs e nomes
  vagas?: { ID: string; Nome: string }[];
  // A simulação ao vivo não mexe na ocupação deste bloco
  ocupacaoFixa?: boolean;
};

export type Campus = {
  id: string;
  nome: string;
  blocos: Bloco[];
};

export type Parceiro = {
  id: string;
  nome: string;
  campi: Campus[];
};

export type Ocupacao = {
  vagasOcupadas: number;
  vagasTotais: number;
};

const parceirosReais: Parceiro[] = [
  {
    id: 'imt',
    nome: 'Instituto Mauá de Tecnologia',
    campi: [
      {
        id: 'sao-caetano',
        nome: 'IMT - São Caetano',
        blocos: [
          { id: 'a', nome: 'Bloco A', vagasOcupadas: 1, vagasTotais: 100 },
          { id: 'b', nome: 'Bloco B', vagasOcupadas: 50, vagasTotais: 100 },
          { id: 'c', nome: 'Bloco C', vagasOcupadas: 100, vagasTotais: 100 },
          { id: 'd', nome: 'Bloco D', vagasOcupadas: 50, vagasTotais: 100 },
          { id: 'e', nome: 'Bloco E', vagasOcupadas: 23, vagasTotais: 60 },
          { id: 'f', nome: 'Bloco F', vagasOcupadas: 12, vagasTotais: 40 },
        ],
      },
      {
        id: 'sao-paulo',
        nome: 'IMT - São Paulo',
        blocos: [
          { id: 'a', nome: 'Bloco A', vagasOcupadas: 45, vagasTotais: 60 },
          { id: 'b', nome: 'Bloco B', vagasOcupadas: 22, vagasTotais: 40 },
        ],
      },
    ],
  },
  {
    id: 'fmu',
    nome: 'FMU',
    campi: [
      {
        id: 'liberdade',
        nome: 'FMU - Liberdade',
        blocos: [
          { id: 'a', nome: 'Bloco A', vagasOcupadas: 40, vagasTotais: 50 },
          { id: 'b', nome: 'Bloco B', vagasOcupadas: 27, vagasTotais: 50 },
        ],
      },
    ],
  },
  {
    id: 'unicamp',
    nome: 'Unicamp',
    campi: [
      {
        id: 'campinas',
        nome: 'Unicamp - Campinas',
        blocos: [
          { id: 'a', nome: 'Bloco A', vagasOcupadas: 48, vagasTotais: 50 },
          { id: 'b', nome: 'Bloco B', vagasOcupadas: 44, vagasTotais: 50 },
        ],
      },
    ],
  },
  {
    id: 'usp',
    nome: 'USP',
    campi: [
      {
        id: 'butanta',
        nome: 'USP - Butantã',
        blocos: [
          { id: 'a', nome: 'Bloco A', vagasOcupadas: 21, vagasTotais: 50 },
          { id: 'b', nome: 'Bloco B', vagasOcupadas: 20, vagasTotais: 50 },
        ],
      },
    ],
  },
];

// Só em desenvolvimento: campus para testar o mapa de vagas e a integração com o backend
const parceiroDeTeste: Parceiro = {
  id: 'teste',
  nome: 'Ambiente de teste',
  campi: [
    {
      id: 'campus-teste',
      nome: 'Campus de teste',
      blocos: [
        // Mesmas vagas (ID e nome) dos mapas "Teste" e "Video" do backend
        { id: 'teste', nome: 'Teste', vagasOcupadas: 10, vagasTotais: VAGAS_TESTE.length, vagas: VAGAS_TESTE },
        { id: 'video', nome: 'Vídeo', vagasOcupadas: 18, vagasTotais: VAGAS_VIDEO.length, vagas: VAGAS_VIDEO },
        // Casos extremos: bloco cheio e que não muda, e bloco com poucas vagas
        { id: 'lotado', nome: 'Lotado', vagasOcupadas: 20, vagasTotais: 20, ocupacaoFixa: true },
        { id: 'pequeno', nome: 'Pequeno', vagasOcupadas: 2, vagasTotais: 6 },
      ],
    },
  ],
};

export const parceiros: Parceiro[] = __DEV__ ? [...parceirosReais, parceiroDeTeste] : parceirosReais;

// Campus e parceiro mostram a soma das vagas dos seus blocos
// (com a ocupação ao vivo, se o mapa do bloco já foi aberto)
export function ocupacaoDoCampus(campus: Campus): Ocupacao {
  return campus.blocos.reduce(
    (total, bloco) => {
      const atual = ocupacaoDoBloco(campus.id, bloco);
      return {
        vagasOcupadas: total.vagasOcupadas + atual.vagasOcupadas,
        vagasTotais: total.vagasTotais + atual.vagasTotais,
      };
    },
    { vagasOcupadas: 0, vagasTotais: 0 },
  );
}

export function ocupacaoDoParceiro(parceiro: Parceiro): Ocupacao {
  return parceiro.campi.map(ocupacaoDoCampus).reduce(
    (total, campus) => ({
      vagasOcupadas: total.vagasOcupadas + campus.vagasOcupadas,
      vagasTotais: total.vagasTotais + campus.vagasTotais,
    }),
    { vagasOcupadas: 0, vagasTotais: 0 },
  );
}

export function buscarParceiro(parceiroId: string | undefined) {
  return parceiros.find((p) => p.id === parceiroId);
}

export function buscarCampus(parceiro: Parceiro | undefined, campusId: string | undefined) {
  return parceiro?.campi.find((c) => c.id === campusId);
}
