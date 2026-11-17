// Cliente da API do backend (pasta backend/). No celular o "localhost" é o próprio aparelho, então
// defina EXPO_PUBLIC_API_URL com o IP do computador na rede (veja .env.example). A variável precisa
// ser lida assim, com ponto, para o Expo trocá-la pelo valor na hora de montar o app.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

// Sem resposta nesse tempo, a tentativa é descartada e o app segue com os dados que já tem
const TEMPO_LIMITE_MS = 4000;

// Formato padrão das respostas do backend (ResponseHelper)
type RespostaApi<T> = { success: boolean; statusCode: number; data?: T; error?: string; message?: string };

// Mesmo formato de backend/src/types/Ocupacao.ts
export type EstadoVagaDoBackend = { ID: string; Nome: string; Ocupada: boolean; Sobreposicao: number };
export type OcupacaoDoBackend = { MapaID: string; Data: string; Vagas: EstadoVagaDoBackend[] };

async function requisitar<T>(caminho: string): Promise<T> {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, { signal: controle.signal });
    const corpo = (await resposta.json()) as RespostaApi<T>;
    if (!resposta.ok || !corpo.success || corpo.data === undefined) {
      throw new Error(corpo.error ?? `Erro ${resposta.status} ao falar com o servidor.`);
    }
    return corpo.data;
  } finally {
    clearTimeout(temporizador);
  }
}

// Último resultado da IA para o mapa (GET /mapas/:ID/ocupacao)
export const buscarOcupacaoDoMapa = (mapaId: string) =>
  requisitar<OcupacaoDoBackend>(`/mapas/${encodeURIComponent(mapaId)}/ocupacao`);
