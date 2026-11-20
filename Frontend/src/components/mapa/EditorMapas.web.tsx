import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, type PointerEvent as EventoPonteiro } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { DialogoConfirmacao } from '@/components/base/DialogoConfirmacao';
import { Botao } from '@/components/botoes/Botao';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { CampoSelecao, CampoTexto } from '@/components/campos/CampoTexto';
import {
  buscarMapa,
  criarMapa,
  detectarVagas,
  salvarVagas,
  urlImagemDoMapa,
  type FotoEscolhida,
  type MapaDoBackend,
  type PontoDoBackend,
  type ResumoMapaDoBackend,
  type VagaDoBackend,
} from '@/dados/api';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, fontes, gradientes, mapa as coresMapa, ocupacao, raio, tipografia } from '@/theme';

function textoDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}

type Confirmacao = { titulo: string; mensagem: string; acao: string; executar: () => void };

type Props = {
  mapas: ResumoMapaDoBackend[];
  // Recarrega a lista de mapas depois de criar um mapa ou salvar vagas
  aoAtualizarMapas: () => Promise<void>;
};

// Aba "Editor de mapas" (mesma lógica do frontend-admin): abre ou cria um mapa a partir de uma
// imagem e desenha as vagas (4 cantos cada), à mão ou com a IA. Só na web: o desenho depende do
// SVG do navegador (clique e arraste com precisão).
export function EditorMapas({ mapas, aoAtualizarMapas }: Props) {
  const telaPequena = useTelaPequena();
  const [mapa, setMapa] = useState<MapaDoBackend | null>(null);
  const [vagas, setVagas] = useState<VagaDoBackend[]>([]);
  const [selecionadaID, setSelecionadaID] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<PontoDoBackend[] | null>(null);
  const [criandoVagasIA, setCriandoVagasIA] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);

  // O ID do mapa novo não é digitado: vem do backend (auto-incremento)
  const [novoNome, setNovoNome] = useState('');
  const [novaImagem, setNovaImagem] = useState<FotoEscolhida | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Atalho "V" para "Nova vaga" (o botão sempre mostrou o atalho, mas ele não estava ligado no admin)
  const iniciarDesenhoRef = useRef<() => void>(() => {});
  useEffect(() => {
    iniciarDesenhoRef.current = iniciarDesenho;
  });
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null;
      const digitando = alvo?.tagName === 'INPUT' || alvo?.tagName === 'TEXTAREA' || alvo?.isContentEditable;
      if (!digitando && evento.key.toLowerCase() === 'v' && !evento.ctrlKey && !evento.metaKey) iniciarDesenhoRef.current();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  // Avisa o navegador antes de sair com vagas não salvas
  useEffect(() => {
    if (!alterado) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [alterado]);

  // Pede confirmação só se houver alterações não salvas (antes era o confirm() do navegador)
  function confirmarDescarte(continuar: () => void) {
    if (!alterado) return continuar();
    setConfirmacao({
      titulo: 'Descartar alterações?',
      mensagem: 'As vagas alteradas neste mapa ainda não foram salvas e serão perdidas.',
      acao: 'Descartar',
      executar: continuar,
    });
  }

  function abrirMapa(dados: MapaDoBackend) {
    setMapa(dados);
    setVagas(structuredClone(dados.Vagas));
    setSelecionadaID(null);
    setRascunho(null);
    setAlterado(false);
  }

  function abrirExistente(id: string) {
    if (!id) return;
    confirmarDescarte(async () => {
      try {
        const dados = await buscarMapa(id);
        abrirMapa(dados);
        setMensagem(`${dados.Nome}: ${dados.Vagas.length} vaga(s).`);
      } catch (erro) {
        setMensagem(textoDoErro(erro));
      }
    });
  }

  async function escolherImagem() {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const escolhida = resultado.canceled ? null : resultado.assets[0];
    if (escolhida) setNovaImagem(escolhida);
  }

  function aoCriar() {
    const nome = novoNome.trim();

    if (!nome) return setMensagem('Informe o nome do mapa.');
    if (!novaImagem) return setMensagem('Selecione uma imagem JPG ou PNG.');

    confirmarDescarte(async () => {
      setOcupado(true);
      try {
        const criado = await criarMapa(nome, novaImagem);
        abrirMapa(criado);
        setMensagem(`Mapa "${criado.Nome}" criado.`);
        setNovoNome('');
        setNovaImagem(null);
        await aoAtualizarMapas();
      } catch (erro) {
        setMensagem(textoDoErro(erro));
      } finally {
        setOcupado(false);
      }
    });
  }

  function iniciarDesenho() {
    if (!mapa) return setMensagem('Abra ou crie um mapa primeiro.');
    setRascunho([]);
    setSelecionadaID(null);
    setMensagem('Clique nos 4 cantos da vaga.');
  }

  async function detectar() {
    if (!mapa) return;
    setCriandoVagasIA(true);
    setMensagem('Detectando vagas com IA...');
    try {
      const resultado = await detectarVagas(mapa.ID);
      const novasVagas: VagaDoBackend[] = resultado.Vagas.map((vaga, indice) => ({
        ID: `vaga-${crypto.randomUUID()}`,
        Nome: `A${indice + 1}`,
        Pontos: vaga.Pontos,
      }));
      setVagas(novasVagas);
      setSelecionadaID(null);
      setRascunho(null);
      setAlterado(true);
      setMensagem(`${novasVagas.length} vaga(s) detectada(s). Revise e clique em "Salvar vagas".`);
    } catch (erro) {
      setMensagem(textoDoErro(erro));
    } finally {
      setCriandoVagasIA(false);
    }
  }

  function criarVagasIA() {
    if (!mapa) return setMensagem('Abra ou crie um mapa primeiro.');
    if (vagas.length === 0) return void detectar();
    setConfirmacao({
      titulo: 'Substituir as vagas?',
      mensagem: 'As vagas atuais serão substituídas pelas vagas detectadas pela IA.',
      acao: 'Substituir',
      executar: () => void detectar(),
    });
  }

  function cancelarDesenho() {
    setRascunho(null);
    setMensagem('Desenho cancelado.');
  }

  function adicionarPonto(ponto: PontoDoBackend) {
    if (!rascunho) return;
    const pontos = [...rascunho, ponto];
    if (pontos.length < 4) {
      setRascunho(pontos);
      setMensagem(`${pontos.length} de 4 pontos.`);
      return;
    }
    const vaga: VagaDoBackend = { ID: `vaga-${crypto.randomUUID()}`, Nome: `A${vagas.length + 1}`, Pontos: pontos };
    setVagas([...vagas, vaga]);
    setRascunho(null);
    setSelecionadaID(vaga.ID);
    setAlterado(true);
    setMensagem(`${vaga.Nome} criada.`);
  }

  function moverPonto(id: string, indice: number, ponto: PontoDoBackend) {
    setVagas((atual) =>
      atual.map((vaga) => (vaga.ID === id ? { ...vaga, Pontos: vaga.Pontos.map((p, i) => (i === indice ? ponto : p)) } : vaga)),
    );
    setAlterado(true);
  }

  function renomearSelecionada(nome: string) {
    setVagas((atual) => atual.map((vaga) => (vaga.ID === selecionadaID ? { ...vaga, Nome: nome } : vaga)));
    setAlterado(true);
  }

  function excluirSelecionada() {
    if (!selecionadaID) return setMensagem('Selecione uma vaga primeiro.');
    setVagas((atual) => atual.filter((vaga) => vaga.ID !== selecionadaID));
    setSelecionadaID(null);
    setAlterado(true);
    setMensagem('Vaga excluída localmente.');
  }

  async function salvar() {
    if (!mapa) return setMensagem('Abra ou crie um mapa primeiro.');
    if (rascunho) return setMensagem('Conclua ou cancele o desenho antes de salvar.');
    if (vagas.some((vaga) => !vaga.Nome.trim())) return setMensagem('Toda vaga precisa de um nome.');
    try {
      const atualizado = await salvarVagas(mapa.ID, vagas);
      setMapa(atualizado);
      setVagas(structuredClone(atualizado.Vagas));
      setAlterado(false);
      setMensagem(`${atualizado.Vagas.length} vaga(s) salva(s).`);
      await aoAtualizarMapas();
    } catch (erro) {
      setMensagem(textoDoErro(erro));
    }
  }

  const selecionada = vagas.find((vaga) => vaga.ID === selecionadaID);

  return (
    <View style={styles.editor}>
      <View style={[styles.paineis, telaPequena && celular.paineis]}>
        <CaixaGradiente
          borda={gradientes.neutro.borda}
          fundo={cores.superficie}
          raio={raio.cartao}
          style={[styles.painel, styles.painelSelecao]}
          estiloConteudo={styles.painelConteudo}
        >
          <Text style={styles.rotulo}>Abrir mapa existente</Text>
          <CampoSelecao
            opcoes={mapas.map((item) => ({ rotulo: `${item.Nome} (${item.QuantidadeVagas} vagas)`, valor: item.ID }))}
            valor={mapa?.ID ?? null}
            onChange={abrirExistente}
            placeholder={mapas.length ? 'Selecione um mapa' : 'Nenhum mapa cadastrado'}
          />
        </CaixaGradiente>

        <CaixaGradiente
          borda={gradientes.neutro.borda}
          fundo={cores.superficie}
          raio={raio.cartao}
          style={styles.painel}
          estiloConteudo={styles.painelConteudo}
        >
          <Text style={styles.rotulo}>Novo mapa a partir de uma imagem</Text>
          <CampoTexto value={novoNome} onChangeText={setNovoNome} placeholder="Nome (ex.: Câmera Norte)" accessibilityLabel="Nome do mapa" />
          <View style={styles.linhaArquivo}>
            <BotaoIcone tipo="secundario" titulo={novaImagem ? 'Trocar imagem' : 'Escolher imagem'} icone="image" onPress={() => void escolherImagem()} />
            {novaImagem?.fileName && (
              <Text style={styles.nomeArquivo} numberOfLines={1}>
                {novaImagem.fileName}
              </Text>
            )}
          </View>
          <View style={styles.alinharDireita}>
            <BotaoIcone titulo={ocupado ? 'Criando...' : 'Criar mapa'} icone="plus" onPress={aoCriar} />
          </View>
        </CaixaGradiente>
      </View>

      {mensagem !== '' && <Text style={styles.mensagem}>{mensagem}</Text>}

      {mapa ? (
        <>
          <View style={styles.controles}>
            <Botao titulo="Nova vaga (V)" onPress={iniciarDesenho} />
            <Botao titulo={criandoVagasIA ? 'Detectando...' : 'Criar vagas com IA'} onPress={criarVagasIA} />
            {rascunho && <Botao tipo="secundario" titulo="Cancelar desenho" onPress={cancelarDesenho} />}
            {selecionada && <Botao tipo="secundario" titulo="Excluir selecionada" onPress={excluirSelecionada} />}
            {alterado && <Botao tipo="secundario" titulo="Salvar vagas" onPress={() => void salvar()} />}
            {selecionada && (
              <CampoTexto
                value={selecionada.Nome}
                onChangeText={renomearSelecionada}
                placeholder="Nome da vaga"
                accessibilityLabel="Nome da vaga selecionada"
                style={styles.nomeVaga}
              />
            )}
          </View>

          <CaixaGradiente
            borda={gradientes.neutro.borda}
            fundo={cores.superficie}
            raio={raio.cartao}
            estiloConteudo={styles.areaConteudo}
          >
            <QuadroDeVagas
              mapa={mapa}
              vagas={vagas}
              selecionadaID={selecionadaID}
              rascunho={rascunho}
              aoSelecionar={setSelecionadaID}
              aoMoverPonto={moverPonto}
              aoAdicionarPonto={adicionarPonto}
            />
          </CaixaGradiente>
        </>
      ) : (
        <Text style={styles.vazio}>Abra um mapa existente ou crie um novo a partir de uma imagem.</Text>
      )}

      <DialogoConfirmacao
        visivel={confirmacao !== null}
        titulo={confirmacao?.titulo ?? ''}
        mensagem={confirmacao?.mensagem ?? ''}
        acao={confirmacao?.acao ?? ''}
        onConfirmar={() => {
          const executar = confirmacao?.executar;
          setConfirmacao(null);
          executar?.();
        }}
        onCancelar={() => setConfirmacao(null)}
      />
    </View>
  );
}

