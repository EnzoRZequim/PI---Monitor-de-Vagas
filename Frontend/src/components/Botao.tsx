import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { CaixaGradiente, type Cores } from '@/components/CaixaGradiente';
import { useDestaque } from '@/hooks/useDestaque';
import { cores, espaco, fontes, gradientes, raio, tipografia } from '@/theme';

type Tipo = 'primario' | 'secundario';

type Visual = { borda: Cores; fundo: Cores | string; texto: string };

// Variantes Default e Hover do Figma
const VISUAIS: Record<Tipo, { normal: Visual; destaque: Visual }> = {
  primario: {
    normal: { ...gradientes.primario, texto: cores.textoInverso },
    destaque: { ...gradientes.primarioClaro, texto: cores.textoInverso },
  },
  secundario: {
    // Sem fundo no Figma; usa a cor da página (ver CaixaGradiente)
    normal: { borda: gradientes.primario.borda, fundo: cores.fundo, texto: cores.primaria },
    destaque: { ...gradientes.primario, texto: cores.textoInverso },
  },
};

type Props = {
  titulo: string;
  tipo?: Tipo;
  onPress?: () => void;
};

export function Botao({ titulo, tipo = 'primario', onPress }: Props) {
  const { progresso, eventos } = useDestaque();
  const { normal, destaque } = VISUAIS[tipo];

  return (
    <Pressable onPress={onPress} {...eventos} accessibilityRole="button">
      <Camada visual={normal} titulo={titulo} />
      {/* A variante de hover aparece por cima com fade */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: progresso }]}>
        <Camada visual={destaque} titulo={titulo} />
      </Animated.View>
    </Pressable>
  );
}

function Camada({ visual, titulo }: { visual: Visual; titulo: string }) {
  return (
    <CaixaGradiente borda={visual.borda} fundo={visual.fundo} raio={raio.pilula} estiloConteudo={styles.conteudo}>
      <Text style={[styles.titulo, { color: visual.texto }]}>{titulo}</Text>
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    alignItems: 'center',
    paddingHorizontal: espaco[4],
    paddingVertical: espaco[3],
  },
  titulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.seminegrito,
  },
});
