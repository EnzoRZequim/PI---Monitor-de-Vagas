import { router, Stack, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotaoIcone } from '@/components/BotaoIcone';
import { Cabecalho } from '@/components/Cabecalho';
import { CampoBusca } from '@/components/CampoTexto';
import { cores, espaco, fontes, LARGURA_CONTEUDO, tipografia } from '@/theme';

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
};

// Layout desktop compartilhado pelas telas de parceiros, campi e blocos
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
}: Props<T>) {
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return itens.filter((item) => normalizar(textoBusca(item)).includes(termo));
  }, [busca, itens, textoBusca]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace(voltarPara));

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: `${titulo} | Vagas Maua` }} />
      <Cabecalho />

      <ScrollView contentContainerStyle={styles.rolagem}>
        <View style={styles.conteudo}>
          <View style={styles.topo}>
            <View style={styles.tituloBloco}>
              <BotaoIcone titulo="Voltar" icone="rotate-ccw" onPress={voltar} />
              <View style={styles.titulos}>
                <Text style={styles.titulo}>{titulo}</Text>
                {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                {/* Dentro do bloco do título para acompanhar a largura do texto */}
                <View style={styles.divisor} />
              </View>
            </View>

            <CampoBusca
              value={busca}
              onChangeText={setBusca}
              placeholder={placeholderBusca}
              accessibilityLabel={placeholderBusca}
              style={styles.busca}
            />
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
            <Text style={styles.vazio}>Nenhum resultado para "{busca}".</Text>
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
