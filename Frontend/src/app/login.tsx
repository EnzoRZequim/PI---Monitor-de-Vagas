import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { Cabecalho } from '@/components/navegacao/Cabecalho';
import { CampoTexto } from '@/components/campos/CampoTexto';
import { entrar } from '@/dados/autenticacao';
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
  const enviando = useRef(false);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar() {
    if (enviando.current) return;
    if (!usuario.trim() || !senha) {
      setErro('Informe o login e a senha.');
      return;
    }

    enviando.current = true;
    setOcupado(true);
    setErro('');
    try {
      await entrar(usuario.trim(), senha);
      setSenha('');
      router.replace('/area-parceiro');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível entrar.');
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: 'Área do parceiro | Vaga Livre' }} />
      {!telaPequena && <Cabecalho />}

      {/* Empurra o formulário para cima quando o teclado abre, deixando os botões à vista */}
      <KeyboardAvoidingView behavior="padding" style={styles.preencher}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.rolagem,
            telaPequena && {
              paddingHorizontal: espaco[4],
              // Figma: 16px em volta do conteúdo centralizado
              paddingTop: insets.top + espaco[4],
              paddingBottom: insets.bottom + espaco[4],
            },
          ]}
        >
          <View style={styles.formulario}>
            <View style={[styles.textos, telaPequena && celular.textos]}>
              <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>Área do parceiro</Text>
              <Text style={styles.subtitulo}>Seu estacionamento, suas vagas.</Text>
            </View>

            <View style={[styles.campos, telaPequena && celular.campos]}>
              <CampoTexto
                placeholder="Login..."
                accessibilityLabel="Login"
                value={usuario}
                onChangeText={setUsuario}
                editable={!ocupado}
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
                value={senha}
                onChangeText={setSenha}
                editable={!ocupado}
                onSubmitEditing={enviar}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="send"
              />
            </View>

            {erro ? <Text accessibilityRole="alert" style={styles.erro}>{erro}</Text> : null}

            {/* Sem ação até o backend ter recuperação de senha */}
            <Text style={[styles.esqueciSenha, telaPequena && celular.esqueciSenha]}>Esqueci a senha</Text>

            <View style={[styles.botoes, telaPequena && celular.botoes]}>
              <BotaoIcone tipo="secundario" titulo="Voltar" icone="rotate-ccw" onPress={() => voltar('/')} />
              <BotaoIcone titulo={ocupado ? "Enviando..." : "Enviar"} icone="send" onPress={enviar} />
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
  erro: {
    ...tipografia.pequeno,
    color: cores.perigo,
    marginTop: espaco[3],
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

// Valores do Figma ("Área do parceiro", 393px)
const celular = StyleSheet.create({
  textos: {
    gap: espaco[4],
  },
  campos: {
    gap: espaco[4],
  },
  esqueciSenha: {
    marginTop: 10,
  },
  botoes: {
    marginTop: 42,
  },
});
