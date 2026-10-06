import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { Cabecalho } from '@/components/Cabecalho';
import { cores, fontes } from '@/theme';

// Exibida quando a URL aponta para um parceiro ou campus que não existe
export function LocalNaoEncontrado() {
  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: 'Local não encontrado | Vagas Maua' }} />
      <Cabecalho />
      <View style={styles.conteudo}>
        <Text style={styles.titulo}>Local não encontrado</Text>
        <Text style={styles.texto}>O endereço acessado não corresponde a nenhum local cadastrado.</Text>
        <BotaoPrimario titulo="Ver parceiros" icone="arrow-right" onPress={() => router.replace('/parceiros')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 36,
    color: cores.primaria,
  },
  texto: {
    fontFamily: fontes.regular,
    fontSize: 16,
    color: cores.textoSuave,
    marginBottom: 8,
  },
});
