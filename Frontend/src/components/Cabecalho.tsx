import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Logo } from '@/components/Logo';
import { cores, espaco, LARGURA_CONTEUDO, tipografia } from '@/theme';

// Barra superior do desktop. No mobile os botões de parceiro ficam no rodapé da tela inicial.
export function Cabecalho({ mostrarAcoesParceiro = false }: { mostrarAcoesParceiro?: boolean }) {
  return (
    <View style={styles.barra}>
      <View style={styles.conteudo}>
        <Link href="/" asChild>
          <Pressable style={styles.marca} accessibilityRole="link">
            <Logo tamanho={40} />
            <Text style={styles.nome}>Vagas Maua</Text>
          </Pressable>
        </Link>

        {mostrarAcoesParceiro && (
          <View style={styles.acoes}>
            <Botao tipo="secundario" titulo="Área do parceiro" />
            <Botao tipo="secundario" titulo="Tornar-se um parceiro" />
          </View>
        )}
      </View>
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
