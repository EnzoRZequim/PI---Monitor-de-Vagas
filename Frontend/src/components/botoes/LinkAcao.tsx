import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, fontes, tipografia } from '@/theme';

// Ação em texto ao lado de um título de seção (ex.: "+ adicionar local")
export function LinkAcao({ titulo, onPress }: { titulo: string; onPress: () => void }) {
  const [hover, setHover] = useState(false);
  const telaPequena = useTelaPequena();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={[styles.titulo, telaPequena && styles.tituloCelular, hover && styles.hover]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
  },
  // Peso das telas de celular do Figma
  tituloCelular: {
    fontFamily: fontes.inter.medio,
  },
  hover: {
    textDecorationLine: 'underline',
  },
});
