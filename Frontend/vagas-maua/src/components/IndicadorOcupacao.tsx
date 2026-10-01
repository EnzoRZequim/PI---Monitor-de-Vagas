import { StyleSheet, Text, View } from 'react-native';

import { fontes } from '@/theme';

const NIVEIS = {
  livre: { fundo: '#4DD67C', borda: '#2E9E55' },
  moderado: { fundo: '#E4DC24', borda: '#A9A214' },
  cheio: { fundo: '#E46B6B', borda: '#B04444' },
};

// Até 50% ocupado: verde; até 80%: amarelo; acima disso: vermelho
function nivel(ocupadas: number, total: number) {
  const taxa = total > 0 ? ocupadas / total : 1;
  if (taxa <= 0.5) return NIVEIS.livre;
  if (taxa <= 0.8) return NIVEIS.moderado;
  return NIVEIS.cheio;
}

export function IndicadorOcupacao({ ocupadas, total }: { ocupadas: number; total: number }) {
  const cor = nivel(ocupadas, total);

  return (
    <View
      style={[styles.pilula, { backgroundColor: cor.fundo, borderColor: cor.borda }]}
      accessibilityLabel={`${ocupadas} de ${total} vagas ocupadas`}
    >
      <Text style={styles.texto}>
        {ocupadas}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pilula: {
    minWidth: 64,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  texto: {
    fontFamily: fontes.medio,
    fontSize: 13,
    color: '#1F1F1F',
  },
});
