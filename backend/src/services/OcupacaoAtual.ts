import type { OcupacaoMapa } from "../types/Ocupacao";

// Último resultado de ocupação de cada mapa, em memória. Quem analisa (sessão de monitoramento ou a
// demonstração) chama `registrarOcupacao`; o app lê pela rota GET /mapas/:ID/ocupacao.
const ultimaOcupacao = new Map<string, OcupacaoMapa>();

export function registrarOcupacao(ocupacao: OcupacaoMapa): void {
  ultimaOcupacao.set(ocupacao.MapaID, ocupacao);
}

export function buscarOcupacaoAtual(mapaID: string): OcupacaoMapa | null {
  return ultimaOcupacao.get(mapaID) ?? null;
}
