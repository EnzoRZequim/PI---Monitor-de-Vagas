import { useEffect, useRef, useState } from "react";
import type {
  Mapa,
  MonitorResult,
  MonitorStatusInfo,
  ResumoMapa,
  SessionStatus
} from "./tipos";
import {
  buscarMapa,
  iniciarMonitoramento,
  listarMapas,
  pararMonitoramento
} from "./api";

type Acao = "iniciando" | "parando" | "reiniciando" | null;

type OrigemVideo = "arquivo" | "url";

const URL_API = "http://localhost:3000";

const STATUS: Record<SessionStatus, string> = {
  IDLE: "Preparando monitoramento",
  OBSERVING: "Observando movimentação",
  ANALYZING: "Analisando vagas com IA",
  WAITING: "Aguardando próxima análise",
  STOPPED: "Monitoramento interrompido",
  COMPLETED: "Processamento concluído",
  ERROR: "Erro no processamento"
};

function textoDoErro(erro: unknown): string {
  return erro instanceof Error
    ? erro.message
    : "Ocorreu um erro inesperado.";
}

function criarDados(
  mapaId: string,
  arquivo: File | null,
  urlVideo: string,
  usarMascara: boolean,
  otimizarMovimento: boolean,
  intervalo: number
): FormData {
  const dados = new FormData();

  dados.append("mapaId", mapaId);

  if (arquivo) {
    dados.append("video", arquivo);
  }

  if (urlVideo) {
    dados.append("videoUrl", urlVideo);
  }

  dados.append("useMask", usarMascara ? "true" : "false");
  dados.append(
    "useMotionOptimization",
    otimizarMovimento ? "true" : "false"
  );
  dados.append("intervalSeconds", String(intervalo));

  return dados;
}

