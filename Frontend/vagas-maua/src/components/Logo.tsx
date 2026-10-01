import { StyleSheet, Text, View } from 'react-native';

import { cores, fontes } from '@/theme';

// Placeholder até a equipe definir a logo oficial
export function Logo({ tamanho = 80 }: { tamanho?: number }) {
  return (
    <View style={[styles.circulo, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
      <Text style={[styles.texto, { fontSize: tamanho * 0.28 }]}>LOGO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    backgroundColor: cores.logo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: '#FFFFFF',
    fontFamily: fontes.regular,
  },
});
