import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/botoes/Botao';
import { Logo } from '@/components/base/Logo';
import { NavegacaoParceiro, type SecaoParceiro } from '@/components/navegacao/NavegacaoParceiro';
import { cores, espaco, LARGURA_CONTEUDO } from '@/theme';

// Logo horizontal com a altura da barra (40px de conteúdo + 16px de padding em cima e embaixo)
const ALTURA_LOGO = 72;

type Props = {
  mostrarAcoesParceiro?: boolean;
  // Dentro da área do parceiro: mostra a navegação dela, destacando esta seção
  secaoParceiro?: SecaoParceiro;
};

// Barra superior do desktop. No mobile os botões de parceiro ficam no rodapé da tela inicial.
export function Cabecalho({ mostrarAcoesParceiro = false, secaoParceiro }: Props) {
  // Em tablets a barra fica abaixo da barra de status; na web o recuo é 0
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.barra, { paddingTop: top }]}>
      <View style={styles.conteudo}>
        <Link href="/" asChild>
          <Pressable style={styles.marca} accessibilityRole="link" accessibilityLabel="Vaga Livre, início">
            <Logo variante="horizontal" tamanho={ALTURA_LOGO} />
          </Pressable>
        </Link>

        {mostrarAcoesParceiro && <AcoesParceiro style={styles.acoes} />}
        {secaoParceiro && <NavegacaoParceiro ativa={secaoParceiro} />}
      </View>
    </View>
  );
}

// Usado no Cabecalho (em linha) e no rodapé da tela inicial no celular (em coluna)
export function AcoesParceiro({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Botao tipo="secundario" titulo="Área do parceiro" onPress={() => router.push('/login')} />
      <Botao tipo="secundario" titulo="Tornar-se um parceiro" onPress={() => router.push('/tornar-se-parceiro')} />
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: espaco[8],
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    paddingVertical: espaco[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // O componente do Figma tem respiro interno; a margem negativa usa esse respiro como o padding da
  // barra, que mantém a altura que tinha com o placeholder de 40px
  marca: {
    marginVertical: -espaco[4],
  },
  acoes: {
    flexDirection: 'row',
    gap: espaco[3],
  },
});
