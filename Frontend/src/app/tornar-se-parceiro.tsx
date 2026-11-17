import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/botoes/Botao';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { Cabecalho } from '@/components/navegacao/Cabecalho';
import { CampoTexto } from '@/components/campos/CampoTexto';
import { cnpjValido, formatarCnpj, limparCnpj } from '@/cnpj';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, tamanhoFonte, tipografia } from '@/theme';

// No celular o formulário ocupa a largura da tela; em telas maiores fica centralizado com esta largura
const LARGURA_FORMULARIO = 560;

type Campo = 'nome' | 'cnpj' | 'email' | 'senha' | 'numcontato' | 'nomecontato' | 'endereco' | 'cameras';

// Algo@algo.algo, sem espaços: confere só o formato; se o e-mail existe, só a resposta da equipe dirá
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SENHA_MINIMA = 8;

// Telefone com DDD enquanto digita: (11) 1234-5678 (fixo) ou (11) 91234-5678 (celular)
function formatarTelefone(texto: string) {
  const d = texto.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const meio = d.length === 11 ? 7 : 6;
  if (d.length <= meio) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}

// Pedido para virar parceiro ("Tornar-se Parceiro")
export default function TelaTornarSeParceiro() {
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();
  const campoCnpj = useRef<TextInput>(null);
  const campoEmail = useRef<TextInput>(null);
  const campoSenha = useRef<TextInput>(null);
  const campoNomeContato = useRef<TextInput>(null);
  const campoNumContato = useRef<TextInput>(null);
  const campoEndereco = useRef<TextInput>(null);

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [numContato, setNumContato] = useState('');
  const [endereco, setEndereco] = useState('');
  const [possuiCameras, setPossuiCameras] = useState<boolean | null>(null);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [enviado, setEnviado] = useState(false);

  // Apaga o erro do campo assim que ele é alterado
  function limparErro(campo: Campo) {
    setErros(({ [campo]: _, ...resto }) => resto);
  }

  function enviar() {
    const novos: Partial<Record<Campo, string>> = {};
    const digitosTelefone = numContato.replace(/\D/g, '').length;

    if (!nome.trim()) novos.nome = 'Informe o nome do estabelecimento.';
    if (!limparCnpj(cnpj)) novos.cnpj = 'Informe o CNPJ.';
    else if (!cnpjValido(cnpj)) novos.cnpj = 'CNPJ inválido. Confira os números digitados.';
    if (!email.trim()) novos.email = 'Informe um e-mail para contato.';
    else if (!FORMATO_EMAIL.test(email.trim())) novos.email = 'E-mail inválido. Ex: contato@empresa.com.br';
    if (!senha) novos.senha = 'Crie uma senha.';
    else if (senha.length < SENHA_MINIMA) novos.senha = `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`;
    if (!nomeContato.trim()) novos.nomecontato = 'Informe o nome do responsável.';
    if (!digitosTelefone) novos.numcontato = 'Informe um telefone para contato.';
    else if (digitosTelefone < 10) novos.numcontato = 'Telefone incompleto. Inclua o DDD.';
    if (!endereco.trim()) novos.endereco = 'Informe o endereço do estacionamento.';
    if (possuiCameras === null) novos.cameras = 'Informe se há câmeras nas vagas.';

    setErros(novos);
    // Sem envio de verdade até o backend ter uma rota para os pedidos de parceria
    if (Object.keys(novos).length === 0) setEnviado(true);
  }

  const paddingCelular = telaPequena && [
    {
      paddingHorizontal: espaco[4],
      paddingTop: insets.top + ESPACO_BORDA_CELULAR,
      paddingBottom: insets.bottom + ESPACO_BORDA_CELULAR,
    },
    !enviado && celular.rolagemFormulario,
  ];

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: `${enviado ? 'Tudo certo' : 'Tornar-se Parceiro'} | Vaga Livre` }} />
      {!telaPequena && <Cabecalho />}

      {/* Empurra o formulário para cima quando o teclado abre, deixando os botões à vista */}
      <KeyboardAvoidingView behavior="padding" style={styles.preencher}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.rolagem, paddingCelular]}>
          {enviado ? (
            // No desktop tudo fica centralizado, alinhado ao botão "Voltar ao menu". No celular os
            // textos ficam à esquerda e só o botão é centralizado, como no Figma.
            <View style={[styles.formulario, !telaPequena && styles.centro, telaPequena && celular.confirmacao]}>
              <View style={[styles.textos, !telaPequena && styles.centro, telaPequena && celular.textosConfirmacao]}>
                <View style={styles.tituloComIcone}>
                  <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>Tudo certo</Text>
                  <Feather name="check-circle" size={telaPequena ? 36 : 44} color={cores.primaria} />
                </View>
                <Text style={[styles.subtitulo, !telaPequena && styles.textoCentro]}>Dados enviados com sucesso!</Text>
              </View>
              <Text style={[styles.aviso, !telaPequena && styles.textoCentro, telaPequena && celular.aviso]}>
                Em breve nossa equipe retornará com uma resposta!
              </Text>
              <View style={telaPequena && styles.centro}>
                <BotaoIcone titulo="Voltar ao menu" icone="rotate-ccw" onPress={() => router.replace('/')} />
              </View>
            </View>
          ) : (
            <View style={styles.formulario}>
              <View style={[styles.textos, telaPequena && celular.textos]}>
                <Text style={[styles.titulo, telaPequena && styles.tituloCelular]}>Tornar-se Parceiro</Text>
                <Text style={styles.subtitulo}>Seu estacionamento, suas vagas</Text>
              </View>

              <View style={[styles.campos, telaPequena && celular.campos]}>
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
                    onSubmitEditing={() => campoSenha.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="Senha" erro={erros.senha}>
                  <CampoTexto
                    ref={campoSenha}
                    value={senha}
                    onChangeText={(texto) => {
                      setSenha(texto);
                      limparErro('senha');
                    }}
                    placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
                    accessibilityLabel="Senha"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    // Senha nova: o navegador e o celular oferecem para gerar e guardar
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoNomeContato.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="Nome do responsável" erro={erros.nomecontato}>
                  <CampoTexto
                    ref={campoNomeContato}
                    value={nomeContato}
                    onChangeText={(texto) => {
                      setNomeContato(texto);
                      limparErro('nomecontato');
                    }}
                    placeholder="Ex: Maria Silva"
                    accessibilityLabel="Nome do responsável"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoNumContato.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="Telefone para contato" erro={erros.numcontato}>
                  <CampoTexto
                    ref={campoNumContato}
                    value={numContato}
                    onChangeText={(texto) => {
                      setNumContato(formatarTelefone(texto));
                      limparErro('numcontato');
                    }}
                    placeholder="Ex: (11) 91234-5678"
                    accessibilityLabel="Telefone para contato"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={15}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => campoEndereco.current?.focus()}
                  />
                </Pergunta>

                <Pergunta rotulo="Endereço" erro={erros.endereco}>
                  <CampoTexto
                    ref={campoEndereco}
                    value={endereco}
                    onChangeText={(texto) => {
                      setEndereco(texto);
                      limparErro('endereco');
                    }}
                    placeholder="Rua, número, bairro, cidade"
                    accessibilityLabel="Endereço"
                    autoComplete="street-address"
                    textContentType="fullStreetAddress"
                  />
                </Pergunta>

                <Pergunta rotulo="Possui câmeras nas vagas?" erro={erros.cameras} espacoCelular={20}>
                  <View style={[styles.opcoes, telaPequena && celular.opcoes]} accessibilityRole="radiogroup">
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

              <View style={[styles.divisor, telaPequena && celular.separado]} />

              <View style={[styles.botoes, telaPequena && celular.separado]}>
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

type PerguntaProps = {
  rotulo: string;
  erro?: string;
  // Distância do rótulo até o campo no celular (padrão do Figma: 8px)
  espacoCelular?: number;
  children: ReactNode;
};

// Rótulo, campo e o erro dele logo abaixo
function Pergunta({ rotulo, erro, espacoCelular = espaco[2], children }: PerguntaProps) {
  const telaPequena = useTelaPequena();

  return (
    <View style={[styles.pergunta, telaPequena && { gap: espacoCelular }]}>
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

// Valores do Figma ("Tornar-se Parceiro" e "Tudo certo", 393px)
const ESPACO_BORDA_CELULAR = 50;

const celular = StyleSheet.create({
  rolagemFormulario: {
    justifyContent: 'flex-start',
  },
  textos: {
    gap: espaco[4],
    marginBottom: 36,
  },
  campos: {
    gap: 28,
  },
  opcoes: {
    gap: espaco[6],
  },
  separado: {
    marginTop: 36,
  },
  confirmacao: {
    gap: 53,
  },
  textosConfirmacao: {
    gap: 11,
    marginBottom: 0,
  },
  aviso: {
    marginBottom: 0,
  },
});
