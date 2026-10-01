import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores, fontes } from '@/theme';

type Props = {
  titulo: string;
  icone: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  tamanho?: 'medio' | 'grande';
};

// Botão em pílula com gradiente azul e ícone num círculo branco à direita
export function BotaoPrimario({ titulo, icone, onPress, tamanho = 'medio' }: Props) {
  const [hover, setHover] = useState(false);
  const grande = tamanho === 'grande';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.sombra, (hover || pressed) && styles.ativo, pressed && { opacity: 0.9 }]}
    >
      <LinearGradient
        colors={cores.gradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.botao, grande ? styles.botaoGrande : styles.botaoMedio]}
      >
        <Text style={[styles.titulo, { fontSize: grande ? 20 : 15 }]}>{titulo}</Text>
        <View style={[styles.icone, { width: grande ? 34 : 28, height: grande ? 34 : 28 }]}>
          <Feather name={icone} size={grande ? 18 : 15} color={cores.primaria} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sombra: {
    borderRadius: 999,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.22)',
  },
  ativo: {
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.32)',
    transform: [{ translateY: -1 }],
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: cores.primariaEscura,
  },
  botaoMedio: { paddingLeft: 18, paddingRight: 6, paddingVertical: 6, gap: 12 },
  botaoGrande: { paddingLeft: 28, paddingRight: 8, paddingVertical: 8, gap: 18 },
  titulo: {
    color: '#FFFFFF',
    fontFamily: fontes.seminegrito,
  },
  icone: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