type QuadroProps = {
  mapa: MapaDoBackend;
  vagas: VagaDoBackend[];
  selecionadaID: string | null;
  rascunho: PontoDoBackend[] | null;
  aoSelecionar: (id: string | null) => void;
  aoMoverPonto: (id: string, indice: number, ponto: PontoDoBackend) => void;
  aoAdicionarPonto: (ponto: PontoDoBackend) => void;
};

function paraTexto(pontos: PontoDoBackend[], mapa: MapaDoBackend): string {
  return pontos.map((p) => `${p.X * mapa.Largura},${p.Y * mapa.Altura}`).join(' ');
}

// Imagem de referência com as vagas por cima: clique para marcar cantos, clique numa vaga para
// selecionar e arraste os cantos da selecionada (mesmo comportamento do EditorVagas do admin)
function QuadroDeVagas({ mapa, vagas, selecionadaID, rascunho, aoSelecionar, aoMoverPonto, aoAdicionarPonto }: QuadroProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [arrastando, setArrastando] = useState<{ ID: string; indice: number } | null>(null);

  function pontoDoEvento(evento: { clientX: number; clientY: number }): PontoDoBackend | null {
    const matriz = svgRef.current?.getScreenCTM();
    if (!matriz) return null;
    const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz.inverse());
    return { X: Math.max(0, Math.min(1, p.x / mapa.Largura)), Y: Math.max(0, Math.min(1, p.y / mapa.Altura)) };
  }

  const selecionada = vagas.find((vaga) => vaga.ID === selecionadaID);
  // Tamanhos proporcionais à imagem, como no admin
  const raioPonto = Math.max(5, mapa.Largura / 120);
  const traco = Math.max(2, mapa.Largura / 300);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${mapa.Largura} ${mapa.Altura}`}
      style={{
        width: '100%',
        display: 'block',
        aspectRatio: `${mapa.Largura} / ${mapa.Altura}`,
        borderRadius: raio.cartao / 2,
        cursor: rascunho ? 'crosshair' : 'default',
        touchAction: 'none',
      }}
      onPointerDown={(evento) => {
        if (rascunho) {
          const ponto = pontoDoEvento(evento);
          if (ponto) aoAdicionarPonto(ponto);
          return;
        }
        aoSelecionar(null);
      }}
      onPointerMove={(evento) => {
        if (!arrastando) return;
        const ponto = pontoDoEvento(evento);
        if (ponto) aoMoverPonto(arrastando.ID, arrastando.indice, ponto);
      }}
      onPointerUp={() => setArrastando(null)}
      onPointerCancel={() => setArrastando(null)}
    >
      <image href={urlImagemDoMapa(mapa)} width={mapa.Largura} height={mapa.Altura} pointerEvents="none" />

      {vagas.map((vaga) => {
        const ativa = vaga.ID === selecionadaID;
        return (
          <polygon
            key={vaga.ID}
            points={paraTexto(vaga.Pontos, mapa)}
            fill={ativa ? cores.primariaClara : cores.secundaria}
            fillOpacity={coresMapa.opacidadePreenchimento}
            stroke={ativa ? cores.primariaEscura : cores.primaria}
            strokeWidth={ativa ? traco * 2 : traco}
            style={{ cursor: rascunho ? 'crosshair' : 'pointer' }}
            onPointerDown={(evento: EventoPonteiro<SVGPolygonElement>) => {
              if (rascunho) return;
              evento.stopPropagation();
              aoSelecionar(vaga.ID);
            }}
          />
        );
      })}

      {rascunho && rascunho.length > 1 && (
        <polyline points={paraTexto(rascunho, mapa)} fill="none" stroke={ocupacao.moderado.barra} strokeWidth={traco} />
      )}

      {rascunho?.map((ponto, indice) => (
        <circle key={indice} cx={ponto.X * mapa.Largura} cy={ponto.Y * mapa.Altura} r={raioPonto} fill={ocupacao.moderado.barra} />
      ))}

      {!rascunho &&
        selecionada?.Pontos.map((ponto, indice) => (
          <circle
            key={indice}
            cx={ponto.X * mapa.Largura}
            cy={ponto.Y * mapa.Altura}
            r={raioPonto}
            fill={cores.superficie}
            stroke={cores.primariaEscura}
            strokeWidth={traco}
            style={{ cursor: 'grab' }}
            onPointerDown={(evento: EventoPonteiro<SVGCircleElement>) => {
              evento.stopPropagation();
              svgRef.current?.setPointerCapture(evento.pointerId);
              setArrastando({ ID: selecionada.ID, indice });
            }}
          />
        ))}
    </svg>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: espaco[6],
  },
  paineis: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco[6],
    // A lista aberta do "Abrir mapa existente" fica por cima do que vem abaixo
    zIndex: 1,
  },
  painel: {
    flex: 1,
  },
  painelSelecao: {
    zIndex: 1,
  },
  painelConteudo: {
    gap: espaco[4],
    padding: espaco[6],
  },
  rotulo: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  linhaArquivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
  },
  nomeArquivo: {
    ...tipografia.pequeno,
    flexShrink: 1,
    color: cores.textoSuave,
  },
  alinharDireita: {
    alignItems: 'flex-end',
  },
  mensagem: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.primaria,
  },
  controles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: espaco[3],
  },
  // Campo do nome da vaga ao lado dos botões
  nomeVaga: {
    width: espaco[48],
  },
  areaConteudo: {
    padding: espaco[4],
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
    paddingVertical: espaco[16],
  },
});

const celular = StyleSheet.create({
  paineis: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});
