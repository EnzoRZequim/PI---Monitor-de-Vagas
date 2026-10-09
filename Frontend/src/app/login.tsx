import { Stack } from 'expo-router';
import { useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoIcone } from '@/components/BotaoIcone';
import { Cabecalho } from '@/components/Cabecalho';
import { CampoTexto } from '@/components/CampoTexto';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, tamanhoFonte, tipografia } from '@/theme';

// No celular o formulário ocupa a largura da tela; em telas maiores fica centralizado com esta largura
const LARGURA_FORMULARIO = 480;

// Login da área do parceiro ("Área do parceiro" no Figma)
export default function TelaLogin() {
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();
  const campoSenha = useRef<TextInput>(null);

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: 'Área do parceiro | Vagas Maua' }} />
      {!telaPequena && <Cabecalho />}

      {/* Empurra o formulário para cima quando o teclado abre, deixando os botões à vista */}
      <KeyboardAvoidingView behavior="padding" style={styles.preencher}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.rolagem,
            telaPequena && {
              paddingHorizontal: espaco[4],
              paddingTop: insets.top + espaco[8],
              paddingBottom: insets.bottom + espaco[8],
            },
          ]}
        >
          <View style={styles.formulario}>
            <View style={styles.textos}>
              <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>Área do parceiro</Text>
              <Text style={styles.subtitulo}>Seu estacionamento, suas vagas.</Text>
            </View>

            <View style={styles.campos}>
              <CampoTexto
                placeholder="Login..."
                accessibilityLabel="Login"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                // Vai para a senha sem fechar o teclado
                submitBehavior="submit"
                onSubmitEditing={() => campoSenha.current?.focus()}
              />
              <CampoTexto
                ref={campoSenha}
                placeholder="Senha..."
                accessibilityLabel="Senha"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="send"
              />
            </View>

            {/* Sem ação até o backend ter recuperação de senha */}
            <Text style={styles.esqueciSenha}>Esqueci a senha</Text>

            <View style={styles.botoes}>
              <BotaoIcone tipo="secundario" titulo="Voltar" icone="rotate-ccw" onPress={() => voltar('/')} />
              {/* Sem ação até o backend ter autenticação */}
              <BotaoIcone titulo="Enviar" icone="send" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  preencher: {
    flex: 1,
  },
  rolagem: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: espaco[8],
    paddingVertical: espaco[12],
  },
  formulario: {
    width: '100%',
    maxWidth: LARGURA_FORMULARIO,
    alignSelf: 'center',
  },
  textos: {
    gap: espaco[3],
    marginBottom: espaco[12],
  },
  titulo: {
    ...tipografia.h3,
    color: cores.primaria,
  },
  tituloCelular: {
    ...tipografia.h4,
  },
  subtitulo: {
    fontFamily: fontes.montserrat.regular,
    fontSize: tamanhoFonte.lg,
    color: cores.textoSuave,
  },
  campos: {
    gap: espaco[5],
  },
  esqueciSenha: {
    ...tipografia.pequeno,
    alignSelf: 'center',
    marginTop: espaco[3],
    color: cores.secundaria,
    textDecorationLine: 'underline',
  },
  botoes: {
    marginTop: espaco[10],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
