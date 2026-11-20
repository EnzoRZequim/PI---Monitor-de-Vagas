import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { CampoSelecao, CampoTexto } from '@/components/campos/CampoTexto';
import { Interruptor } from '@/components/campos/Interruptor';
import { LegendaMapa } from '@/components/mapa/LegendaMapa';
import {
  buscarMapa,
  iniciarMonitoramento,
  pararMonitoramento,
  urlWebSocketMonitor,
  type FotoEscolhida,
  type MapaDoBackend,
  type MensagemMonitor,
  type ResultadoMonitor,
  type ResumoMapaDoBackend,
  type StatusSessao,
} from '@/dados/api';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, fontes, gradientes, larguras, mapa as coresMapa, raio, tamanhoFonte, tipografia } from '@/theme';

function textoDoErro(erro: unknown) {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}

// Nomes dos estados da sessão (o backend manda em inglês)
const NOME_STATUS: Record<StatusSessao, string> = {
  IDLE: 'Parado',
  OBSERVING: 'Observando movimento',
  ANALYZING: 'Analisando',
  WAITING: 'Aguardando',
  STOPPED: 'Interrompido',
  COMPLETED: 'Concluído',
  ERROR: 'Erro',
};

const INTERVALO_PADRAO = 5;
// O backend aceita de 1 a 60 segundos entre análises
const INTERVALO_MINIMO = 1;
const INTERVALO_MAXIMO = 60;
// Quantas análises o histórico guarda
const LIMITE_HISTORICO = 50;

type Props = {
  mapas: ResumoMapaDoBackend[];
};

