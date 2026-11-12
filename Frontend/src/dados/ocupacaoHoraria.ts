// Dados provisórios até a integração com a API do backend: ocupação média (%) de cada hora nos
// últimos 7 dias, por local da área do parceiro

export const HORAS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// Uma posição por hora de HORAS. São Caetano repete a curva do protótipo do Figma.
const SERIES: Record<string, number[]> = {
  'sao-caetano': [20, 36, 49, 38, 45, 63, 69, 60, 54, 66, 81, 75, 51, 24, 8],
  'sao-paulo': [15, 28, 44, 57, 61, 52, 48, 55, 63, 72, 68, 49, 33, 18, 6],
};

// Locais criados na área do parceiro ainda não têm histórico
export function ocupacaoPorHorario(localId: string): number[] | null {
  return SERIES[localId] ?? null;
}
