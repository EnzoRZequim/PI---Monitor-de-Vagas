import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, fontes } from '@/theme';

type Props = {
  titulo: string;
  onPress?: () => void;
};

export function BotaoContorno({ titulo, onPress }: Props) {
  const [hover, setHover] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      style={[styles.botao, hover && styles.hover]}
    >
      <Text style={styles.titulo}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: cores.primaria,
    backgroundColor: cores.superficie,
    paddingHorizontal: 18,
    paddingVertical: 9,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
  },
  hover: {
    backgroundColor: '#EEF3FC',
  },
  titulo: {
    color: cores.primaria,
    fontFamily: fontes.seminegrito,
    fontSize: 14,
  },
});
