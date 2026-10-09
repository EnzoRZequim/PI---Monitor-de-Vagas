import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BotaoIcone } from '@/components/BotaoIcone';
import { Cabecalho } from '@/components/Cabecalho';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, tipografia } from '@/theme';

// Exibida quando a URL aponta para um parceiro ou campus que não existe
export function LocalNaoEncontrado() {
  const telaPequena = useTelaPequena();

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: 'Local não encontrado | Vagas Maua' }} />
      {!telaPequena && <Cabecalho />}
      <View style={styles.conteudo}>
        <Text style={styles.titulo}>Local não encontrado</Text>
        <Text style={styles.texto}>O endereço acessado não corresponde a nenhum local cadastrado.</Text>
        <BotaoIcone titulo="Ver parceiros" icone="arrow-right" onPress={() => router.replace('/parceiros')} />
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
    gap: espaco[4],
    padding: espaco[8],
  },
  titulo: {
    ...tipografia.h4,
    color: cores.primaria,
    // No celular o título e o texto quebram linha
    textAlign: 'center',
  },
  texto: {
    ...tipografia.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
    marginBottom: espaco[2],
  },
});
