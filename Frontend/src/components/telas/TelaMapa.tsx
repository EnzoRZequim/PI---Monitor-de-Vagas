import { Stack, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { LegendaMapa } from '@/components/mapa/LegendaMapa';
import { MapaVagas } from '@/components/mapa/MapaVagas';
import { Cabecalho } from '@/components/navegacao/Cabecalho';
import type { Planta } from '@/dados/mapaVagas';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, gradientes, LARGURA_CONTEUDO, raio, tipografia } from '@/theme';

type Props = {
  // Nome do bloco
  titulo: string;
  // Nome do campus
  subtitulo: string;
  planta: Planta;
  // IDs das vagas ocupadas
  ocupadas: ReadonlySet<string>;
  // Rota usada pelo "Voltar" quando não há histórico (ex.: a página foi aberta direto pela URL)
  voltarPara: Href;
};

// Mapa de vagas de um bloco. No celular segue o frame "Bloco A (mapa)" do Figma: título, mapa e
// "Voltar". No desktop usa o mesmo cabeçalho das telas de lista, com o mapa ocupando o resto da janela.
export function TelaMapa({ titulo, subtitulo, planta, ocupadas, voltarPara }: Props) {
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();

  const total = planta.Vagas.length;
  const ocupadasNoBloco = planta.Vagas.filter((vaga) => ocupadas.has(vaga.ID)).length;
  const preferenciais = planta.Vagas.filter((vaga) => vaga.Tipo === 'preferencial');
  const preferenciaisLivres = preferenciais.filter((vaga) => !ocupadas.has(vaga.ID)).length;

  const descricao =
    `${titulo}, ${subtitulo}: ${total - ocupadasNoBloco} de ${total} vagas livres e ${ocupadasNoBloco} ocupadas. ` +
    `${preferenciaisLivres} de ${preferenciais.length} vagas preferenciais livres.`;

  const tituloAba = <Stack.Screen options={{ title: `${titulo} | Vaga Livre` }} />;
  const legenda = (
    <LegendaMapa livres={total - ocupadasNoBloco} ocupadas={ocupadasNoBloco} preferenciaisLivres={preferenciaisLivres} />
  );
  const mapa = <MapaVagas planta={planta} ocupadas={ocupadas} descricao={descricao} />;
  const botaoVoltar = <BotaoIcone titulo="Voltar" icone="rotate-ccw" onPress={() => voltar(voltarPara)} />;

  if (telaPequena) {
    return (
      <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {tituloAba}

        <View style={celular.titulos}>
          <Text style={celular.titulo}>{titulo}</Text>
          <Text style={celular.subtitulo}>{subtitulo}</Text>
          {legenda}
        </View>

        <View style={celular.mapa}>{mapa}</View>

        <View style={celular.rodape}>{botaoVoltar}</View>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      {tituloAba}
      <Cabecalho />

      <View style={desktop.pagina}>
        <View style={desktop.conteudo}>
          <View style={desktop.topo}>
            <View style={desktop.tituloBloco}>
              {botaoVoltar}
              <View style={desktop.titulos}>
                <Text style={desktop.titulo}>{titulo}</Text>
                <Text style={desktop.subtitulo}>{subtitulo}</Text>
                {/* Dentro do bloco do título para acompanhar a largura do texto */}
                <View style={desktop.divisor} />
              </View>
            </View>

            <View style={desktop.legenda}>{legenda}</View>
          </View>

          {/* O mapa ocupa o resto da janela: a roda do mouse sempre dá zoom, e a página não rola */}
          <CaixaGradiente
            borda={gradientes.neutro.borda}
            fundo={cores.superficie}
            raio={raio.cartao}
            style={desktop.painel}
            estiloConteudo={desktop.painelConteudo}
          >
            {mapa}
          </CaixaGradiente>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
});

// Valores do Figma ("Bloco A (mapa)", 393px): 10px nas bordas, 16px entre título e subtítulo e 36px
// até o mapa
const celular = StyleSheet.create({
  titulos: {
    alignItems: 'center',
    gap: espaco[4],
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 36,
  },
  titulo: {
    ...tipografia.h4,
    color: cores.primaria,
    textAlign: 'center',
  },
  subtitulo: {
    ...tipografia.pequeno,
    color: cores.primaria,
    textAlign: 'center',
  },
  mapa: {
    flex: 1,
    paddingHorizontal: 10,
  },
  rodape: {
    alignItems: 'center',
    paddingVertical: espaco[4],
  },
});

// Mesmo padrão da TelaLista no desktop
const desktop = StyleSheet.create({
  pagina: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: espaco[8],
    paddingVertical: espaco[8],
  },
  conteudo: {
    flex: 1,
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    gap: espaco[6],
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaco[6],
  },
  tituloBloco: {
    alignItems: 'flex-start',
    gap: espaco[6],
  },
  titulos: {
    gap: espaco[2],
  },
  titulo: {
    ...tipografia.h3,
    color: cores.primaria,
  },
  subtitulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.primaria,
  },
  divisor: {
    height: 2,
    backgroundColor: cores.primaria,
    marginTop: espaco[4],
  },
  // Alinha a legenda ao texto, e não à barra abaixo do título
  legenda: {
    marginBottom: espaco[4] + espaco[2] + 2,
  },
  painel: {
    flex: 1,
  },
  painelConteudo: {
    flex: 1,
    overflow: 'hidden',
  },
});
