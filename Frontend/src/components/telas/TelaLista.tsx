import { Stack, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { Cabecalho } from '@/components/navegacao/Cabecalho';
import { CampoBusca } from '@/components/campos/CampoTexto';
import { ListaRolavel } from '@/components/base/ListaRolavel';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, LARGURA_CONTEUDO, larguras, tipografia } from '@/theme';

// Ignora maiúsculas e acentos na busca ("maua" encontra "Mauá")
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

type Props<T> = {
  titulo: string;
  subtitulo?: string;
  placeholderBusca: string;
  itens: T[];
  chave: (item: T) => string;
  textoBusca: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  // Rota usada pelo "Voltar" quando não há histórico (ex.: a página foi aberta direto pela URL)
  voltarPara: Href;
  colunas?: number;
  // Só no celular: título e subtítulo alinhados à esquerda (tela de blocos do Figma)
  tituloEsquerda?: boolean;
  // Só no celular: lista com altura máxima e barra de rolagem própria (tela de blocos do Figma)
  listaRolavel?: { alturaMaxima: number; espacoItens: number; espacoBarra: number };
};

// Layout compartilhado pelas telas de parceiros, campi e blocos. No celular, `colunas` é ignorado:
// a lista tem uma coluna só.
export function TelaLista<T>({
  titulo,
  subtitulo,
  placeholderBusca,
  itens,
  chave,
  textoBusca,
  renderItem,
  voltarPara,
  colunas = 2,
  tituloEsquerda = false,
  listaRolavel,
}: Props<T>) {
  const [busca, setBusca] = useState('');
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return itens.filter((item) => normalizar(textoBusca(item)).includes(termo));
  }, [busca, itens, textoBusca]);

  const tituloAba = <Stack.Screen options={{ title: `${titulo} | Vaga Livre` }} />;
  const botaoVoltar = <BotaoIcone titulo="Voltar" icone="rotate-ccw" onPress={() => voltar(voltarPara)} />;
  const campoBusca = (
    <CampoBusca
      value={busca}
      onChangeText={setBusca}
      // No celular o Figma termina o placeholder com reticências ("Buscar parceiro...")
      placeholder={telaPequena ? `${placeholderBusca}...` : placeholderBusca}
      accessibilityLabel={placeholderBusca}
      style={!telaPequena && styles.busca}
    />
  );
  const vazio = (
    <Text style={[styles.vazio, telaPequena && celular.vazio]}>{`Nenhum resultado para "${busca}".`}</Text>
  );

  // Celular: título, busca e "Voltar" ficam fixos e só a lista rola entre eles
  if (telaPequena) {
    const itensCelular = filtrados.map((item) => <View key={chave(item)}>{renderItem(item)}</View>);
    const alinhamento = tituloEsquerda && celular.esquerda;

    return (
      <View style={[styles.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {tituloAba}

        <View style={celular.conteudo}>
          <View style={[celular.titulos, alinhamento]}>
            <Text style={[celular.titulo, alinhamento]}>{titulo}</Text>
            {subtitulo && <Text style={[celular.subtitulo, alinhamento]}>{subtitulo}</Text>}
          </View>
          {campoBusca}
          <View style={celular.divisor} />

          {filtrados.length === 0 ? (
            vazio
          ) : listaRolavel ? (
            <ListaRolavel {...listaRolavel}>{itensCelular}</ListaRolavel>
          ) : (
            <ScrollView style={celular.lista} contentContainerStyle={celular.listaConteudo}>
              {itensCelular}
            </ScrollView>
          )}
        </View>

        <View style={celular.rodape}>{botaoVoltar}</View>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      {tituloAba}
      <Cabecalho />

      <ScrollView contentContainerStyle={styles.rolagem}>
        <View style={styles.conteudo}>
          <View style={styles.topo}>
            <View style={styles.tituloBloco}>
              {botaoVoltar}
              <View style={styles.titulos}>
                <Text style={styles.titulo}>{titulo}</Text>
                {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                {/* Dentro do bloco do título para acompanhar a largura do texto */}
                <View style={styles.divisor} />
              </View>
            </View>

            {campoBusca}
          </View>

          {filtrados.length > 0 ? (
            <View style={styles.grade}>
              {filtrados.map((item) => (
                <View key={chave(item)} style={[styles.celula, { width: `${100 / colunas}%` }]}>
                  {renderItem(item)}
                </View>
              ))}
            </View>
          ) : (
            vazio
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const ESPACO_DIVISOR = espaco[4];

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  rolagem: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: espaco[8],
    paddingVertical: espaco[12],
  },
  conteudo: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
  },
  topo: {
    marginBottom: espaco[6],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaco[6],
  },
  tituloBloco: {
    alignItems: 'flex-start',
    gap: espaco[6],
  },
  titulos: {
    gap: espaco[2],
  },
  titulo: {
    ...tipografia.h3,
    color: cores.primaria,
  },
  subtitulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.primaria,
  },
  busca: {
    width: 420,
    maxWidth: '100%',
    // Mantém a busca alinhada ao texto, e não à barra abaixo do título
    marginBottom: ESPACO_DIVISOR + espaco[2] + 2,
  },
  divisor: {
    height: 2,
    backgroundColor: cores.primaria,
    marginTop: ESPACO_DIVISOR,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -espaco[2],
  },
  celula: {
    padding: espaco[2],
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
  },
});

const celular = StyleSheet.create({
  conteudo: {
    flex: 1,
    width: '100%',
    maxWidth: larguras.sm,
    alignSelf: 'center',
    // Centraliza na vertical enquanto a lista couber na tela
    justifyContent: 'center',
    paddingHorizontal: espaco[4],
    paddingTop: espaco[8],
  },
  // Valores das telas de lista do Figma ("Nossos parceiros", "Locais registrados", blocos)
  titulos: {
    alignItems: 'center',
    gap: espaco[4],
    marginBottom: 28,
  },
  titulo: {
    ...tipografia.h4,
    color: cores.primaria,
    textAlign: 'center',
  },
  subtitulo: {
    ...tipografia.pequeno,
    color: cores.primaria,
    textAlign: 'center',
  },
  esquerda: {
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  divisor: {
    alignSelf: 'center',
    width: 150,
    height: 2,
    backgroundColor: cores.primaria,
    marginVertical: 38,
  },
  lista: {
    // Ocupa só a altura dos cartões e encolhe (passando a rolar) quando eles não cabem
    flexGrow: 0,
    flexShrink: 1,
  },
  listaConteudo: {
    gap: espaco[4],
  },
  vazio: {
    textAlign: 'center',
  },
  // No Figma o "Voltar" fica 52px acima da borda de baixo
  rodape: {
    alignItems: 'center',
    paddingTop: espaco[8],
    paddingBottom: 52,
  },
});
