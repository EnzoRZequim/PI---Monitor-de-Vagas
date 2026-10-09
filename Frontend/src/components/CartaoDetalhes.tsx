import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { cores, espaco, fontes, gradientes, raio, tipografia } from '@/theme';

type Props = {
  titulo: string;
  // Linha de baixo, separada por "•" (ex.: ['3 Blocos', '40/100 Vagas livres'])
  detalhes: string[];
  // Lado direito: badge, botões de ação etc.
  children?: ReactNode;
  onPress?: () => void;
};

// Cartão com título e detalhes à esquerda ("Locais/homepage" no Figma)
export function CartaoDetalhes({ titulo, detalhes, children, onPress }: Props) {
  const [hover, setHover] = useState(false);

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
        <View style={styles.textos}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          <View style={styles.detalhes}>
            {detalhes.map((detalhe, i) => (
              <View key={i} style={styles.detalhes}>
                {i > 0 && <Text style={styles.detalhe}>•</Text>}
                <Text style={styles.detalhe} numberOfLines={1}>
                  {detalhe}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {children}
      </CaixaGradiente>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco[4],
    paddingHorizontal: espaco[4],
    paddingVertical: 14,
  },
  textos: {
    flex: 1,
    gap: 6,
  },
  titulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
  },
  detalhes: {
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
  },
  detalhe: {
    ...tipografia.pequeno,
    flexShrink: 1,
    color: cores.textoSuave,
  },
});
