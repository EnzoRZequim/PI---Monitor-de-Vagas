import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/Botao';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Cabecalho } from '@/components/Cabecalho';
import { CampoTexto } from '@/components/CampoTexto';
import { cnpjValido, formatarCnpj, limparCnpj } from '@/cnpj';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, tamanhoFonte, tipografia } from '@/theme';

// No celular o formulário ocupa a largura da tela; em telas maiores fica centralizado com esta largura
const LARGURA_FORMULARIO = 560;

type Campo = 'nome' | 'cnpj' | 'email' | 'estabelecimentos' | 'cameras';

// Algo@algo.algo, sem espaços: confere só o formato; se o e-mail existe, só a resposta da equipe dirá
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pedido para virar parceiro ("Tornar-se Parceiro" e "Tudo certo" no Figma)
export default function TelaTornarSeParceiro() {
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();
  const campoCnpj = useRef<TextInput>(null);
  const campoEmail = useRef<TextInput>(null);
  const campoEstabelecimentos = useRef<TextInput>(null);

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [estabelecimentos, setEstabelecimentos] = useState('');
  const [possuiCameras, setPossuiCameras] = useState<boolean | null>(null);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [enviado, setEnviado] = useState(false);

  // Apaga o erro do campo assim que ele é alterado
  function limparErro(campo: Campo) {
    setErros(({ [campo]: _, ...resto }) => resto);
  }

  function enviar() {
    const novos: Partial<Record<Campo, string>> = {};
    const quantidade = Number(estabelecimentos);

    if (!nome.trim()) novos.nome = 'Informe o nome do estabelecimento.';
    if (!limparCnpj(cnpj)) novos.cnpj = 'Informe o CNPJ.';
    else if (!cnpjValido(cnpj)) novos.cnpj = 'CNPJ inválido. Confira os números digitados.';
    if (!email.trim()) novos.email = 'Informe um e-mail para contato.';
    else if (!FORMATO_EMAIL.test(email.trim())) novos.email = 'E-mail inválido. Ex: contato@empresa.com.br';
    if (!estabelecimentos) novos.estabelecimentos = 'Informe a quantidade de estabelecimentos.';
    else if (!Number.isInteger(quantidade) || quantidade < 1) novos.estabelecimentos = 'Informe ao menos 1 estabelecimento.';
    if (possuiCameras === null) novos.cameras = 'Informe se há câmeras nas vagas.';

    setErros(novos);
    // Sem envio de verdade até o backend ter uma rota para os pedidos de parceria
    if (Object.keys(novos).length === 0) setEnviado(true);
  }

  const paddingCelular = telaPequena && {
    paddingHorizontal: espaco[4],
    paddingTop: insets.top + espaco[8],
    paddingBottom: insets.bottom + espaco[8],
  };

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: `${enviado ? 'Tudo certo' : 'Tornar-se Parceiro'} | Vagas Maua` }} />
      {!telaPequena && <Cabecalho />}

      {/* Empurra o formulário para cima quando o teclado abre, deixando os botões à vista */}
      <KeyboardAvoidingView behavior="padding" style={styles.preencher}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.rolagem, paddingCelular]}>
          {enviado ? (
            // Na confirmação tudo fica centralizado, alinhado ao botão "Voltar ao menu"
            <View style={[styles.formulario, styles.centro]}>
              <View style={[styles.textos, styles.centro]}>
                <View style={styles.tituloComIcone}>
                  <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>Tudo certo</Text>
                  <Feather name="check-circle" size={telaPequena ? 32 : 44} color={cores.primaria} />
                </View>
                <Text style={[styles.subtitulo, styles.textoCentro]}>Dados enviados com sucesso!</Text>
              </View>
              <Text style={[styles.aviso, styles.textoCentro]}>Em breve nossa equipe retornará com uma resposta!</Text>
              <View>
                <BotaoIcone titulo="Voltar ao menu" icone="rotate-ccw" onPress={() => router.replace('/')} />
              </View>
            </View>
          ) : (
            <View style={styles.formulario}>
              <View style={styles.textos}>
                <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>Tornar-se Parceiro</Text>
                <Text style={styles.subtitulo}>Seu estacionamento, suas vagas</Text>
              </View>

              <View style={styles.campos}>
                <Pergunta rotulo="Nome" erro={erros.nome}>
                  <CampoTexto
                    value={nome}
                    onChangeText={(texto) => {
                      setNome(texto);
                      limparErro('nome');
                    }}
                    placeholder="Ex: FMABC"
                    accessibilityLabel="Nome"
                    autoComplete="organization"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoCnpj.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="CNPJ" erro={erros.cnpj}>
                  <CampoTexto
                    ref={campoCnpj}
                    value={cnpj}
                    onChangeText={(texto) => {
                      setCnpj(formatarCnpj(texto));
                      limparErro('cnpj');
                    }}
                    placeholder="Ex: 00.000.000/0001-00"
                    accessibilityLabel="CNPJ"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={18}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoEmail.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="E-mail para contato" erro={erros.email}>
                  <CampoTexto
                    ref={campoEmail}
                    value={email}
                    onChangeText={(texto) => {
                      setEmail(texto);
                      limparErro('email');
                    }}
                    placeholder="Ex: contato@empresa.com.br"
                    accessibilityLabel="E-mail para contato"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoEstabelecimentos.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="Quantidade de estabelecimentos" erro={erros.estabelecimentos}>
                  <CampoTexto
                    ref={campoEstabelecimentos}
                    value={estabelecimentos}
                    onChangeText={(texto) => {
                      setEstabelecimentos(texto.replace(/\D/g, ''));
                      limparErro('estabelecimentos');
                    }}
                    placeholder="Ex: 2"
                    accessibilityLabel="Quantidade de estabelecimentos"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </Pergunta>

                <Pergunta rotulo="Possui câmeras nas vagas?" erro={erros.cameras}>
                  <View style={styles.opcoes} accessibilityRole="radiogroup">
                    {[
                      { titulo: 'Não', valor: false },
                      { titulo: 'Sim', valor: true },
                    ].map((opcao) => (
                      <Botao
                        key={opcao.titulo}
                        tipo="secundario"
                        titulo={opcao.titulo}
                        selecionado={possuiCameras === opcao.valor}
                        onPress={() => {
                          setPossuiCameras(opcao.valor);
                          limparErro('cameras');
                        }}
                      />
                    ))}
                  </View>
                </Pergunta>
              </View>

              <View style={styles.divisor} />

              <View style={styles.botoes}>
                <BotaoIcone tipo="secundario" titulo="Voltar" icone="rotate-ccw" onPress={() => voltar('/')} />
                <BotaoIcone titulo="Enviar" icone="send" onPress={enviar} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Rótulo, campo e o erro dele logo abaixo
function Pergunta({ rotulo, erro, children }: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <View style={styles.pergunta}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      {children}
      {erro && (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      )}
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
    marginBottom: espaco[10],
  },
  titulo: {
    ...tipografia.h3,
    color: cores.primaria,
  },
  tituloCelular: {
    ...tipografia.h4,
  },
  tituloComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[4],
  },
  subtitulo: {
    fontFamily: fontes.montserrat.regular,
    fontSize: tamanhoFonte.lg,
    color: cores.textoSuave,
  },
  campos: {
    gap: espaco[6],
  },
  pergunta: {
    gap: espaco[3],
  },
  rotulo: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  erro: {
    ...tipografia.pequeno,
    fontFamily: fontes.inter.medio,
    color: cores.perigo,
  },
  opcoes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: espaco[4],
  },
  divisor: {
    alignSelf: 'center',
    width: 150,
    height: 2,
    backgroundColor: cores.primaria,
    marginTop: espaco[8],
  },
  botoes: {
    marginTop: espaco[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aviso: {
    ...tipografia.corpo,
    color: cores.primaria,
    marginBottom: espaco[10],
  },
  centro: {
    alignItems: 'center',
  },
  // Para textos que quebram linha (ex.: no celular)
  textoCentro: {
    textAlign: 'center',
  },
});
