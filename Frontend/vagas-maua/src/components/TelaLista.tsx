import { Feather } from '@expo/vector-icons';
import { router, Stack, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { Cabecalho } from '@/components/Cabecalho';
import { cores, fontes, LARGURA_CONTEUDO } from '@/theme';

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
  const [buscaEmFoco, setBuscaEmFoco] = useState(false);

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
              <BotaoPrimario titulo="Voltar" icone="rotate-ccw" onPress={voltar} />
              <View style={styles.titulos}>
                <Text style={styles.titulo}>{titulo}</Text>
                {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                {/* Dentro do bloco do título para acompanhar a largura do texto */}
                <View style={styles.divisor} />
              </View>
            </View>

            <View style={[styles.busca, buscaEmFoco && styles.buscaFoco]}>
              <TextInput
                value={busca}
                onChangeText={setBusca}
                onFocus={() => setBuscaEmFoco(true)}
                onBlur={() => setBuscaEmFoco(false)}
                placeholder={placeholderBusca}
                placeholderTextColor={cores.textoSuave}
                style={styles.buscaCampo}
                accessibilityLabel={placeholderBusca.replace('...', '')}
              />
              <Feather name="search" size={20} color={cores.textoSuave} />
            </View>
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

const ESPACO_DIVISOR = 18;

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  rolagem: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  conteudo: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
  },
  topo: {
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
  },
  tituloBloco: {
    alignItems: 'flex-start',
    gap: 24,
  },
  titulos: {
    gap: 6,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 48,
    color: cores.primaria,
  },
  subtitulo: {
    fontFamily: fontes.medio,
    fontSize: 16,
    color: cores.primaria,
  },
  busca: {
    width: 420,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 4,
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12)',
    // Mantém a busca alinhada ao texto, e não à barra abaixo do título
    marginBottom: ESPACO_DIVISOR + 6 + 2,
  },
  buscaFoco: {
    borderColor: cores.primaria,
  },
  buscaCampo: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fontes.regular,
    fontSize: 16,
    color: cores.texto,
    // Remove o contorno de foco padrão do navegador; o foco é indicado pela borda azul da pílula
    outlineWidth: 0,
  },
  divisor: {
    height: 2,
    backgroundColor: cores.primaria,
    marginTop: ESPACO_DIVISOR,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -10,
  },
  celula: {
    padding: 10,
  },
  vazio: {
    fontFamily: fontes.regular,
    fontSize: 16,
    color: cores.textoSuave,
  },
});
