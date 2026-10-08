import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, espaco, fontes, gradientes, tipografia } from '@/theme';

type Item = {
  titulo: string;
  icone: keyof typeof Feather.glyphMap;
  onPress: () => void;
  // Ação destrutiva, como "Sair" (fica vermelha)
  perigo?: boolean;
};

// Navbar da área do parceiro
export function BarraNavegacao({ itens }: { itens: Item[] }) {
  return (
    <LinearGradient colors={gradientes.navegacao.fundo} style={styles.barra}>
      {itens.map((item) => {
        const cor = item.perigo ? cores.perigoSuave : cores.textoInverso;
        return (
          <Pressable
            key={item.titulo}
            onPress={item.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.item, pressed && styles.pressionado]}
          >
            <Feather name={item.icone} size={30} color={cor} />
            <Text style={[styles.titulo, { color: cor }]}>{item.titulo}</Text>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    minWidth: 240,
    padding: espaco[2],
  },
  item: {
    minWidth: 40,
    alignItems: 'center',
    gap: espaco[2],
  },
  pressionado: {
    opacity: 0.7,
  },
  titulo: {
    ...tipografia.pequeno,
    fontFamily: fontes.inter.seminegrito,
    textAlign: 'center',
  },
});
