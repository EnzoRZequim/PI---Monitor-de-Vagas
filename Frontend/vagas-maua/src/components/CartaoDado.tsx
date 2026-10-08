import { StyleSheet, Text } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { cores, espaco, fontes, gradientes, raio, tipografia } from '@/theme';

type Props = {
  titulo: string;
  valor: string;
  legenda: string;
};

// Cartão de número do painel do parceiro ("Dashboard" no Figma)
export function CartaoDado({ titulo, valor, legenda }: Props) {
  return (
    <CaixaGradiente
      borda={gradientes.destaque.borda}
      fundo={cores.superficie}
      raio={raio.cartao}
      style={styles.cartao}
      estiloConteudo={styles.conteudo}
    >
      <Text style={[styles.negrito, { color: cores.primariaClara }]} numberOfLines={1}>
        {titulo}
      </Text>
      <Text style={[styles.negrito, { color: cores.textoSecundario }]} numberOfLines={1}>
        {valor}
      </Text>
      <Text style={styles.legenda} numberOfLines={1}>
        {legenda}
      </Text>
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  cartao: {
    width: 145,
  },
  conteudo: {
    gap: 10,
    paddingHorizontal: espaco[4],
    paddingVertical: 18,
  },
  negrito: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.negrito,
  },
  legenda: {
    ...tipografia.pequeno,
    color: cores.textoSuave,
  },
});
