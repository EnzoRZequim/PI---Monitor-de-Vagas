import { StyleSheet, Text, View } from 'react-native';

import { cores, espaco, fontes, mapa, tipografia } from '@/theme';

type Props = {
  livres: number;
  ocupadas: number;
  preferenciaisLivres: number;
};

// Legenda do mapa, com a contagem de cada tipo de vaga (a cor sozinha não basta para daltônicos:
// a ocupada tem carro e a preferencial tem o símbolo de acesso no mapa)
export function LegendaMapa({ livres, ocupadas, preferenciaisLivres }: Props) {
  return (
    <View style={styles.legenda}>
      <Item cor={mapa.livre} rotulo="Livre" valor={`${livres}`} />
      <Item cor={mapa.ocupada} rotulo="Ocupada" valor={`${ocupadas}`} />
      <Item cor={mapa.preferencial} rotulo="Preferencial" valor={`${preferenciaisLivres} livres`} />
    </View>
  );
}

function Item({ cor, rotulo, valor }: { cor: string; rotulo: string; valor: string }) {
  return (
    <View style={styles.item} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      {/* Mesmo visual das vagas: preenchimento a 50% e contorno sólido */}
      <View style={[styles.amostra, { borderColor: cor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cor, opacity: mapa.opacidadePreenchimento }]} />
      </View>
      <Text style={styles.rotulo}>
        {rotulo} <Text style={styles.valor}>{valor}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: espaco[4],
    rowGap: espaco[2],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[2],
  },
  amostra: {
    width: 20,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rotulo: {
    ...tipografia.pequeno,
    color: cores.textoSuave,
  },
  valor: {
    fontFamily: fontes.inter.seminegrito,
    color: cores.texto,
  },
});
