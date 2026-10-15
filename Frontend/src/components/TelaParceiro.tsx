import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cabecalho } from '@/components/Cabecalho';
import { BarraParceiro, type SecaoParceiro } from '@/components/NavegacaoParceiro';
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
  children: ReactNode;
};

// Layout compartilhado pelas telas da área do parceiro: navegação no Cabecalho no desktop e na
// barra inferior no celular
export function TelaParceiro({ secao, tituloAba, titulo, subtitulo, acao, children }: Props) {
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: `${tituloAba} | Vagas Maua` }} />
      {!telaPequena && <Cabecalho secaoParceiro={secao} />}

      <ScrollView
        contentContainerStyle={[
          styles.rolagem,
          telaPequena && { paddingHorizontal: espaco[4], paddingTop: insets.top + espaco[8] },
        ]}
      >
        <View style={styles.conteudo}>
          <View style={styles.topo}>
            <View style={styles.titulos}>
              <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>{titulo}</Text>
              {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
              {/* Dentro do bloco do título para acompanhar a largura do texto */}
              <View style={styles.divisor} />
            </View>
            {acao}
          </View>

          {children}
        </View>
      </ScrollView>

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
  tituloCelular: {
    ...tipografia.h4,
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
