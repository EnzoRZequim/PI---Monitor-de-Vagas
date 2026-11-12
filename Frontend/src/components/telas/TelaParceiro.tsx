import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cabecalho } from '@/components/navegacao/Cabecalho';
import { BarraParceiro, type SecaoParceiro } from '@/components/navegacao/NavegacaoParceiro';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, fontes, LARGURA_CONTEUDO, tamanhoFonte, tipografia } from '@/theme';

type Props = {
  secao: SecaoParceiro;
  // Texto da aba do navegador
  tituloAba: string;
  titulo: string;
  subtitulo?: string;
  // Lado direito do título (ex.: botão "Novo local")
  acao?: ReactNode;
  // Só no celular: distância do título até o conteúdo (varia entre as telas do Figma)
  espacoTitulo?: number;
  // Só no celular: botão flutuante no canto inferior direito, acima da barra (ex.: "+" de Seus locais)
  acaoFlutuante?: ReactNode;
  children: ReactNode;
};

// Layout compartilhado pelas telas da área do parceiro: navegação no Cabecalho no desktop e na
// barra inferior no celular
export function TelaParceiro({
  secao,
  tituloAba,
  titulo,
  subtitulo,
  acao,
  espacoTitulo = ESPACO_TITULO_CELULAR,
  acaoFlutuante,
  children,
}: Props) {
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: `${tituloAba} | Vaga Livre` }} />
      {!telaPequena && <Cabecalho secaoParceiro={secao} />}

      <View style={styles.preencher}>
        <ScrollView
          contentContainerStyle={[
            styles.rolagem,
            telaPequena && [celular.rolagem, { paddingTop: insets.top + celular.rolagem.paddingTop }],
          ]}
        >
          <View style={styles.conteudo}>
            <View style={[styles.topo, telaPequena && { marginBottom: espacoTitulo }]}>
              <View style={[styles.titulos, telaPequena && celular.titulos]}>
                <Text style={[styles.titulo, telaPequena && celular.titulo]}>{titulo}</Text>
                {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                {/* Dentro do bloco do título para acompanhar a largura do texto. Não existe no celular. */}
                {!telaPequena && <View style={styles.divisor} />}
              </View>
              {acao}
            </View>

            {children}
          </View>
        </ScrollView>

        {telaPequena && acaoFlutuante && <View style={celular.flutuante}>{acaoFlutuante}</View>}
      </View>

      {telaPequena && (
        <View style={[styles.rodape, { paddingBottom: insets.bottom }]}>
          <BarraParceiro />
        </View>
      )}
    </View>
  );
}

const ESPACO_DIVISOR = espaco[4];

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  preencher: {
    flex: 1,
  },
  rolagem: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: espaco[8],
    paddingVertical: espaco[12],
  },
  conteudo: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
  },
  topo: {
    marginBottom: espaco[10],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaco[6],
  },
  titulos: {
    flexShrink: 1,
    gap: espaco[2],
  },
  titulo: {
    ...tipografia.h3,
    color: cores.primaria,
  },
  subtitulo: {
    fontFamily: fontes.montserrat.regular,
    fontSize: tamanhoFonte.lg,
    color: cores.textoSuave,
  },
  divisor: {
    height: 2,
    backgroundColor: cores.primaria,
    marginTop: ESPACO_DIVISOR,
  },
  rodape: {
    // Mesma cor do fim do degradê da barra, para preencher a área do gesto de navegação
    backgroundColor: cores.primariaEscura,
  },
});

// Valores das telas da área do parceiro no Figma (393px)
const ESPACO_TITULO_CELULAR = 36;

const celular = StyleSheet.create({
  rolagem: {
    paddingHorizontal: espaco[4],
    paddingTop: 50,
    // No Figma o conteúdo termina 22px acima da barra inferior
    paddingBottom: 22,
  },
  titulos: {
    gap: espaco[4],
  },
  titulo: {
    ...tipografia.h4,
  },
  flutuante: {
    position: 'absolute',
    right: espaco[4],
    bottom: 14,
  },
});
