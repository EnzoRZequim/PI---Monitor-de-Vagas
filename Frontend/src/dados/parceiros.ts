// Dados provisórios até a integração com a API do backend
export type Bloco = {
  id: string;
  nome: string;
  vagasOcupadas: number;
  vagasTotais: number;
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

export const parceiros: Parceiro[] = [
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

// Campus e parceiro mostram a soma das vagas dos seus blocos
export function ocupacaoDoCampus(campus: Campus): Ocupacao {
  return campus.blocos.reduce(
    (total, bloco) => ({
      vagasOcupadas: total.vagasOcupadas + bloco.vagasOcupadas,
      vagasTotais: total.vagasTotais + bloco.vagasTotais,
    }),
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
