export type Ponto = { X: number; Y: number };


export type Vaga = { ID: string; Nome: string; Pontos: Ponto[] };


export type Mapa = {
  ID: string;
  Nome: string;
  Imagem: string;
  Largura: number;
  Altura: number;
  Vagas: Vaga[];
};


export type ResumoMapa = {
  ID: string;
  Nome: string;
  Imagem: string;
  QuantidadeVagas: number;
};


export type RespostaApi<T> = {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: string;
  message?: string;
};


export type EstadoVaga = {
  ID: string;
  Nome: string;
  Ocupada: boolean;
  Sobreposicao: number;
};


export type OcupacaoMapa = {
  MapaID: string;
  Data: string;
  Vagas: EstadoVaga[];
};