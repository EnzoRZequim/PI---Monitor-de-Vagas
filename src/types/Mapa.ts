export interface Ponto {
  X: number;
  Y: number;
}

export interface Vaga {
  ID: string;
  Nome: string;
  Pontos: Ponto[];
}

export interface Mapa {
  ID: string;
  Nome: string;
  Imagem: string;
  Largura: number;
  Altura: number;
  Vagas: Vaga[];
}