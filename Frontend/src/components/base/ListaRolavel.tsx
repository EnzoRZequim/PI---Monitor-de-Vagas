import { useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { cores, raio } from '@/theme';

type Props = {
  // Altura a partir da qual a lista para de crescer e passa a rolar
  alturaMaxima: number;
  // Distância entre os itens
  espacoItens: number;
  // Distância entre a lista e a barra de rolagem
  espacoBarra: number;
  children: ReactNode;
};

const LARGURA_TRILHO = 4;
const LARGURA_INDICADOR = 6;
// Evita um indicador minúsculo em listas muito longas
const ALTURA_MINIMA_INDICADOR = 24;

// Lista com altura máxima e barra de rolagem própria, como as listas de blocos do Figma.
// A barra só aparece quando os itens não cabem.
export function ListaRolavel({ alturaMaxima, espacoItens, espacoBarra, children }: Props) {
  const [alturaVisivel, setAlturaVisivel] = useState(0);
  const [alturaConteudo, setAlturaConteudo] = useState(0);
  // Criado uma vez só; useState evita ler um ref durante a renderização
  const [deslocamento] = useState(() => new Animated.Value(0));

  const rola = alturaConteudo > alturaVisivel + 1;
  const alturaIndicador = rola
    ? Math.max((alturaVisivel * alturaVisivel) / alturaConteudo, ALTURA_MINIMA_INDICADOR)
    : 0;
  const posicaoIndicador = deslocamento.interpolate({
    inputRange: [0, Math.max(alturaConteudo - alturaVisivel, 1)],
    outputRange: [0, alturaVisivel - alturaIndicador],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.linha, rola && { gap: espacoBarra }]}>
      <Animated.ScrollView
        style={[styles.lista, { maxHeight: alturaMaxima }]}
        contentContainerStyle={{ gap: espacoItens }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        onLayout={(e) => setAlturaVisivel(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, altura) => setAlturaConteudo(altura)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: deslocamento } } }], {
          useNativeDriver: false,
        })}
      >
        {children}
      </Animated.ScrollView>

      {rola && (
        <View style={styles.trilho}>
          <Animated.View
            style={[styles.indicador, { height: alturaIndicador, transform: [{ translateY: posicaoIndicador }] }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
  },
  lista: {
    flex: 1,
  },
  trilho: {
    width: LARGURA_TRILHO,
    borderRadius: raio.pilula,
    backgroundColor: cores.trilhoRolagem,
  },
  // Mais largo que o trilho e centralizado sobre ele
  indicador: {
    position: 'absolute',
    left: (LARGURA_TRILHO - LARGURA_INDICADOR) / 2,
    width: LARGURA_INDICADOR,
    borderRadius: raio.pilula,
    backgroundColor: cores.indicadorRolagem,
  },
});
