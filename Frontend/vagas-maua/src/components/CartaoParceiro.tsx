import { StyleSheet, Text, View } from 'react-native';

import { IndicadorOcupacao } from '@/components/IndicadorOcupacao';
import type { Parceiro } from '@/data/parceiros';
import { cores, fontes } from '@/theme';

export function CartaoParceiro({ parceiro }: { parceiro: Parceiro }) {
  return (
    <View style={styles.cartao}>
      <Text style={styles.nome} numberOfLines={1}>
        {parceiro.nome}
      </Text>
      <IndicadorOcupacao ocupadas={parceiro.vagasOcupadas} total={parceiro.vagasTotais} />
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: cores.superficie,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 22,
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12)',
  },
  nome: {
    flexShrink: 1,
    fontFamily: fontes.regular,
    fontSize: 17,
    color: '#6F6F6F',
  },
});