export default function MonitorVideo() {
  const [mapas, setMapas] = useState<ResumoMapa[]>([]);
  const [mapaSelecionado, setMapaSelecionado] = useState("");
  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [carregandoMapa, setCarregandoMapa] = useState(false);

  const [origemVideo, setOrigemVideo] =
    useState<OrigemVideo>("arquivo");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUrlExterna, setVideoUrlExterna] = useState("");
  const [proporcaoVideo, setProporcaoVideo] =
    useState<number | null>(null);

  const [useMask, setUseMask] = useState(true);
  const [useMotionOpt, setUseMotionOpt] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(5);

  const [monitorando, setMonitorando] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [acao, setAcao] = useState<Acao>(null);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [resultados, setResultados] = useState<MonitorResult[]>([]);
  const [ultimoResultado, setUltimoResultado] =
    useState<MonitorResult | null>(null);

  const [statusAtual, setStatusAtual] =
    useState<SessionStatus>("IDLE");

  const [statusInfo, setStatusInfo] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imagemRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  const processando = acao !== null;

  const aguardandoResultado =
    !ultimoResultado &&
    statusAtual !== "COMPLETED" &&
    statusAtual !== "STOPPED" &&
    statusAtual !== "ERROR";

  const vagasAtuais = ultimoResultado?.ocupacao.Vagas ?? [];

  const total = vagasAtuais.length;
  const ocupadas = vagasAtuais.filter(
    (vaga) => vaga.Ocupada
  ).length;
  const livres = total - ocupadas;

  const ehUrlRtsp =
    origemVideo === "url" &&
    videoUrlExterna.toLowerCase().startsWith("rtsp://");

  const urlPrevia =
    origemVideo === "url"
      ? ehUrlRtsp
        ? null
        : videoUrlExterna
      : videoUrl;

  // Último frame analisado pela IA (usado como prévia em streams RTSP).
  const urlFrameAoVivo =
    ehUrlRtsp && monitorando && sessionId && ultimoResultado
      ? `${URL_API}/temp/frames_${sessionId}/frame-${String(ultimoResultado.frame).padStart(4, "0")}.jpg`
      : null;

  // Carregamento dos mapas cadastrados.
  useEffect(() => {
    let ativo = true;

    listarMapas()
      .then((dados) => {
        if (ativo) setMapas(dados);
      })
      .catch((falha: unknown) => {
        if (ativo) {
          setErro(
            `Erro ao listar mapas: ${textoDoErro(falha)}`
          );
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Busca o mapa selecionado.
  useEffect(() => {
    if (!mapaSelecionado) return;

    let ativo = true;

    buscarMapa(mapaSelecionado)
      .then((dados) => {
        if (ativo) setMapa(dados);
      })
      .catch((falha: unknown) => {
        if (ativo) {
          setErro(
            `Erro ao buscar mapa: ${textoDoErro(falha)}`
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregandoMapa(false);
      });

    return () => {
      ativo = false;
    };
  }, [mapaSelecionado]);

  // Libera recursos quando o componente é desmontado.
  useEffect(() => {
    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();

      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
    };
  }, []);

  function desconectarWebSocket() {
    const ws = wsRef.current;
    wsRef.current = null;
    ws?.close();
  }

  function conectarWebSocket(id: string) {
    desconectarWebSocket();

    const ws = new WebSocket(
      `ws://localhost:3000/ws/monitor?sessionId=${encodeURIComponent(id)}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current !== ws) return;

      setStatusInfo(
        "Conectado. Aguardando atualizações da IA..."
      );
    };

    ws.onmessage = (evento) => {
      if (wsRef.current !== ws) return;

      try {
        const msg = JSON.parse(
          evento.data
        ) as MonitorStatusInfo;

        if (msg.tipo === "resultado") {
          setUltimoResultado(msg.dados);

          setResultados((atuais) =>
            [msg.dados, ...atuais].slice(0, 50)
          );
        } else if (msg.tipo === "status") {
          setStatusAtual(msg.status);
          setStatusInfo(msg.info?.message ?? "");

          if (msg.status === "ERROR") {
            setErro(
              msg.info?.error ??
              "Erro durante o processamento."
            );
          }
        } else if (msg.tipo === "erro") {
          setStatusAtual("ERROR");
          setErro(msg.mensagem);
        }
      } catch {
        // Ignora mensagens que não são JSON válido.
      }
    };

    ws.onerror = () => {
      if (wsRef.current === ws) {
        setErro(
          "Falha na conexão de monitoramento em tempo real."
        );
      }
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;

      wsRef.current = null;
      setStatusInfo(
        "Conexão em tempo real encerrada."
      );
    };
  }

  function selecionarMapa(id: string) {
    if (processando) return;

    setMapaSelecionado(id);
    setMapa(null);
    setCarregandoMapa(Boolean(id));
    setErro("");
    setMensagem("");
  }

  function selecionarOrigemVideo(origem: OrigemVideo) {
    if (processando) return;

    setOrigemVideo(origem);
    setErro("");
    setMensagem("");
  }

  function selecionarVideo(arquivo: File | null) {
    if (processando) return;

    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }

    if (arquivo) {
      const url = URL.createObjectURL(arquivo);

      videoUrlRef.current = url;
      setVideoUrl(url);
    } else {
      setVideoUrl(null);
    }

    setVideoFile(arquivo);
    setProporcaoVideo(null);
    setUltimoResultado(null);
    setResultados([]);
    setErro("");
  }

  function alterarVideoUrlExterna(url: string) {
    if (processando) return;

    setVideoUrlExterna(url ?? "");
    setProporcaoVideo(null);
    setUltimoResultado(null);
    setResultados([]);
    setErro("");
  }

  async function aoIniciar() {
    if (processando) return;

    if (!mapaSelecionado || !mapa) {
      return setErro("Selecione um mapa válido.");
    }

    if (origemVideo === "arquivo" && !videoFile) {
      return setErro(
        "Selecione um vídeo para analisar."
      );
    }

    if (
      origemVideo === "url" &&
      !videoUrlExterna.trim()
    ) {
      return setErro(
        "Informe a URL do vídeo para analisar."
      );
    }

    setAcao("iniciando");
    setErro("");
    setMensagem("");
    setStatusAtual("IDLE");
    setStatusInfo(
      origemVideo === "url"
        ? "Conectando ao vídeo em tempo real..."
        : "Enviando vídeo e preparando os frames..."
    );
    setResultados([]);
    setUltimoResultado(null);

    try {
      const resposta = await iniciarMonitoramento(
        criarDados(
          mapaSelecionado,
          origemVideo === "arquivo" ? videoFile : null,
          origemVideo === "url"
            ? videoUrlExterna.trim()
            : "",
          useMask,
          useMotionOpt,
          intervalSeconds
        )
      );

      setSessionId(resposta.sessionId);
      setMonitorando(true);

      setMensagem(
        "Monitoramento iniciado. Aguardando atualizações da IA."
      );

      conectarWebSocket(resposta.sessionId);
    } catch (falha) {
      setErro(textoDoErro(falha));
    } finally {
      setAcao(null);
    }
  }

  async function aoParar() {
    if (!sessionId || processando) return;

    setAcao("parando");
    setErro("");

    try {
      await pararMonitoramento(sessionId);

      desconectarWebSocket();

      setMonitorando(false);
      setSessionId("");
      setStatusAtual("STOPPED");

      setMensagem(
        "Monitoramento interrompido."
      );
    } catch (falha) {
      setErro(textoDoErro(falha));
    } finally {
      setAcao(null);
    }
  }

  async function aoReiniciar() {
    if (
      !sessionId ||
      processando ||
      (origemVideo === "arquivo" && !videoFile) ||
      (origemVideo === "url" && !videoUrlExterna.trim())
    ) {
      return;
    }

    setAcao("reiniciando");
    setErro("");
    setMensagem("");

    try {
      await pararMonitoramento(sessionId);

      desconectarWebSocket();

      setMonitorando(false);
      setSessionId("");
      setResultados([]);
      setUltimoResultado(null);

      setStatusAtual("IDLE");
      setStatusInfo(
        origemVideo === "url"
          ? "Reconectando ao vídeo em tempo real..."
          : "Preparando nova sessão de monitoramento..."
      );

      const resposta = await iniciarMonitoramento(
        criarDados(
          mapaSelecionado,
          origemVideo === "arquivo" ? videoFile : null,
          origemVideo === "url"
            ? videoUrlExterna.trim()
            : "",
          useMask,
          useMotionOpt,
          intervalSeconds
        )
      );

      setSessionId(resposta.sessionId);
      setMonitorando(true);

      setMensagem(
        "Monitoramento reiniciado. Aguardando atualizações."
      );

      conectarWebSocket(resposta.sessionId);
    } catch (falha) {
      setErro(
        `Não foi possível reiniciar: ${textoDoErro(falha)}`
      );
    } finally {
      setAcao(null);
    }
  }

  // Desenha o último resultado recebido sobre a prévia (vídeo ou imagem).
  useEffect(() => {
    const video = videoRef.current;
    const imagem = imagemRef.current;
    const fonte = video ?? imagem;
    const canvas = canvasRef.current;

    if (!fonte || !canvas || !mapa) return;

    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    const larguraFonte = video
      ? video.videoWidth
      : (imagem?.naturalWidth ?? 0);

    const alturaFonte = video
      ? video.videoHeight
      : (imagem?.naturalHeight ?? 0);

    canvas.width = larguraFonte || mapa.Largura;
    canvas.height = alturaFonte || mapa.Altura;

    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (!ultimoResultado) return;

    const estilo = getComputedStyle(canvas);

    const corLivre =
      estilo.getPropertyValue("--cor-livre").trim() ||
      "#34d399";

    const corOcupada =
      estilo.getPropertyValue("--cor-ocupada").trim() ||
      "#fb7185";

    const corNeutra =
      estilo.getPropertyValue("--cor-borda").trim() ||
      "#dfdfdf";

    const corTexto =
      estilo.getPropertyValue("--cor-superficie").trim() ||
      "#fefefe";

    const corContorno =
      estilo.getPropertyValue("--cor-texto").trim() ||
      "#030b16";

    const estadoPorId = new Map(
      ultimoResultado.ocupacao.Vagas.map(
        (vaga) => [vaga.ID, vaga.Ocupada]
      )
    );

    mapa.Vagas.forEach((vaga) => {
      if (!vaga.Pontos.length) return;

      const estado = estadoPorId.get(vaga.ID);

      const cor =
        estado === undefined
          ? corNeutra
          : estado
            ? corOcupada
            : corLivre;

      const pontos = vaga.Pontos.map((ponto) => ({
        x: ponto.X * canvas.width,
        y: ponto.Y * canvas.height
      }));

      contexto.beginPath();

      pontos.forEach((ponto, indice) => {
        if (indice === 0) {
          contexto.moveTo(ponto.x, ponto.y);
        } else {
          contexto.lineTo(ponto.x, ponto.y);
        }
      });

      contexto.closePath();

      contexto.fillStyle = cor;
      contexto.globalAlpha = 0.5;
      contexto.fill();

      contexto.globalAlpha = 1;
      contexto.strokeStyle = cor;
      contexto.lineWidth = 3;
      contexto.stroke();

      const centroX =
        pontos.reduce(
          (soma, ponto) => soma + ponto.x,
          0
        ) / pontos.length;

      const centroY =
        pontos.reduce(
          (soma, ponto) => soma + ponto.y,
          0
        ) / pontos.length;

      contexto.font =
        `600 16px ${getComputedStyle(fonte).fontFamily}`;

      contexto.textAlign = "center";
      contexto.textBaseline = "middle";
      contexto.lineWidth = 3;
      contexto.strokeStyle = corContorno;

      contexto.strokeText(
        vaga.Nome,
        centroX,
        centroY
      );

      contexto.fillStyle = corTexto;

      contexto.fillText(
        vaga.Nome,
        centroX,
        centroY
      );
    });
  }, [ultimoResultado, mapa, proporcaoVideo]);

  // Prévia compartilhada entre configuração e monitoramento.
  const painelVideo = (
    <div className="painel painel-video">
      <h3>Prévia do vídeo</h3>

      {urlPrevia ? (
        <>
          <div
            className="video-wrapper"
            style={
              proporcaoVideo
                ? { aspectRatio: proporcaoVideo }
                : undefined
            }
          >
            <video
              ref={videoRef}
              className="video-monitor"
              src={urlPrevia}
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedMetadata={(evento) => {
                const video = evento.currentTarget;

                if (
                  video.videoWidth &&
                  video.videoHeight
                ) {
                  setProporcaoVideo(
                    video.videoWidth /
                    video.videoHeight
                  );
                }
              }}
            />

            {monitorando && (
              <canvas
                ref={canvasRef}
                className="canvas-overlay"
              />
            )}
          </div>

          <p className="monitor-video-nota">
            Esta é uma prévia local. A IA processa frames
            separadamente; as marcações exibem o último
            resultado recebido e não acompanham
            necessariamente o instante reproduzido.
          </p>
        </>
      ) : urlFrameAoVivo ? (
        <>
          <div
            className="video-wrapper"
            style={
              proporcaoVideo
                ? { aspectRatio: proporcaoVideo }
                : undefined
            }
          >
            <img
              ref={imagemRef}
              className="video-monitor"
              src={urlFrameAoVivo}
              alt="Último frame analisado da câmera ao vivo"
              onLoad={(evento) => {
                const imagem = evento.currentTarget;

                if (
                  imagem.naturalWidth &&
                  imagem.naturalHeight
                ) {
                  setProporcaoVideo(
                    imagem.naturalWidth /
                    imagem.naturalHeight
                  );
                }
              }}
            />

            <canvas
              ref={canvasRef}
              className="canvas-overlay"
            />
          </div>

          <p className="monitor-video-nota">
            Stream RTSP: a imagem mostra o último frame
            analisado pela IA e as marcações correspondem
            a esse mesmo frame. Ela é atualizada a cada
            nova análise.
          </p>
        </>
      ) : (
        <div className="estado-vazio">
          <p>
            {ehUrlRtsp
              ? monitorando
                ? "Aguardando o primeiro frame analisado pela IA. A imagem do stream RTSP aparecerá aqui."
                : "Para streams RTSP, a imagem aparece após a primeira análise, com as vagas marcadas."
              : origemVideo === "url"
                ? "Informe a URL de um vídeo para visualizar a prévia."
                : "Selecione um arquivo de vídeo para visualizar a prévia."}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <section className="monitor-video pagina-editor">
      <div className="pagina-introducao">
        <div>
          <span className="pagina-categoria">
            MONITORAMENTO INTELIGENTE
          </span>

          <h2>Monitoramento por vídeo</h2>

          <p>
            Envie um vídeo, informe uma URL ou conecte um
            stream ao vivo para acompanhar os resultados
            da inteligência artificial.
          </p>
        </div>
      </div>

      {erro && (
        <div
          className="mensagem mensagem-erro"
          role="alert"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          className="mensagem mensagem-info"
          role="status"
        >
          {mensagem}
        </div>
      )}

      {processando && (
        <div
          className="status-processamento status-ia"
          role="status"
          aria-live="polite"
        >
          <strong>
            {acao === "parando"
              ? "Interrompendo monitoramento..."
              : acao === "reiniciando"
                ? "Reiniciando monitoramento..."
                : "Preparando análise de vídeo..."}
          </strong>

          <p>
            {acao === "parando"
              ? "Enviando solicitação de parada ao servidor."
              : origemVideo === "url"
                ? "Conectando ao vídeo em tempo real..."
                : "Enviando o vídeo e aguardando a preparação dos frames pela IA."}
          </p>

          <progress
            aria-label="Operação de monitoramento em andamento"
          />
        </div>
      )}

      {monitorando ? (
        <section
          className="paineis"
          aria-label="Monitoramento ativo"
        >
          <div className="painel painel-controle">
            <h3>Controle do monitoramento</h3>

            <p>
              <strong>Mapa:</strong>{" "}
              {mapa?.Nome ?? mapaSelecionado}
            </p>

            <p>
              <strong>Sessão:</strong>{" "}
              <span className="monitor-video-id">
                {sessionId}
              </span>
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {STATUS[statusAtual]}
            </p>

            {statusInfo && (
              <p
                className="monitor-video-nota"
                role="status"
              >
                {statusInfo}
              </p>
            )}

            <div className="controles">
              <button
                type="button"
                className="botao-parar"
                disabled={processando}
                onClick={() => void aoParar()}
              >
                {acao === "parando"
                  ? "Parando..."
                  : "Parar monitoramento"}
              </button>

              <button
                type="button"
                className="botao-reiniciar"
                disabled={processando}
                onClick={() => void aoReiniciar()}
              >
                {acao === "reiniciando"
                  ? "Reiniciando..."
                  : "Reiniciar monitoramento"}
              </button>
            </div>

            <p className="legenda">
              Livre: verde · Ocupada: vermelho ·
              Sem resultado: neutra
            </p>
          </div>

          {painelVideo}

          <div className="painel painel-resultado">
            <h3>Resultado da última análise</h3>

            {ultimoResultado ? (
              <>
                <p>
                  Frame analisado: {ultimoResultado.frame} de{" "}
                  {ultimoResultado.totalFrames}
                </p>

                <p>
                  Horário:{" "}
                  {new Date(
                    ultimoResultado.timestamp
                  ).toLocaleTimeString("pt-BR")}
                </p>

                <p>
                  Movimento detectado:{" "}
                  {ultimoResultado.motionDetected
                    ? "sim"
                    : "não"}

                  {ultimoResultado.motionInfo &&
                    ` (${(
                      ultimoResultado.motionInfo.ratio *
                      100
                    ).toFixed(1)}% de pixels alterados)`}
                </p>

                <div className="monitor-indicadores">
                  <div className="monitor-indicador">
                    <span>Total</span>
                    <strong>{total}</strong>
                  </div>

                  <div className="monitor-indicador monitor-livre">
                    <span>Livres</span>
                    <strong>{livres}</strong>
                  </div>

                  <div className="monitor-indicador monitor-ocupada">
                    <span>Ocupadas</span>
                    <strong>{ocupadas}</strong>
                  </div>
                </div>

                {ultimoResultado.totalFrames > 0 && (
                  <progress
                    className="monitor-video-progresso"
                    value={ultimoResultado.frame}
                    max={ultimoResultado.totalFrames}
                    aria-label="Posição do último frame analisado"
                  />
                )}

                <div className="tabela-container">
                  <table className="tabela-vagas">
                    <thead>
                      <tr>
                        <th>Vaga</th>
                        <th>Estado</th>
                        <th>Sobreposição</th>
                      </tr>
                    </thead>

                    <tbody>
                      {vagasAtuais.map((vaga) => (
                        <tr key={vaga.ID}>
                          <td>{vaga.Nome}</td>

                          <td
                            style={{
                              color: vaga.Ocupada
                                ? "var(--cor-ocupada)"
                                : "var(--cor-livre)"
                            }}
                          >
                            {vaga.Ocupada
                              ? "Ocupada"
                              : "Livre"}
                          </td>

                          <td>
                            {(
                              vaga.Sobreposicao * 100
                            ).toFixed(0)}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div
                className="status-processamento"
                role="status"
                aria-live="polite"
              >
                <strong>
                  {STATUS[statusAtual]}
                </strong>

                <p>
                  {statusAtual === "COMPLETED"
                    ? "Vídeo concluído sem resultados de ocupação recebidos."
                    : statusAtual === "ERROR"
                      ? "A análise encontrou um problema. Consulte a mensagem de erro."
                      : "Aguardando o primeiro resultado da IA. A imagem permanece disponível."}
                </p>

                {aguardandoResultado && (
                  <progress
                    aria-label="Aguardando primeira análise"
                  />
                )}
              </div>
            )}
          </div>

          <div className="painel painel-historico">
            <h3>Histórico das últimas análises</h3>

            {resultados.length === 0 ? (
              <p>
                Nenhuma análise recebida nesta sessão.
              </p>
            ) : (
              <div className="tabela-container">
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
                    {resultados.map((resultado) => {
                      const vagas =
                        resultado.ocupacao.Vagas;

                      const qtdOcupadas = vagas.filter(
                        (vaga) => vaga.Ocupada
                      ).length;

                      return (
                        <tr
                          key={`${resultado.sessionId}-${resultado.frame}`}
                        >
                          <td>{resultado.frame}</td>

                          <td>
                            {new Date(
                              resultado.timestamp
                            ).toLocaleTimeString("pt-BR")}
                          </td>

                          <td>
                            {resultado.motionDetected
                              ? "Sim"
                              : "Não"}
                          </td>

                          <td>{qtdOcupadas}</td>

                          <td>
                            {vagas.length - qtdOcupadas}
                          </td>

                          <td>{vagas.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section
          className="paineis"
          aria-label="Configuração do monitoramento"
        >
          <div className="painel painel-controle">
            <h3>Configurar monitoramento</h3>

            <div className="form-group">
              <label htmlFor="video-mapa">
                Mapa do estacionamento
              </label>

              <select
                id="video-mapa"
                value={mapaSelecionado}
                disabled={processando}
                onChange={(evento) =>
                  selecionarMapa(evento.target.value)
                }
              >
                <option value="">
                  Selecione um mapa
                </option>

                {mapas.map((item) => (
                  <option
                    key={item.ID}
                    value={item.ID}
                  >
                    {item.Nome} (
                    {item.QuantidadeVagas} vagas)
                  </option>
                ))}
              </select>

              {carregandoMapa && (
                <p className="monitor-video-nota">
                  Carregando mapa...
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Origem do vídeo</label>

              <div className="controles">
                <button
                  type="button"
                  className={
                    origemVideo === "arquivo"
                      ? "toggle ativo"
                      : "toggle"
                  }
                  aria-pressed={
                    origemVideo === "arquivo"
                  }
                  disabled={processando}
                  onClick={() =>
                    selecionarOrigemVideo("arquivo")
                  }
                >
                  Arquivo local
                </button>

                <button
                  type="button"
                  className={
                    origemVideo === "url"
                      ? "toggle ativo"
                      : "toggle"
                  }
                  aria-pressed={origemVideo === "url"}
                  disabled={processando}
                  onClick={() =>
                    selecionarOrigemVideo("url")
                  }
                >
                  URL do vídeo
                </button>
              </div>
            </div>

            {origemVideo === "arquivo" ? (
              <div className="form-group">
                <label htmlFor="video-arquivo">
                  Vídeo (arquivo local)
                </label>

                <input
                  id="video-arquivo"
                  type="file"
                  accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo"
                  disabled={processando}
                  onChange={(evento) =>
                    selecionarVideo(
                      evento.target.files?.[0] ?? null
                    )
                  }
                />

                {videoFile && (
                  <p className="monitor-video-nota">
                    {videoFile.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="video-url">
                  URL do vídeo
                </label>

                <input
                  id="video-url"
                  type="text"
                  placeholder="https://exemplo.com/video.mp4 ou rtsp://localhost:8554/camera-teste"
                  value={videoUrlExterna ?? ""}
                  disabled={processando}
                  onChange={(evento) =>
                    alterarVideoUrlExterna(
                      evento.target.value
                    )
                  }
                />

                <p className="monitor-video-nota">
                  Para vídeo ao vivo, informe uma URL
                  RTSP, como
                  rtsp://localhost:8554/camera-teste.
                  Em RTSP, a prévia mostra o último frame
                  analisado pela IA, com as vagas marcadas.
                </p>
              </div>
            )}

            <div className="form-group">
              <label>
                Máscara de ROI (considerar apenas
                regiões das vagas)
              </label>

              <button
                type="button"
                className={
                  useMask
                    ? "toggle ativo"
                    : "toggle"
                }
                aria-pressed={useMask}
                disabled={processando}
                onClick={() =>
                  setUseMask((valor) => !valor)
                }
              >
                {useMask ? "Ligada" : "Desligada"}
              </button>
            </div>

            <div className="form-group">
              <label>
                Otimização de movimento
              </label>

              <button
                type="button"
                className={
                  useMotionOpt
                    ? "toggle ativo"
                    : "toggle"
                }
                aria-pressed={useMotionOpt}
                disabled={processando}
                onClick={() =>
                  setUseMotionOpt((valor) => !valor)
                }
              >
                {useMotionOpt
                  ? "Ligada"
                  : "Desligada"}
              </button>

              <p className="monitor-video-nota">
                Quando desligada, a análise segue
                o intervalo configurado,
                independentemente da detecção
                de movimento.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="video-intervalo">
                Intervalo entre análises (segundos)
              </label>

              <input
                id="video-intervalo"
                type="number"
                min={1}
                max={60}
                value={intervalSeconds ?? 5}
                disabled={processando}
                onChange={(evento) =>
                  setIntervalSeconds(
                    Math.max(
                      1,
                      Math.min(
                        60,
                        Number.parseInt(
                          evento.target.value,
                          10
                        ) || 5
                      )
                    )
                  )
                }
              />
            </div>

            <button
              type="button"
              className="botao-primario"
              disabled={
                !mapaSelecionado ||
                !mapa ||
                carregandoMapa ||
                processando ||
                (origemVideo === "arquivo" &&
                  !videoFile) ||
                (origemVideo === "url" &&
                  !videoUrlExterna.trim())
              }
              onClick={() => void aoIniciar()}
            >
              {acao === "iniciando"
                ? "Preparando análise..."
                : "Iniciar monitoramento"}
            </button>
          </div>

          {painelVideo}
        </section>
      )}
    </section>
  );
}