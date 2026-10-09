import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/Botao';
import { Logo } from '@/components/Logo';
import { cores, espaco, LARGURA_CONTEUDO, tipografia } from '@/theme';

// Barra superior do desktop. No mobile os botões de parceiro ficam no rodapé da tela inicial.
export function Cabecalho({ mostrarAcoesParceiro = false }: { mostrarAcoesParceiro?: boolean }) {
  // Em tablets a barra fica abaixo da barra de status; na web o recuo é 0
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.barra, { paddingTop: top }]}>
      <View style={styles.conteudo}>
        <Link href="/" asChild>
          <Pressable style={styles.marca} accessibilityRole="link">
            <Logo tamanho={40} />
            <Text style={styles.nome}>Vagas Maua</Text>
          </Pressable>
        </Link>

        {mostrarAcoesParceiro && <AcoesParceiro style={styles.acoes} />}
      </View>
    </View>
  );
}

// Usado no Cabecalho (em linha) e no rodapé da tela inicial no celular (em coluna)
export function AcoesParceiro({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Botao tipo="secundario" titulo="Área do parceiro" onPress={() => router.push('/login')} />
      <Botao tipo="secundario" titulo="Tornar-se um parceiro" />
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
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
  },
  nome: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  acoes: {
    flexDirection: 'row',
    gap: espaco[3],
  },
});
