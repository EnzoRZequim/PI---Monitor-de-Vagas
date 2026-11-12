import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { corDaOcupacao, IndicadorOcupacao, taxaDeOcupacao } from '@/components/cartoes/IndicadorOcupacao';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, gradientes, raio, tipografia } from '@/theme';

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
  const telaPequena = useTelaPequena();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <CaixaGradiente
        // O Figma não tem hover para o cartão; usa a mesma borda dos campos em foco
        borda={onPress && hover ? gradientes.foco.borda : gradientes.neutro.borda}
        fundo={cores.superficie}
        raio={raio.cartao}
        estiloConteudo={styles.conteudo}
      >
        <View style={styles.linha}>
          <Text style={styles.nome} numberOfLines={1}>
            {nome}
          </Text>
          <IndicadorOcupacao ocupadas={vagasOcupadas} total={vagasTotais} />
        </View>

        {mostrarBarra && (
          <View
            style={[
              styles.barra,
              telaPequena && styles.barraCelular,
              { width: `${taxa * 100}%`, backgroundColor: corDaOcupacao(vagasOcupadas, vagasTotais).barra },
            ]}
          />
        )}
      </CaixaGradiente>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    gap: espaco[4],
    paddingHorizontal: espaco[4],
    paddingVertical: 14,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco[4],
  },
  nome: {
    ...tipografia.corpo,
    flexShrink: 1,
    color: cores.textoSuave,
  },
  barra: {
    height: 3,
    borderRadius: raio.pilula,
  },
  // No Figma a barra é uma linha de altura 0 com traço de 3px centralizado: não soma altura ao
  // cartão (76px), então ela avança metade do traço para cada lado
  barraCelular: {
    marginVertical: -1.5,
  },
});
