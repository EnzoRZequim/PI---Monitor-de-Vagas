import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

import { animacao } from '@/theme';

// Anima de 0 a 1 enquanto o ponteiro está sobre o elemento (web) ou ele está pressionado (toque).
// Espalhe `eventos` no Pressable e use `progresso` em opacity/interpolate.
export function useDestaque() {
  const progresso = useRef(new Animated.Value(0)).current;
  const estado = useRef({ hover: false, pressionado: false }).current;

  const atualizar = (mudanca: Partial<typeof estado>) => {
    Object.assign(estado, mudanca);
    Animated.timing(progresso, {
      toValue: estado.hover || estado.pressionado ? 1 : 0,
      duration: animacao.duracao,
      easing: Easing.out(Easing.quad),
      // Largura e cores não rodam no driver nativo
      useNativeDriver: false,
    }).start();
  };

  return {
    progresso,
    eventos: {
      onHoverIn: () => atualizar({ hover: true }),
      onHoverOut: () => atualizar({ hover: false }),
      onPressIn: () => atualizar({ pressionado: true }),
      onPressOut: () => atualizar({ pressionado: false }),
    },
  };
}
