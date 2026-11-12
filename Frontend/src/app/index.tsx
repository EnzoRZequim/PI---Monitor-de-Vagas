import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { AcoesParceiro, Cabecalho } from '@/components/navegacao/Cabecalho';
import { Logo } from '@/components/base/Logo';
import { buscarCampus, buscarParceiro, type Campus } from '@/dados/parceiros';
import { lerUltimoLocal } from '@/dados/ultimoLocal';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { rotaDoCampus } from '@/rotas';
import { cores, espaco, fontes, LARGURA_CONTEUDO, tipografia } from '@/theme';

type UltimoVisitado = { parceiroId: string; campus: Campus };

const DESCRICAO =
  'Aqui você tem acesso ao mapa do estacionamento de todos os nossos parceiros! Evite filas ' +
  'desnecessárias, voltas pelo estacionamento e atraso nos compromissos.';

// Texto da tela inicial do Figma (celular)
const DESCRICAO_CELULAR =
  'Em nosso aplicativo, você tem acesso ao mapa do estacionamento de todos os nossos parceiros! ' +
  'Evite filas desnecessárias, voltas pelo estacionamento, e atraso nos compromissos.';

export default function TelaInicial() {
  const [ultimo, setUltimo] = useState<UltimoVisitado | null>(null);
  const telaPequena = useTelaPequena();
  const insets = useSafeAreaInsets();

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

  const acessarLocais = () => router.push('/parceiros');

  const ultimoLocal = ultimo && (
    <View style={[styles.ultimoLocal, telaPequena && celular.centralizado]}>
      <Text style={[styles.ultimoLocalRotulo, telaPequena && celular.ultimoLocalRotulo]}>Último local visitado:</Text>
      <Link
        href={rotaDoCampus(ultimo.parceiroId, ultimo.campus.id)}
        style={[styles.ultimoLocalLink, telaPequena && celular.ultimoLocalLink]}
      >
        {ultimo.campus.nome}
      </Link>
    </View>
  );

  // Celular: tudo em uma coluna, sem cabeçalho, com os botões de parceiro no rodapé
  if (telaPequena) {
    return (
      <View style={styles.tela}>
        <ScrollView
          contentContainerStyle={[
            celular.rolagem,
            { paddingTop: insets.top + espaco[16], paddingBottom: insets.bottom + espaco[16] },
          ]}
        >
          <View style={[celular.centralizado, celular.apresentacao]}>
            <View style={[celular.centralizado, celular.marca]}>
              <Logo tamanho={100} />
              <Text style={celular.titulo}>Vaga Livre</Text>
            </View>
            <Text style={celular.descricao}>{DESCRICAO_CELULAR}</Text>
          </View>

          <View style={[celular.centralizado, celular.acao]}>
            <BotaoIcone titulo="Acessar Locais" icone="arrow-right" grande onPress={acessarLocais} />
            {ultimoLocal}
          </View>

          <AcoesParceiro style={[celular.centralizado, celular.acoesParceiro]} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <Cabecalho mostrarAcoesParceiro />

      <ScrollView contentContainerStyle={styles.rolagem}>
        <View style={styles.hero}>
          <Logo tamanho={260} />

          <View style={styles.texto}>
            <Text style={styles.titulo}>Vaga Livre</Text>
            <Text style={styles.descricao}>{DESCRICAO}</Text>

            <View style={styles.acao}>
              <BotaoIcone titulo="Acessar Locais" icone="arrow-right" onPress={acessarLocais} />
              {ultimoLocal}
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
    paddingHorizontal: espaco[8],
    paddingVertical: espaco[16],
  },
  hero: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[20],
  },
  texto: {
    flexShrink: 1,
    maxWidth: 560,
  },
  titulo: {
    ...tipografia.h3,
    color: cores.primaria,
    marginBottom: espaco[5],
  },
  descricao: {
    ...tipografia.corpo,
    lineHeight: 24,
    color: cores.textoSuave,
  },
  acao: {
    marginTop: espaco[10],
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: espaco[8],
  },
  ultimoLocal: {
    gap: espaco[1],
  },
  ultimoLocalRotulo: {
    ...tipografia.pequeno,
    color: cores.primaria,
  },
  ultimoLocalLink: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
    textDecorationLine: 'underline',
  },
});

const celular = StyleSheet.create({
  rolagem: {
    flexGrow: 1,
    // Logo no topo, "Acessar Locais" no meio e botões de parceiro no rodapé
    justifyContent: 'space-between',
    gap: espaco[10],
    paddingHorizontal: espaco[4],
  },
  centralizado: {
    alignItems: 'center',
  },
  // Valores do Figma ("Início", 393px)
  apresentacao: {
    gap: espaco[4],
    paddingHorizontal: espaco[4],
  },
  marca: {
    gap: espaco[3],
  },
  titulo: {
    ...tipografia.h5,
    fontFamily: fontes.montserrat.seminegrito,
    color: cores.primaria,
  },
  descricao: {
    ...tipografia.corpo,
    // Altura de linha 100% do Figma
    lineHeight: tipografia.corpo.fontSize,
    color: cores.textoSuave,
    textAlign: 'center',
  },
  ultimoLocalLink: {
    fontFamily: fontes.inter.medio,
  },
  acao: {
    gap: espaco[4],
  },
  ultimoLocalRotulo: {
    ...tipografia.corpo,
  },
  acoesParceiro: {
    gap: espaco[4],
  },
});
