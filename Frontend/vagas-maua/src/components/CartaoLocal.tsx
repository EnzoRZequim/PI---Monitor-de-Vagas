import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { corDaOcupacao, IndicadorOcupacao, taxaDeOcupacao } from '@/components/IndicadorOcupacao';
import { cores, fontes } from '@/theme';

type Props = {
  nome: string;
  vagasOcupadas: number;
  vagasTotais: number;
  // Barra colorida abaixo do nome, proporcional à ocupação (usada nos blocos)
  mostrarBarra?: boolean;
  onPress?: () => void;
};

// Cartão usado nas listas de parceiros, campi e blocos
export function CartaoLocal({ nome, vagasOcupadas, vagasTotais, mostrarBarra = false, onPress }: Props) {
  const [hover, setHover] = useState(false);
  const taxa = taxaDeOcupacao(vagasOcupadas, vagasTotais);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[styles.cartao, onPress && hover && styles.hover]}
    >
      <View style={styles.linha}>
        <Text style={styles.nome} numberOfLines={1}>
          {nome}
        </Text>
        <IndicadorOcupacao ocupadas={vagasOcupadas} total={vagasTotais} />
      </View>

      {mostrarBarra && (
        <View style={styles.barraTrilho}>
          <View
            style={[
              styles.barra,
              {
                width: `${taxa * 100}%`,
                backgroundColor: corDaOcupacao(vagasOcupadas, vagasTotais).fundo,
              },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    gap: 14,
    backgroundColor: cores.superficie,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 22,
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12)',
  },
  hover: {
    borderColor: cores.primaria,
    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.16)',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  nome: {
    flexShrink: 1,
    fontFamily: fontes.regular,
    fontSize: 17,
    color: '#6F6F6F',
  },
  barraTrilho: {
    height: 3,
    borderRadius: 999,
  },
  barra: {
    height: 3,
    borderRadius: 999,
  },
});
