import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BotaoContorno } from '@/components/BotaoContorno';
import { Logo } from '@/components/Logo';
import { cores, fontes, LARGURA_CONTEUDO } from '@/theme';

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
            <BotaoContorno titulo="Área do parceiro" />
            <BotaoContorno titulo="Tornar-se um parceiro" />
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
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nome: {
    fontFamily: fontes.titulo,
    fontSize: 20,
    color: cores.primaria,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
  },
});
