import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

export type Cores = readonly [ColorValue, ColorValue, ...ColorValue[]];

type Props = {
  borda: Cores;
  // Degradê ou cor sólida. Nunca transparente: a borda é um degradê desenhado por baixo do fundo,
  // então para simular "sem fundo" use a cor do que está atrás (ex.: cores.fundo).
  fundo: Cores | ColorValue;
  raio: number;
  espessura?: number;
  // Caixa externa (tamanho e posição no pai)
  style?: StyleProp<ViewStyle>;
  // Área interna (padding e layout dos filhos)
  estiloConteudo?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// React Native não tem borda em degradê: o degradê da borda preenche a caixa e o fundo é desenhado
// por cima, recuado pela espessura.
export function CaixaGradiente({ borda, fundo, raio, espessura = 3, style, estiloConteudo, children }: Props) {
  const miolo = [{ borderRadius: Math.max(raio - espessura, 0) }, estiloConteudo];

  return (
    <LinearGradient colors={borda} style={[{ borderRadius: raio, padding: espessura }, style]}>
      {Array.isArray(fundo) ? (
        <LinearGradient colors={fundo as Cores} style={miolo}>
          {children}
        </LinearGradient>
      ) : (
        <View style={[{ backgroundColor: fundo as ColorValue }, miolo]}>{children}</View>
      )}
    </LinearGradient>
  );
}
