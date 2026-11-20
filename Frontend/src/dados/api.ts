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

// Mesmo formato de backend/src/types/Mapa.ts (pontos normalizados de 0 a 1 sobre a imagem)
export type PontoDoBackend = { X: number; Y: number };
export type VagaDoBackend = { ID: string; Nome: string; Pontos: PontoDoBackend[] };
export type MapaDoBackend = { ID: string; Nome: string; Imagem: string; Largura: number; Altura: number; Vagas: VagaDoBackend[] };
export type ResumoMapaDoBackend = { ID: string; Nome: string; Imagem: string; QuantidadeVagas: number };

async function requisitar<T>(caminho: string, opcoes?: RequestInit, tempoLimiteMs = TEMPO_LIMITE_MS): Promise<T> {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), tempoLimiteMs);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, signal: controle.signal });
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

// Mapas cadastrados (GET /mapas), para escolher qual analisar
export const listarMapas = () => requisitar<ResumoMapaDoBackend[]>('/mapas');

// Mapa com as vagas desenhadas (GET /mapas/:ID)
export const buscarMapa = (mapaId: string) => requisitar<MapaDoBackend>(`/mapas/${encodeURIComponent(mapaId)}`);

// Arquivo escolhido no aparelho (expo-image-picker). Na web vem o File do navegador; no celular, só a uri
export type FotoEscolhida = { uri: string; mimeType?: string; fileName?: string | null; file?: File };

// A IA leva alguns segundos por foto, e o envio de vídeo pode ser grande: mais tempo que as consultas comuns
const TEMPO_LIMITE_ANALISE_MS = 60000;
const TEMPO_LIMITE_ENVIO_MS = 300000;

// Põe o arquivo no FormData do jeito que cada plataforma aceita
async function anexarArquivo(dados: FormData, campo: string, arquivo: FotoEscolhida, nomePadrao: string) {
  const nome = arquivo.fileName ?? nomePadrao;
  if (arquivo.file) dados.append(campo, arquivo.file, nome);
  else if (arquivo.uri.startsWith('blob:') || arquivo.uri.startsWith('data:'))
    dados.append(campo, await (await fetch(arquivo.uri)).blob(), nome);
  // No celular o React Native aceita { uri, name, type } no lugar do arquivo
  else dados.append(campo, { uri: arquivo.uri, name: nome, type: arquivo.mimeType ?? 'application/octet-stream' } as unknown as Blob);
}

// ===== Editor de mapas (mesmas rotas do frontend-admin) =====

// Cadastra a imagem de referência e cria o mapa sem vagas (POST /mapas). O ID não é enviado: o
// backend gera (hoje um número sequencial; com o banco, a coluna auto-incremento) e devolve no mapa.
export async function criarMapa(nome: string, imagem: FotoEscolhida) {
  const dados = new FormData();
  dados.append('Nome', nome);
  await anexarArquivo(dados, 'Imagem', imagem, 'imagem.jpg');
  return requisitar<MapaDoBackend>('/mapas', { method: 'POST', body: dados }, TEMPO_LIMITE_ANALISE_MS);
}

// Substitui a lista inteira de vagas do mapa (PUT /mapas/:ID/vagas)
export const salvarVagas = (mapaId: string, vagas: VagaDoBackend[]) =>
  requisitar<MapaDoBackend>(`/mapas/${encodeURIComponent(mapaId)}/vagas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Vagas: vagas }),
  });

// A IA encontra as vagas na imagem de referência do mapa (GET /mapas/:ID/detectar-vagas)
export const detectarVagas = (mapaId: string) =>
  requisitar<{ Quantidade: number; Vagas: { Pontos: PontoDoBackend[] }[] }>(
    `/mapas/${encodeURIComponent(mapaId)}/detectar-vagas`,
    undefined,
    TEMPO_LIMITE_ANALISE_MS,
  );

// ===== Monitor de vídeo (POST /monitorar e WebSocket /ws/monitor) =====

export type ResultadoMonitor = {
  sessionId: string;
  frame: number;
  totalFrames: number;
  timestamp: string;
  ocupacao: OcupacaoDoBackend;
  motionDetected: boolean;
  motionInfo: { changedPixels: number; totalPixels: number; ratio: number } | null;
};

export type StatusSessao = 'IDLE' | 'OBSERVING' | 'ANALYZING' | 'WAITING' | 'STOPPED' | 'COMPLETED' | 'ERROR';

// Mensagens que o backend manda pelo WebSocket durante o monitoramento
export type MensagemMonitor =
  | { tipo: 'status'; status: StatusSessao; info?: { message?: string } }
  | { tipo: 'resultado'; dados: ResultadoMonitor }
  | { tipo: 'erro'; mensagem: string };

export type OpcoesMonitor = { mapaId: string; video: FotoEscolhida; usarMascara: boolean; otimizarMovimento: boolean; intervaloSegundos: number };

export async function iniciarMonitoramento({ mapaId, video, usarMascara, otimizarMovimento, intervaloSegundos }: OpcoesMonitor) {
  const dados = new FormData();
  dados.append('mapaId', mapaId);
  await anexarArquivo(dados, 'video', video, 'video.mp4');
  dados.append('useMask', usarMascara ? 'true' : 'false');
  dados.append('useMotionOptimization', otimizarMovimento ? 'true' : 'false');
  dados.append('intervalSeconds', String(intervaloSegundos));
  return requisitar<{ sessionId: string; status: string; mensagem: string }>(
    '/monitorar',
    { method: 'POST', body: dados },
    TEMPO_LIMITE_ENVIO_MS,
  );
}

export const pararMonitoramento = (sessionId: string) =>
  requisitar<{ sessionId: string; status: string }>(`/monitorar/${encodeURIComponent(sessionId)}/parar`, { method: 'POST' });

// Endereço do WebSocket do monitoramento, no mesmo servidor da API (http -> ws)
export const urlWebSocketMonitor = (sessionId: string) =>
  `${API_URL.replace(/^http/, 'ws')}/ws/monitor?sessionId=${encodeURIComponent(sessionId)}`;

// Imagem de referência de um mapa (servida pelo backend em /imagens)
export const urlImagemDoMapa = (mapa: MapaDoBackend) => `${API_URL}/imagens/${encodeURIComponent(mapa.Imagem)}`;

// ===== Monitor de vagas =====

// Analisa uma foto da câmera com a IA (POST /mapas/:ID/analisar). O backend também guarda o
// resultado como a ocupação atual do mapa, que as telas do app leem.
export async function analisarFoto(mapaId: string, foto: FotoEscolhida) {
  const dados = new FormData();
  await anexarArquivo(dados, 'Imagem', foto, 'foto.jpg');

  return requisitar<OcupacaoDoBackend>(
    `/mapas/${encodeURIComponent(mapaId)}/analisar`,
    { method: 'POST', body: dados },
    TEMPO_LIMITE_ANALISE_MS,
  );
}
