import { useEffect, useState, useRef } from "react";
import type { ResumoMapa } from "./tipos";
import type { MonitorResult, SessionStatus, MonitorStatusInfo, EstadoVaga } from "./tipos";
import { listarMapas, iniciarMonitoramento, pararMonitoramento } from "./api";

export default function MonitorVideo() {
  const [mapas, setMapas] = useState<ResumoMapa[]>([]);
  const [mapaSelecionado, setMapaSelecionado] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [useMask, setUseMask] = useState(true);
  const [useMotionOpt, setUseMotionOpt] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(5);

  const [monitorando, setMonitorando] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  // Resultados
  const [resultados, setResultados] = useState<MonitorResult[]>([]);
  const [ultimoResultado, setUltimoResultado] = useState<MonitorResult | null>(null);
  const [statusAtual, setStatusAtual] = useState<SessionStatus>("IDLE");
  const [statusInfo, setStatusInfo] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    listarMapas()
      .then(setMapas)
      .catch((e) => setErro(`Erro ao listar mapas: ${e instanceof Error ? e.message : String(e)}`));
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  function conectarWebSocket(id: string) {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const ws = new WebSocket(`ws://localhost:3000/ws/monitor?sessionId=${encodeURIComponent(id)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusInfo("Conectado ao monitoramento em tempo real.");
    };

    ws.onmessage = (evento) => {
      try {
        const msg: MonitorStatusInfo = JSON.parse(evento.data);
        if (msg.tipo === "resultado") {
          setUltimoResultado(msg.dados);
          setResultados((prev) => [msg.dados, ...prev].slice(0, 50)); // mantém últimos 50
        } else if (msg.tipo === "status") {
          setStatusAtual(msg.status);
          setStatusInfo(msg.info?.message ?? "");
        } else if (msg.tipo === "erro") {
          setErro(msg.mensagem);
        }
      } catch (e) {
        // ignora mensagens malformadas
      }
    };

    ws.onclose = () => {
      setStatusInfo("Desconectado do monitoramento.");
      wsRef.current = null;
    };

    ws.onerror = () => {
      setErro("Erro na conexão WebSocket.");
      wsRef.current = null;
    };
  }

  async function aoIniciar() {
    if (!mapaSelecionado) return setMensagem("Selecione um mapa.");
    if (!videoFile) return setMensagem("Selecione um vídeo.");
    setErro("");
    setMensagem("");
    setResultados([]);
    setUltimoResultado(null);

    const dados = new FormData();
    dados.append("mapaId", mapaSelecionado);
    dados.append("video", videoFile);
    dados.append("useMask", useMask ? "true" : "false");
    dados.append("useMotionOptimization", useMotionOpt ? "true" : "false");
    dados.append("intervalSeconds", String(intervalSeconds));

    try {
      const resposta = await iniciarMonitoramento(dados);
      setSessionId(resposta.sessionId);
      setMonitorando(true);
      setMensagem(resposta.mensagem || "Monitoramento iniciado.");
      conectarWebSocket(resposta.sessionId);
    } catch (e: any) {
      setErro(e.message || "Erro ao iniciar monitoramento.");
    }
  }

  async function aoParar() {
    if (!sessionId) return;
    try {
      await pararMonitoramento(sessionId);
      setMonitorando(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setMensagem("Monitoramento parado.");
    } catch (e: any) {
      setErro(e.message || "Erro ao parar monitoramento.");
    }
  }

  function vagasDoUltimo(): EstadoVaga[] {
    return ultimoResultado?.ocupacao.Vagas ?? [];
  }

  function corDaVaga(ocupada: boolean): string {
    return ocupada ? "#ef4444" : "#22c55e";
  }

  return (
    <main className="app">
      <h1>Monitor de Vagas — Vídeo</h1>

      <nav className="abas">
        <button className="aba" onClick={() => {}}>Monitor de vídeo</button>
      </nav>

      {monitorando ? (
        <section className="paineis">
          <div className="painel">
            <h2>Controle do monitoramento</h2>
            <p><strong>Sessão:</strong> {sessionId}</p>
            <p><strong>Mapa:</strong> {mapas.find((m) => m.ID === mapaSelecionado)?.Nome}</p>
            <p><strong>Status:</strong> {statusAtual} — {statusInfo}</p>

            <div className="controles">
              <button onClick={aoParar} className="botao-parar">
                ⏹ Parar monitoramento
              </button>
            </div>

            <div className="legenda">
              <span style={{ color: "#22c55e", fontWeight: "bold" }}>■</span> Livre &nbsp;&nbsp;
              <span style={{ color: "#ef4444", fontWeight: "bold" }}>■</span> Ocupada
            </div>
          </div>

          <div className="painel">
            <h2>Resultado da última análise</h2>
            {ultimoResultado ? (
              <>
                <p>Frame {ultimoResultado.frame} de {ultimoResultado.totalFrames}</p>
                <p>Horário: {new Date(ultimoResultado.timestamp).toLocaleTimeString()}</p>
                <p>
                  Movimento detectado:{ultimoResultado.motionDetected ? " sim" : " não"}
                  {ultimoResultado.motionInfo ? ` (${(ultimoResultado.motionInfo.ratio * 100).toFixed(1)}% pixels alterados)` : ""}
                </p>

                <table className="tabela-vagas">
                  <thead>
                    <tr>
                      <th>Vaga</th>
                      <th>Status</th>
                      <th>Confiança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vagasDoUltimo().map((vaga) => (
                      <tr key={vaga.ID}>
                        <td>{vaga.Nome}</td>
                        <td style={{ color: corDaVaga(vaga.Ocupada), fontWeight: "bold" }}>
                          {vaga.Ocupada ? "Ocupada" : "Livre"}
                        </td>
                        <td>{(vaga.Sobreposicao * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p>Aguardando primeira análise...</p>
            )}
          </div>

          <div className="painel">
            <h2>Histórico (últimas análises)</h2>
            {resultados.length === 0 ? (
              <p>Nenhuma análise ainda.</p>
            ) : (
              <table className="tabela-resumo">
                <thead>
                  <tr>
                    <th>Frame</th>
                    <th>Horário</th>
                    <th>Movimento</th>
                    <th>Ocupadas</th>
                    <th>Livres</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r) => {
                    const vagas = r.ocupacao.Vagas;
                    const ocupadas = vagas.filter((v) => v.Ocupada).length;
                    return (
                      <tr key={`${r.sessionId}-${r.frame}`}>
                        <td>{r.frame}</td>
                        <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
                        <td>{r.motionDetected ? "Sim" : "Não"}</td>
                        <td style={{ color: "#ef4444" }}>{ocupadas}</td>
                        <td style={{ color: "#22c55e" }}>{vagas.length - ocupadas}</td>
                        <td>{vagas.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      ) : (
        <section className="paineis">
          <div className="painel">
            <h2>Configurar monitoramento</h2>

            <div className="form-group">
              <label>Mapa</label>
              <select
                value={mapaSelecionado}
                onChange={(e) => setMapaSelecionado(e.target.value)}
              >
                <option value="">Selecione um mapa</option>
                {mapas.map((m) => (
                  <option key={m.ID} value={m.ID}>
                    {m.Nome} ({m.QuantidadeVagas} vagas)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Vídeo (arquivo local)</label>
              <input
                type="file"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
              {videoFile && <p style={{ fontSize: "0.9rem", color: "#666" }}>{videoFile.name}</p>}
            </div>

            <div className="form-group botoes-toggle">
              <label>Máscara de ROI (analisar movimento só dentro das vagas)</label>
              <button
                className={useMask ? "toggle ativo" : "toggle"}
                onClick={() => setUseMask((v) => !v)}
              >
                {useMask ? "LIGADO" : "DESLIGADO"}
              </button>
            </div>

            <div className="form-group botoes-toggle">
              <label>Otimização de movimento (analisar só se houver movimento por 5s)</label>
              <button
                className={useMotionOpt ? "toggle ativo" : "toggle"}
                onClick={() => setUseMotionOpt((v) => !v)}
              >
                {useMotionOpt ? "LIGADO" : "DESLIGADO"}
              </button>
              <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
                Desligado = analisa a cada {intervalSeconds}s independentemente de movimento.
              </p>
            </div>

            <div className="form-group">
              <label>Intervalo entre análises (segundos)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 5)))}
              />
            </div>

            <div className="controles">
              <button onClick={aoIniciar} disabled={!mapaSelecionado || !videoFile}>
                ▶ Iniciar monitoramento
              </button>
            </div>
          </div>

          {mensagem && <p className="mensagem">{mensagem}</p>}
          {erro && <p className="erro">{erro}</p>}
        </section>
      )}
    </main>
  );
}
