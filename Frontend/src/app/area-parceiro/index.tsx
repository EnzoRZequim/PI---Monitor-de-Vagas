import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoDado } from '@/components/CartaoDado';
import { CartaoDetalhes } from '@/components/CartaoDetalhes';
import { IndicadorOcupacao } from '@/components/IndicadorOcupacao';
import { LinkAcao } from '@/components/LinkAcao';
import { TelaParceiro } from '@/components/TelaParceiro';
import {
  ocupacaoDoLocal,
  parceiroLogado,
  porcentagem,
  resumoDosLocais,
  useLocaisParceiro,
} from '@/dados/areaParceiro';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { rotaDoLocalParceiro } from '@/rotas';
import { cores, espaco, tipografia } from '@/theme';

// Painel inicial da área do parceiro ("Dashboard" no Figma)
export default function TelaPainelParceiro() {
  const locais = useLocaisParceiro();
  const telaPequena = useTelaPequena();
  const resumo = resumoDosLocais(locais);
  const percentualCameras = porcentagem(resumo.camerasAtivas, resumo.camerasTotais);

  // No desktop os quatro cartões dividem a linha; no celular ficam dois por linha, como no Figma
  const estiloDado = telaPequena ? celular.dado : styles.dado;

  return (
    <TelaParceiro
      secao="inicio"
      tituloAba="Área do parceiro"
      titulo={`Olá, ${parceiroLogado.nome}.`}
      subtitulo={`${resumo.locaisAtivos} estacionamento(s) ativo(s)`}
    >
      <View style={styles.dados}>
        <CartaoDado
          titulo="Vagas Monitoradas"
          valor={String(resumo.vagasTotais)}
          legenda={`${resumo.blocosAtivos} blocos`}
          style={estiloDado}
        />
        <CartaoDado
          titulo="Ocupação média"
          valor={`${porcentagem(resumo.vagasOcupadas, resumo.vagasTotais)}%`}
          legenda={`${resumo.vagasOcupadas} vagas ocupadas`}
          style={estiloDado}
        />
        <CartaoDado
          titulo="Câmeras ativas"
          valor={`${resumo.camerasAtivas}/${resumo.camerasTotais}`}
          legenda={`${percentualCameras}%`}
          style={estiloDado}
        />
        <CartaoDado
          titulo="Locais Registrados"
          valor={String(locais.length)}
          style={estiloDado}
        />
      </View>

      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Seus locais</Text>
        <LinkAcao titulo="+ adicionar local" onPress={() => router.push('/area-parceiro/locais/novo')} />
      </View>

      {locais.length > 0 ? (
        <View style={styles.grade}>
          {locais.map((local) => {
            const { vagasOcupadas, vagasTotais } = ocupacaoDoLocal(local);
            const blocos = local.blocos.filter((bloco) => bloco.ativo).length;
            return (
              <View key={local.id} style={[styles.celula, !telaPequena && styles.celulaDesktop]}>
                <CartaoDetalhes
                  titulo={local.nome}
                  detalhes={[
                    `${blocos} ${blocos === 1 ? 'Bloco' : 'Blocos'}`,
                    `${vagasTotais - vagasOcupadas}/${vagasTotais} Vagas livres`,
                  ]}
                  onPress={() => router.push(rotaDoLocalParceiro(local.id))}
                >
                  <IndicadorOcupacao ocupadas={vagasOcupadas} total={vagasTotais} porcentagemLivre />
                </CartaoDetalhes>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.vazio}>Nenhum local cadastrado ainda.</Text>
      )}
    </TelaParceiro>
  );
}

const styles = StyleSheet.create({
  dados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco[6],
    marginBottom: espaco[12],
  },
  dado: {
    flex: 1,
    minWidth: 180,
  },
  secao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco[4],
    marginBottom: espaco[6],
  },
  tituloSecao: {
    ...tipografia.h5,
    color: cores.primaria,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -espaco[2],
  },
  celula: {
    width: '100%',
    padding: espaco[2],
  },
  celulaDesktop: {
    width: '50%',
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
  },
});

const celular = StyleSheet.create({
  dado: {
    // Dois por linha, descontando o gap
    width: '46%',
    flexGrow: 1,
  },
});
