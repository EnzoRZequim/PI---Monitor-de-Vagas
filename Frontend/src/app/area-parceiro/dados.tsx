import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CampoSelecao } from '@/components/campos/CampoTexto';
import { GraficoBarras } from '@/components/graficos/GraficoBarras';
import { GraficoLinha } from '@/components/graficos/GraficoLinha';
import { TelaParceiro } from '@/components/telas/TelaParceiro';
import { parceiroLogado, porcentagem, useLocaisParceiro } from '@/dados/areaParceiro';
import { HORAS, ocupacaoPorHorario } from '@/dados/ocupacaoHoraria';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { cores, espaco, larguras, tipografia } from '@/theme';

const ROTULOS_HORAS = HORAS.map((hora) => `${hora}h`);

// Análises da área do parceiro ("Dados" no Figma). No celular segue o Figma; no desktop o select vai ao
// lado do título e, a partir de 1024px, os gráficos ficam lado a lado.
export default function TelaDados() {
  const locais = useLocaisParceiro();
  const telaPequena = useTelaPequena();
  const { width } = useWindowDimensions();
  const ladoALado = width >= larguras.lg;
  const [localId, setLocalId] = useState<string | null>(null);

  // Abre no primeiro local; se o escolhido for removido, volta para o primeiro
  const local = locais.find((l) => l.id === localId) ?? locais[0];

  const selecao = local && (
    <CampoSelecao
      opcoes={locais.map((l) => ({ rotulo: l.nome, valor: l.id }))}
      valor={local.id}
      onChange={setLocalId}
      placeholder="Local"
      style={!telaPequena && styles.selecaoDesktop}
    />
  );

  const serie = local ? ocupacaoPorHorario(local.id) : null;
  const barras = (local?.blocos ?? [])
    .filter((bloco) => bloco.ativo)
    .map((bloco) => ({ rotulo: bloco.nome, valor: porcentagem(bloco.vagasOcupadas, bloco.vagasTotais) }));

  const graficoHorario = (
    <View style={[styles.secaoHorario, ladoALado && styles.coluna]}>
      <Text style={styles.tituloSecao}>Ocupação por horário</Text>
      {serie ? (
        <GraficoLinha
          rotulos={ROTULOS_HORAS}
          valores={serie}
          legenda="Ocupação"
          descricao={`Ocupação média por horário: ${serie.map((v, i) => `${ROTULOS_HORAS[i]} ${v}%`).join(', ')}.`}
        />
      ) : (
        <Text style={styles.vazio}>Este local ainda não tem histórico de ocupação.</Text>
      )}
    </View>
  );

  const graficoBlocos = (
    <View style={[styles.secaoBlocos, ladoALado && styles.coluna]}>
      <Text style={styles.tituloSecao}>Ocupação por bloco (em tempo real)</Text>
      {barras.length > 0 ? (
        <GraficoBarras
          itens={barras}
          descricao={`Ocupação atual por bloco: ${barras.map((b) => `${b.rotulo} ${b.valor}%`).join(', ')}.`}
        />
      ) : (
        <Text style={styles.vazio}>Nenhum bloco ativo neste local.</Text>
      )}
    </View>
  );

  return (
    <TelaParceiro
      secao="dados"
      tituloAba="Dados"
      titulo={parceiroLogado.nome}
      subtitulo="Análises dos últimos 7 dias"
      acao={!telaPequena && selecao}
      espacoTitulo={ESPACO_TITULO_CELULAR}
    >
      {!local ? (
        <Text style={styles.vazio}>Nenhum local cadastrado ainda.</Text>
      ) : (
        <>
          {telaPequena && (
            <>
              <View style={celular.campo}>
                <Text style={styles.tituloSecao}>Local</Text>
                {selecao}
              </View>
              <View style={celular.divisor} />
            </>
          )}

          <View style={ladoALado ? styles.colunas : styles.pilha}>
            {graficoHorario}
            {graficoBlocos}
          </View>
        </>
      )}
    </TelaParceiro>
  );
}

const styles = StyleSheet.create({
  selecaoDesktop: {
    width: larguras.padrao
  },
  // Figma: 40px entre os gráficos
  pilha: {
    gap: espaco[10],
  },
  // Desktop largo: duas colunas iguais, alinhadas pelo topo (mesmo espaçamento do FormularioLocal)
  colunas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco[12],
  },
  // Só lado a lado: empilhadas, flex: 1 faria as duas dividirem a altura da tela
  coluna: {
    flex: 1,
  },
  // Figma: 10px do título até o gráfico de linha e 17px até o de barras
  secaoHorario: {
    gap: 10,
  },
  secaoBlocos: {
    gap: 17,
  },
  tituloSecao: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
  },
});

// Valores do Figma ("Dados", 393px)
const ESPACO_TITULO_CELULAR = 32;
const ESPACO_DIVISOR_CELULAR = 42;

const celular = StyleSheet.create({
  campo: {
    gap: espaco[2],
  },
  divisor: {
    alignSelf: 'center',
    width: 150,
    height: 2,
    backgroundColor: cores.primaria,
    marginVertical: ESPACO_DIVISOR_CELULAR,
    
  },
});
