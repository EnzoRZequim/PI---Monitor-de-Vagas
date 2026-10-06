import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { Cabecalho } from '@/components/Cabecalho';
import { Logo } from '@/components/Logo';
import { buscarCampus, buscarParceiro, type Campus } from '@/dados/parceiros';
import { lerUltimoLocal } from '@/dados/ultimoLocal';
import { rotaDoCampus } from '@/rotas';
import { cores, fontes, LARGURA_CONTEUDO } from '@/theme';

type UltimoVisitado = { parceiroId: string; campus: Campus };

export default function TelaInicial() {
  const [ultimo, setUltimo] = useState<UltimoVisitado | null>(null);

  // Relê ao voltar para esta tela, pois o usuário pode ter aberto outro campus
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      lerUltimoLocal().then((local) => {
        // Ignora locais salvos que não existem mais na lista de parceiros
        const campus = local && buscarCampus(buscarParceiro(local.parceiroId), local.campusId);
        if (ativo) setUltimo(local && campus ? { parceiroId: local.parceiroId, campus } : null);
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  return (
    <View style={styles.tela}>
      <Cabecalho mostrarAcoesParceiro />

      <ScrollView contentContainerStyle={styles.rolagem}>
        <View style={styles.hero}>
          <Logo tamanho={260} />

          <View style={styles.texto}>
            <Text style={styles.titulo}>Vagas Maua</Text>
            <Text style={styles.descricao}>
              Aqui você tem acesso ao mapa do estacionamento de todos os nossos
              parceiros! Evite filas desnecessárias, voltas pelo estacionamento e atraso nos
              compromissos.
            </Text>

            <View style={styles.acao}>
              <BotaoPrimario
                titulo="Acessar Locais"
                icone="arrow-right"
                tamanho="grande"
                onPress={() => router.push('/parceiros')}
              />

              {ultimo && (
                <View style={styles.ultimoLocal}>
                  <Text style={styles.ultimoLocalRotulo}>Último local visitado:</Text>
                  <Link
                    href={rotaDoCampus(ultimo.parceiroId, ultimo.campus.id)}
                    style={styles.ultimoLocalLink}
                  >
                    {ultimo.campus.nome}
                  </Link>
                </View>
              )}
            </View>
          </View>
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
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  hero: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 80,
  },
  texto: {
    flexShrink: 1,
    maxWidth: 560,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 56,
    color: cores.primaria,
    marginBottom: 20,
  },
  descricao: {
    fontFamily: fontes.regular,
    fontSize: 18,
    lineHeight: 28,
    color: cores.textoSuave,
  },
  acao: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 32,
  },
  ultimoLocal: {
    gap: 2,
  },
  ultimoLocalRotulo: {
    fontFamily: fontes.regular,
    fontSize: 14,
    color: cores.primaria,
  },
  ultimoLocalLink: {
    fontFamily: fontes.seminegrito,
    fontSize: 15,
    color: cores.primaria,
    textDecorationLine: 'underline',
  },
});