// Aba "Monitor de vídeo" (mesma lógica do frontend-admin): envia um vídeo da câmera, o backend
// analisa os quadros e manda os resultados em tempo real pelo WebSocket. Só na web: usa o vídeo e o
// canvas do navegador.
export function MonitorVideo({ mapas }: Props) {
  const telaPequena = useTelaPequena();
  const [mapaSelecionado, setMapaSelecionado] = useState<string | null>(null);
  const [mapa, setMapa] = useState<MapaDoBackend | null>(null);
  const [video, setVideo] = useState<FotoEscolhida | null>(null);
  const [usarMascara, setUsarMascara] = useState(true);
  const [otimizarMovimento, setOtimizarMovimento] = useState(true);
  const [intervalo, setIntervalo] = useState(String(INTERVALO_PADRAO));

  const [monitorando, setMonitorando] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const [resultados, setResultados] = useState<ResultadoMonitor[]>([]);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoMonitor | null>(null);
  const [statusAtual, setStatusAtual] = useState<StatusSessao>('IDLE');
  const [statusInfo, setStatusInfo] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const segundos = Math.max(INTERVALO_MINIMO, Math.min(INTERVALO_MAXIMO, parseInt(intervalo, 10) || INTERVALO_PADRAO));

  useEffect(() => {
    if (!mapaSelecionado) return;
    let ignorar = false;
    buscarMapa(mapaSelecionado)
      .then((dados) => !ignorar && setMapa(dados))
      .catch((e: unknown) => !ignorar && setErro(`Erro ao buscar mapa: ${textoDoErro(e)}`));
    return () => {
      ignorar = true;
    };
  }, [mapaSelecionado]);

  // Fecha a conexão ao sair da aba
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  function escolherMapa(id: string) {
    setMapaSelecionado(id);
    setMapa(null);
  }

  async function escolherVideo() {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
    const escolhido = resultado.canceled ? null : resultado.assets[0];
    if (escolhido) setVideo(escolhido);
  }

  function conectarWebSocket(id: string) {
    wsRef.current?.close();
    const ws = new WebSocket(urlWebSocketMonitor(id));
    wsRef.current = ws;

    ws.onopen = () => setStatusInfo('Conectado ao monitoramento em tempo real.');
    ws.onmessage = (evento) => {
      try {
        const msg = JSON.parse(evento.data) as MensagemMonitor;
        if (msg.tipo === 'resultado') {
          setUltimoResultado(msg.dados);
          setResultados((anteriores) => [msg.dados, ...anteriores].slice(0, LIMITE_HISTORICO));
        } else if (msg.tipo === 'status') {
          setStatusAtual(msg.status);
          setStatusInfo(msg.info?.message ?? '');
        } else if (msg.tipo === 'erro') {
          setErro(msg.mensagem);
        }
      } catch {
        // Ignora mensagens malformadas
      }
    };
    ws.onclose = () => {
      setStatusInfo('Desconectado do monitoramento.');
      wsRef.current = null;
    };
    ws.onerror = () => {
      setErro('Erro na conexão WebSocket.');
      wsRef.current = null;
    };
  }

  async function iniciar(textoSucesso: string) {
    if (!mapaSelecionado || !video) return;
    const resposta = await iniciarMonitoramento({
      mapaId: mapaSelecionado,
      video,
      usarMascara,
      otimizarMovimento,
      intervaloSegundos: segundos,
    });
    setSessionId(resposta.sessionId);
    setMonitorando(true);
    setMensagem(resposta.mensagem || textoSucesso);
    conectarWebSocket(resposta.sessionId);
  }

  async function aoIniciar() {
    if (!mapaSelecionado) return setMensagem('Selecione um mapa.');
    if (!video) return setMensagem('Selecione um vídeo.');
    setErro('');
    setMensagem('');
    setResultados([]);
    setUltimoResultado(null);
    setIntervalo(String(segundos));
    try {
      await iniciar('Monitoramento iniciado.');
    } catch (e) {
      setErro(textoDoErro(e) || 'Erro ao iniciar monitoramento.');
    }
  }

  async function aoParar() {
    if (!sessionId) return;
    try {
      await pararMonitoramento(sessionId);
      setMonitorando(false);
      wsRef.current?.close();
      wsRef.current = null;
      setMensagem('Monitoramento parado.');
    } catch (e) {
      setErro(textoDoErro(e) || 'Erro ao parar monitoramento.');
    }
  }

  async function aoReiniciar() {
    if (!sessionId) return;
    try {
      await pararMonitoramento(sessionId);
      wsRef.current?.close();
      wsRef.current = null;
      setResultados([]);
      setUltimoResultado(null);
      setMensagem('');
      setErro('');
      setMonitorando(false);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await iniciar('Monitoramento reiniciado.');
    } catch (e) {
      setErro(textoDoErro(e) || 'Erro ao reiniciar monitoramento.');
    }
  }

  // Desenha as vagas sobre o vídeo, com as cores de livre/ocupada do mapa do Figma
  useEffect(() => {
    const elementoVideo = videoRef.current;
    const canvas = canvasRef.current;
    if (!elementoVideo || !canvas || !ultimoResultado || !mapa) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = elementoVideo.videoWidth || mapa.Largura;
    canvas.height = elementoVideo.videoHeight || mapa.Altura;
    const ocupadaPorId = new Map(ultimoResultado.ocupacao.Vagas.map((vaga) => [vaga.ID, vaga.Ocupada]));
    const traco = Math.max(2, canvas.width / 300);
    const tamanhoTexto = Math.max(tamanhoFonte.xs, canvas.width / 60);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const vaga of mapa.Vagas) {
      const cor = ocupadaPorId.get(vaga.ID) ? coresMapa.ocupada : coresMapa.livre;
      ctx.beginPath();
      vaga.Pontos.forEach((ponto, i) => {
        const x = ponto.X * canvas.width;
        const y = ponto.Y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.globalAlpha = coresMapa.opacidadePreenchimento;
      ctx.fillStyle = cor;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cor;
      ctx.lineWidth = traco;
      ctx.stroke();

      // Nome da vaga no centro dela
      const cx = (vaga.Pontos.reduce((t, p) => t + p.X, 0) / vaga.Pontos.length) * canvas.width;
      const cy = (vaga.Pontos.reduce((t, p) => t + p.Y, 0) / vaga.Pontos.length) * canvas.height;
      ctx.font = `${tamanhoTexto}px ${fontes.inter.negrito}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = tamanhoTexto / 4;
      ctx.strokeStyle = cores.texto;
      ctx.strokeText(vaga.Nome, cx, cy);
      ctx.fillStyle = cores.textoInverso;
      ctx.fillText(vaga.Nome, cx, cy);
    }
  }, [ultimoResultado, mapa]);

  const nomeDoMapa = mapas.find((m) => m.ID === mapaSelecionado)?.Nome ?? '';
  const vagasDoUltimo = ultimoResultado?.ocupacao.Vagas ?? [];
  const ocupadasUltimo = vagasDoUltimo.filter((vaga) => vaga.Ocupada).length;

  const avisos = (
    <>
      {mensagem !== '' && <Text style={styles.mensagem}>{mensagem}</Text>}
      {erro !== '' && (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      )}
    </>
  );

  if (!monitorando) {
    return (
      <View style={styles.coluna}>
        <Painel titulo="Configurar monitoramento" style={styles.painelConfiguracao}>
          <View style={styles.campo}>
            <Text style={styles.rotuloCampo}>Mapa</Text>
            <CampoSelecao
              opcoes={mapas.map((m) => ({ rotulo: `${m.Nome} (${m.QuantidadeVagas} vagas)`, valor: m.ID }))}
              valor={mapaSelecionado}
              onChange={escolherMapa}
              placeholder={mapas.length ? 'Selecione um mapa' : 'Nenhum mapa cadastrado'}
            />
          </View>

          <View style={styles.campo}>
            <Text style={styles.rotuloCampo}>Vídeo (arquivo local)</Text>
            <View style={styles.linha}>
              <BotaoIcone tipo="secundario" titulo={video ? 'Trocar vídeo' : 'Escolher vídeo'} icone="film" onPress={() => void escolherVideo()} />
              {video?.fileName && (
                <Text style={styles.nomeArquivo} numberOfLines={1}>
                  {video.fileName}
                </Text>
              )}
            </View>
          </View>

          <Opcao
            titulo="Máscara de ROI"
            descricao="Analisar movimento só dentro das vagas."
            ativo={usarMascara}
            onChange={setUsarMascara}
          />
          <Opcao
            titulo="Otimização de movimento"
            descricao={`Analisar só se houver movimento por 5 s. Desligado: analisa a cada ${segundos} s, com ou sem movimento.`}
            ativo={otimizarMovimento}
            onChange={setOtimizarMovimento}
          />

          <View style={styles.campo}>
            <Text style={styles.rotuloCampo}>Intervalo entre análises (segundos)</Text>
            <CampoTexto
              value={intervalo}
              onChangeText={(texto) => setIntervalo(texto.replace(/\D/g, ''))}
              onBlur={() => setIntervalo(String(segundos))}
              keyboardType="number-pad"
              maxLength={2}
              accessibilityLabel="Intervalo entre análises em segundos"
              style={styles.campoIntervalo}
            />
          </View>

          <View style={styles.alinharDireita}>
            <BotaoIcone titulo="Iniciar monitoramento" icone="play" onPress={() => void aoIniciar()} />
          </View>
          {avisos}
        </Painel>
      </View>
    );
  }

  return (
    <View style={styles.coluna}>
      <View style={[styles.linhaPaineis, telaPequena && celular.linhaPaineis]}>
        <Painel titulo="Controle do monitoramento" style={styles.painelLateral}>
          <Dado rotulo="Sessão" valor={sessionId} />
          <Dado rotulo="Mapa" valor={nomeDoMapa} />
          <Dado rotulo="Status" valor={`${NOME_STATUS[statusAtual] ?? statusAtual}${statusInfo ? `: ${statusInfo}` : ''}`} />
          <View style={styles.botoes}>
            <BotaoIcone tipo="secundario" titulo="Parar" icone="square" onPress={() => void aoParar()} />
            <BotaoIcone tipo="secundario" titulo="Reiniciar" icone="rotate-ccw" onPress={() => void aoReiniciar()} />
          </View>
          {avisos}
        </Painel>

        <Painel titulo="Vídeo com o mapa de vagas" style={styles.painelPrincipal}>
          {video ? (
            <View style={styles.quadroVideo}>
              <video
                ref={videoRef}
                src={video.uri}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', display: 'block', borderRadius: raio.cartao / 2 }}
              />
              <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            </View>
          ) : (
            <Text style={styles.vazio}>Carregando vídeo...</Text>
          )}
          <View style={styles.legenda}>
            <LegendaMapa livres={vagasDoUltimo.length - ocupadasUltimo} ocupadas={ocupadasUltimo} />
            <Text style={styles.pequeno}>Quadro {ultimoResultado?.frame ?? '-'}</Text>
          </View>
        </Painel>
      </View>

      <View style={[styles.linhaPaineis, telaPequena && celular.linhaPaineis]}>
        <Painel titulo="Resultado da última análise" style={styles.painelLateral}>
          {ultimoResultado ? (
            <>
              <Dado rotulo="Quadro" valor={`${ultimoResultado.frame} de ${ultimoResultado.totalFrames}`} />
              <Dado rotulo="Horário" valor={new Date(ultimoResultado.timestamp).toLocaleTimeString('pt-BR')} />
              <Dado
                rotulo="Movimento"
                valor={`${ultimoResultado.motionDetected ? 'sim' : 'não'}${
                  ultimoResultado.motionInfo ? ` (${(ultimoResultado.motionInfo.ratio * 100).toFixed(1)}% dos pixels)` : ''
                }`}
              />
              <Tabela
                colunas={['Vaga', 'Status', 'Confiança']}
                linhas={vagasDoUltimo.map((vaga) => ({
                  chave: vaga.ID,
                  celulas: [
                    { texto: vaga.Nome },
                    { texto: vaga.Ocupada ? 'Ocupada' : 'Livre', cor: vaga.Ocupada ? coresMapa.ocupada : coresMapa.livre },
                    { texto: `${(vaga.Sobreposicao * 100).toFixed(0)}%` },
                  ],
                }))}
              />
            </>
          ) : (
            <Text style={styles.vazio}>Aguardando a primeira análise...</Text>
          )}
        </Painel>

        <Painel titulo="Histórico (últimas análises)" style={styles.painelPrincipal}>
          {resultados.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma análise ainda.</Text>
          ) : (
            <Tabela
              colunas={['Quadro', 'Horário', 'Movimento', 'Ocupadas', 'Livres', 'Total']}
              linhas={resultados.map((r) => {
                const ocupadas = r.ocupacao.Vagas.filter((vaga) => vaga.Ocupada).length;
                return {
                  chave: `${r.sessionId}-${r.frame}`,
                  celulas: [
                    { texto: String(r.frame) },
                    { texto: new Date(r.timestamp).toLocaleTimeString('pt-BR') },
                    { texto: r.motionDetected ? 'Sim' : 'Não' },
                    { texto: String(ocupadas), cor: coresMapa.ocupada },
                    { texto: String(r.ocupacao.Vagas.length - ocupadas), cor: coresMapa.livre },
                    { texto: String(r.ocupacao.Vagas.length) },
                  ],
                };
              })}
            />
          )}
        </Painel>
      </View>
    </View>
  );
}

function Painel({ titulo, style, children }: { titulo: string; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <CaixaGradiente
      borda={gradientes.neutro.borda}
      fundo={cores.superficie}
      raio={raio.cartao}
      style={style}
      estiloConteudo={styles.painelConteudo}
    >
      <Text style={styles.rotulo}>{titulo}</Text>
      {children}
    </CaixaGradiente>
  );
}

function Opcao({ titulo, descricao, ativo, onChange }: { titulo: string; descricao: string; ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.opcao}>
      <View style={styles.opcaoTextos}>
        <Text style={styles.rotuloCampo}>{titulo}</Text>
        <Text style={styles.pequeno}>{descricao}</Text>
      </View>
      <Interruptor ativo={ativo} onChange={onChange} rotulo={titulo} />
    </View>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Text style={styles.dado}>
      <Text style={styles.dadoRotulo}>{rotulo}: </Text>
      {valor}
    </Text>
  );
}

type Celula = { texto: string; cor?: string };

function Tabela({ colunas, linhas }: { colunas: string[]; linhas: { chave: string; celulas: Celula[] }[] }) {
  return (
    <View>
      <View style={[styles.linhaTabela, styles.cabecalhoTabela]}>
        {colunas.map((coluna) => (
          <Text key={coluna} style={[styles.celula, styles.celulaCabecalho]}>
            {coluna}
          </Text>
        ))}
      </View>
      {linhas.map((linha) => (
        <View key={linha.chave} style={styles.linhaTabela}>
          {linha.celulas.map((celula, i) => (
            <Text key={i} style={[styles.celula, celula.cor ? { color: celula.cor, fontFamily: fontes.inter.seminegrito } : null]}>
              {celula.texto}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  coluna: {
    gap: espaco[6],
  },
  linhaPaineis: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco[6],
  },
  painelConfiguracao: {
    maxWidth: larguras.sm,
    // A lista aberta do seletor de mapa fica por cima dos campos de baixo
    zIndex: 1,
  },
  painelLateral: {
    width: larguras.padrao,
  },
  painelPrincipal: {
    flex: 1,
  },
  painelConteudo: {
    gap: espaco[4],
    padding: espaco[6],
  },
  rotulo: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  campo: {
    gap: espaco[2],
    zIndex: 1,
  },
  rotuloCampo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.seminegrito,
    color: cores.texto,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
  },
  nomeArquivo: {
    ...tipografia.pequeno,
    flexShrink: 1,
    color: cores.textoSuave,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco[4],
  },
  opcaoTextos: {
    flexShrink: 1,
    gap: espaco[1],
  },
  campoIntervalo: {
    width: espaco[24],
  },
  alinharDireita: {
    alignItems: 'flex-end',
  },
  botoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco[3],
  },
  dado: {
    ...tipografia.corpo,
    color: cores.textoSecundario,
  },
  dadoRotulo: {
    fontFamily: fontes.inter.seminegrito,
    color: cores.texto,
  },
  quadroVideo: {
    position: 'relative',
  },
  legenda: {
    gap: espaco[2],
    alignItems: 'center',
  },
  pequeno: {
    ...tipografia.pequeno,
    color: cores.textoSuave,
  },
  mensagem: {
    ...tipografia.corpo,
    color: cores.primaria,
  },
  erro: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.perigo,
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
    paddingVertical: espaco[8],
  },
  linhaTabela: {
    flexDirection: 'row',
    paddingVertical: espaco[2],
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  cabecalhoTabela: {
    borderBottomColor: cores.primaria,
  },
  celula: {
    ...tipografia.pequeno,
    flex: 1,
    color: cores.textoSecundario,
  },
  celulaCabecalho: {
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
  },
});

const celular = StyleSheet.create({
  linhaPaineis: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});
