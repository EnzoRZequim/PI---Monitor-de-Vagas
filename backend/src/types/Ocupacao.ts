export interface EstadoVaga {
  ID: string;
  Nome: string;
  Ocupada: boolean;
  Sobreposicao: number;
}


export interface OcupacaoMapa {
  MapaID: string;
  Data: string;
  Vagas: EstadoVaga[];
}