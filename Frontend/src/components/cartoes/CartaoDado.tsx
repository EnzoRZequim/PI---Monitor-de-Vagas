import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, fontes, gradientes, raio, tipografia } from '@/theme';

type Props = {
  titulo: string;
  valor: string;
  // Linha cinza abaixo do valor; sem ela o cartão mostra só título e valor
  legenda?: string;
  // Caixa externa (ex.: largura flexível no desktop)
  style?: StyleProp<ViewStyle>;
};

// Cartão de número do painel do parceiro ("Dashboard" no Figma)
export function CartaoDado({ titulo, valor, legenda, style }: Props) {
  const telaPequena = useTelaPequena();

  return (
    <CaixaGradiente
      borda={gradientes.destaque.borda}
      fundo={cores.superficie}
      raio={raio.cartao}
      style={[styles.cartao, telaPequena && styles.cartaoCelular, style]}
      estiloConteudo={styles.conteudo}
    >
      {/* No celular o título quebra em até duas linhas, como no Figma */}
      <Text style={[styles.negrito, { color: cores.primariaClara }]} numberOfLines={telaPequena ? 2 : 1}>
        {titulo}
      </Text>
      <Text style={[styles.negrito, { color: cores.textoSecundario }]} numberOfLines={1}>
        {valor}
      </Text>
      {legenda && (
        <Text style={styles.legenda} numberOfLines={1}>
          {legenda}
        </Text>
      )}
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  cartao: {
    width: 145,
  },
  cartaoCelular: {
    minHeight: 118,
  },
  conteudo: {
    // Preenche a caixa quando a linha estica o cartão (ex.: vizinho com legenda e este sem); sem
    // isso o degradê da borda aparece embaixo
    flexGrow: 1,
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
