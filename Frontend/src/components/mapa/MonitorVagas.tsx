import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { CampoSelecao } from '@/components/campos/CampoTexto';
import { LegendaMapa } from '@/components/mapa/LegendaMapa';
import {
  analisarFoto,
  buscarMapa,
  type FotoEscolhida,
  type MapaDoBackend,
  type OcupacaoDoBackend,
  type ResumoMapaDoBackend,
} from '@/dados/api';
import { vincularMapaAoBloco } from '@/dados/parceiros';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, fontes, gradientes, larguras, mapa as coresMapa, raio, tipografia } from '@/theme';

function mensagemDoErro(erro: unknown) {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}

// Contorno das vagas proporcional ao tamanho da foto, para ficar visível em qualquer resolução
const PROPORCAO_CONTORNO = 300;

type Props = {
  mapas: ResumoMapaDoBackend[];
  // Mapa já escolhido ao abrir (vem do ícone de mapa do bloco)
  mapaInicial?: string;
  // Bloco que abriu a tela: ao analisar, fica ligado ao mapa e os cartões passam a mostrar o resultado
  bloco?: { campusId: string; blocoId: string; nome: string };
};

// Aba "Monitor de vagas" (mesma lógica do frontend-admin): escolhe o mapa e uma foto da câmera e a
// IA do backend diz quais vagas estão livres ou ocupadas. Funciona na web e no celular.
export function MonitorVagas({ mapas, mapaInicial, bloco }: Props) {
  const telaPequena = useTelaPequena();
  const [mapaId, setMapaId] = useState<string | null>(mapaInicial || null);
  const [mapa, setMapa] = useState<MapaDoBackend | null>(null);
  const [foto, setFoto] = useState<FotoEscolhida | null>(null);
  const [ocupacao, setOcupacao] = useState<OcupacaoDoBackend | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!mapaId) return;
    let ativo = true;
    buscarMapa(mapaId)
      .then((dados) => ativo && setMapa(dados))
      .catch((e: unknown) => ativo && setErro(mensagemDoErro(e)));
    return () => {
      ativo = false;
    };
  }, [mapaId]);

  function escolherMapa(id: string) {
    setMapaId(id);
    setMapa(null);
    setOcupacao(null);
    setMensagem('');
    setErro('');
  }

  async function escolherFoto() {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const escolhida = resultado.canceled ? null : resultado.assets[0];
    if (!escolhida) return;
    setFoto(escolhida);
    setOcupacao(null);
    setMensagem('');
    setErro('');
  }

  async function analisar() {
    if (!mapaId) return setErro('Selecione um mapa.');
    if (!foto) return setErro('Selecione uma imagem para analisar.');
    setAnalisando(true);
    setErro('');
    setMensagem('');
    try {
      const resultado = await analisarFoto(mapaId, foto);
      setOcupacao(resultado);
      const ocupadas = resultado.Vagas.filter((vaga) => vaga.Ocupada).length;
      // O backend guardou o resultado como ocupação atual do mapa; ligando o bloco a ele, os cartões
      // do bloco, do campus e do parceiro passam a mostrar esses números
      if (bloco) vincularMapaAoBloco(bloco.campusId, bloco.blocoId, mapaId);
      setMensagem(
        `Análise concluída: ${ocupadas} de ${resultado.Vagas.length} vagas ocupadas.` +
          (bloco ? ` Os cartões do ${bloco.nome} já mostram esse resultado.` : ''),
      );
    } catch (e) {
      setErro(mensagemDoErro(e));
    } finally {
      setAnalisando(false);
    }
  }

  const estadoDaVaga = (id: string) => ocupacao?.Vagas.find((vaga) => vaga.ID === id)?.Ocupada;
  const ocupadas = ocupacao?.Vagas.filter((vaga) => vaga.Ocupada).length ?? 0;
  const livres = (ocupacao?.Vagas.length ?? 0) - ocupadas;

  let areaFoto;
  if (!mapaId) {
    areaFoto = <Text style={styles.vazio}>Selecione um mapa para começar.</Text>;
  } else if (!mapa) {
    areaFoto = <ActivityIndicator color={cores.primaria} />;
  } else if (!foto) {
    areaFoto = <Text style={styles.vazio}>Selecione uma imagem da mesma câmera para visualizar as vagas deste mapa.</Text>;
  } else {
    const contorno = mapa.Largura / PROPORCAO_CONTORNO;
    areaFoto = (
      <View style={[styles.foto, { aspectRatio: mapa.Largura / mapa.Altura }]}>
        {/* A foto é esticada para a proporção do mapa, como na análise do backend */}
        <Image source={{ uri: foto.uri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${mapa.Largura} ${mapa.Altura}`}
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          {mapa.Vagas.map((vaga) => {
            const ocupada = estadoDaVaga(vaga.ID);
            // Antes da análise só o contorno; depois, as cores de livre/ocupada do mapa do Figma
            const cor = ocupada === undefined ? cores.primaria : ocupada ? coresMapa.ocupada : coresMapa.livre;
            return (
              <Polygon
                key={vaga.ID}
                points={vaga.Pontos.map((p) => `${p.X * mapa.Largura},${p.Y * mapa.Altura}`).join(' ')}
                fill={ocupada === undefined ? 'none' : cor}
                fillOpacity={coresMapa.opacidadePreenchimento}
                stroke={cor}
                strokeWidth={contorno}
              />
            );
          })}
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.corpo, telaPequena && celular.corpo]}>
      <View style={[styles.painel, telaPequena && celular.painel]}>
        <View style={styles.campo}>
          <Text style={styles.rotulo}>Mapa</Text>
          <CampoSelecao
            opcoes={mapas.map((item) => ({ rotulo: `${item.Nome} (${item.QuantidadeVagas} vagas)`, valor: item.ID }))}
            valor={mapaId}
            onChange={escolherMapa}
            placeholder={mapas.length ? 'Selecione um mapa' : 'Nenhum mapa cadastrado'}
            style={styles.selecao}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>Imagem a analisar</Text>
          <BotaoIcone
            tipo="secundario"
            titulo={foto ? 'Trocar imagem' : 'Escolher imagem'}
            icone="image"
            onPress={() => void escolherFoto()}
          />
          {foto?.fileName && (
            <Text style={styles.nomeArquivo} numberOfLines={1}>
              {foto.fileName}
            </Text>
          )}
        </View>

        <BotaoIcone titulo={analisando ? 'Analisando...' : 'Analisar'} icone="cpu" onPress={() => void analisar()} />

        {erro !== '' && (
          <Text style={styles.erro} accessibilityRole="alert">
            {erro}
          </Text>
        )}
        {mensagem !== '' && <Text style={styles.mensagem}>{mensagem}</Text>}
        {ocupacao && <LegendaMapa livres={livres} ocupadas={ocupadas} />}
      </View>

      <CaixaGradiente
        borda={gradientes.neutro.borda}
        fundo={cores.superficie}
        raio={raio.cartao}
        style={styles.area}
        estiloConteudo={styles.areaConteudo}
      >
        {areaFoto}
      </CaixaGradiente>
    </View>
  );
}

const styles = StyleSheet.create({
  corpo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco[8],
  },
  painel: {
    width: larguras.padrao,
    gap: espaco[6],
    // A lista aberta do CampoSelecao fica por cima da foto ao lado
    zIndex: 1,
  },
  campo: {
    gap: espaco[3],
    alignItems: 'flex-start',
  },
  rotulo: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  // Mesma largura do botão "Analisar", que ocupa o painel inteiro
  selecao: {
    alignSelf: 'stretch',
  },
  nomeArquivo: {
    ...tipografia.pequeno,
    alignSelf: 'stretch',
    color: cores.textoSuave,
  },
  erro: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.perigo,
  },
  mensagem: {
    ...tipografia.corpo,
    color: cores.primaria,
  },
  area: {
    flex: 1,
    alignSelf: 'stretch',
  },
  areaConteudo: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco[4],
  },
  foto: {
    width: '100%',
    borderRadius: raio.cartao / 2,
    overflow: 'hidden',
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
    paddingVertical: espaco[16],
  },
});

const celular = StyleSheet.create({
  corpo: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  painel: {
    width: 'auto',
  },
});
