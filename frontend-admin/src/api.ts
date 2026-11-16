import type {
  Mapa,
  OcupacaoMapa,
  Ponto,
  RespostaApi,
  ResumoMapa,
  SugestaoVaga,
  Vaga
} from "./tipos";

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, init);
  const corpo = (await resposta.json()) as RespostaApi<T>;

  if (!resposta.ok || !corpo.success || corpo.data === undefined) {
    throw new Error(corpo.error ?? "Erro ao comunicar com o servidor.");
  }

  return corpo.data;
}

export const listarMapas = () => requisitar<ResumoMapa[]>("/mapas");

export const buscarMapa = (id: string) =>
  requisitar<Mapa>(`/mapas/${encodeURIComponent(id)}`);

export const criarMapa = (dados: FormData) =>
  requisitar<Mapa>("/mapas", { method: "POST", body: dados });

export const salvarVagas = (id: string, vagas: Vaga[]) =>
  requisitar<Mapa>(`/mapas/${encodeURIComponent(id)}/vagas`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Vagas: vagas })
  });

export const sugerirVaga = (id: string, ponto: Ponto) =>
  requisitar<SugestaoVaga>(
    `/mapas/${encodeURIComponent(id)}/sugerir-vaga`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ X: ponto.X, Y: ponto.Y })
    }
  );

export const detectarVagas = (id: string) =>
  requisitar<{
    Quantidade: number;
    Vagas: {
      Pontos: Ponto[];
    }[];
  }>(`/mapas/${encodeURIComponent(id)}/detectar-vagas`);

export const analisarMapa = (id: string, imagem: File) => {
  const dados = new FormData();
  dados.append("Imagem", imagem);

  return requisitar<OcupacaoMapa>(
    `/mapas/${encodeURIComponent(id)}/analisar`,
    {
      method: "POST",
      body: dados
    }
  );
};

export const iniciarMonitoramento = (dados: FormData) => {
  return requisitar<{
    sessionId: string;
    status: string;
    mensagem: string;
  }>("/monitorar", { method: "POST", body: dados });
};

export const pararMonitoramento = (sessionId: string) => {
  return requisitar<{ sessionId: string; status: string }>(
    `/monitorar/${encodeURIComponent(sessionId)}/parar`,
    { method: "POST" }
  );
};