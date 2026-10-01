import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { Cabecalho } from '@/components/Cabecalho';
import { CartaoParceiro } from '@/components/CartaoParceiro';
import { parceiros } from '@/data/parceiros';
import { cores, fontes, LARGURA_CONTEUDO } from '@/theme';

// Ignora maiúsculas e acentos na busca ("maua" encontra "Mauá")
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export default function TelaParceiros() {
  const [busca, setBusca] = useState('');
  const [buscaEmFoco, setBuscaEmFoco] = useState(false);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return parceiros.filter((p) => normalizar(p.nome).includes(termo));
  }, [busca]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.tela}>
      <Cabecalho />

      <ScrollView contentContainerStyle={styles.rolagem}>
        <View style={styles.conteudo}>
          <View style={styles.topo}>
            <View style={styles.tituloBloco}>
              <BotaoPrimario titulo="Voltar" icone="rotate-ccw" onPress={voltar} />
              <Text style={styles.titulo}>Nossos parceiros</Text>
            </View>

            <View style={[styles.busca, buscaEmFoco && styles.buscaFoco]}>
              <TextInput
                value={busca}
                onChangeText={setBusca}
                onFocus={() => setBuscaEmFoco(true)}
                onBlur={() => setBuscaEmFoco(false)}
                placeholder="Buscar parceiro..."
                placeholderTextColor={cores.textoSuave}
                style={styles.buscaCampo}
                accessibilityLabel="Buscar parceiro"
              />
              <Feather name="search" size={20} color={cores.textoSuave} />
            </View>
          </View>

          <View style={styles.divisor} />

          {filtrados.length > 0 ? (
            <View style={styles.grade}>
              {filtrados.map((parceiro) => (
                <View key={parceiro.id} style={styles.celula}>
                  <CartaoParceiro parceiro={parceiro} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.vazio}>Nenhum parceiro encontrado para "{busca}".</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 48,
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
    outlineWidth: 0,
  },
  divisor: {
    width: 160,
    height: 2,
    backgroundColor: cores.primaria,
    marginTop: 32,
    marginBottom: 28,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -10,
  },
  celula: {
    width: '50%',
    padding: 10,
  },
  vazio: {
    fontFamily: fontes.regular,
    fontSize: 16,
    color: cores.textoSuave,
  },
});
