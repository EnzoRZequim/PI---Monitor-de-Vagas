import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { corDaOcupacao } from '@/components/cartoes/IndicadorOcupacao';
import { grafico, tipografia } from '@/theme';

export type ItemBarra = {
  rotulo: string;
  // De 0 a 100
  valor: number;
};

type Props = {
  itens: ItemBarra[];
  // Lido por leitores de tela no lugar do gráfico
  descricao: string;
};

// Medidas do Figma ("Ocupação por bloco", 361px de largura e 75px por linha). A largura acompanha o
// espaço disponível; a altura cresce com o número de itens.
const ALTURA_ESCALA = 15;
const ALTURA_LINHA = 75;
const ESPESSURA_BARRA = 32;
const INICIO_BARRAS = 58;
const MARGEM_DIREITA = 8;
// Coluna dos nomes: termina 4px antes das barras, como no Figma. Começa na borda (e não no padding de
// 8px do Figma) para nomes como "Bloco C" não serem cortados pela medida de texto do navegador.
const ESQUERDA_ROTULOS = 0;
const LARGURA_ROTULOS = INICIO_BARRAS - 4;
const ALTURA_ROTULO = 15;
const MARCAS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const LARGURA_MARCA = 30;
// Valor da barra ("DataLabel" do Figma): Inter Regular 10, 3px depois do fim da barra (5px dentro
// dela quando não cabe fora)
const TAMANHO_VALOR = 10;
const ALTURA_VALOR = 12;
const LARGURA_VALOR = 20;
const RECUO_VALOR = 3;
const RECUO_VALOR_DENTRO = 5;

// Barras horizontais com escala de 0 a 100 no topo ("BarLineChart" de barras no Figma)
export function GraficoBarras({ itens, descricao }: Props) {
  const [largura, setLargura] = useState(0);

  const extensao = Math.max(largura - INICIO_BARRAS - MARGEM_DIREITA, 0);
  const x = (valor: number) => INICIO_BARRAS + (Math.min(Math.max(valor, 0), 100) / 100) * extensao;
  const topoLinha = (i: number) => ALTURA_ESCALA + i * ALTURA_LINHA;
  const alturaGrade = itens.length * ALTURA_LINHA;

  return (
    <View
      style={{ height: ALTURA_ESCALA + alturaGrade + 1 }}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricao}
    >
      {largura > 0 && (
        <>
          {MARCAS.map((marca) => (
            <Text key={`m${marca}`} style={[styles.texto, styles.marca, { left: x(marca) - LARGURA_MARCA / 2 }]}>
              {marca}
            </Text>
          ))}

          <Svg width={largura} height={ALTURA_ESCALA + alturaGrade + 1} style={StyleSheet.absoluteFill}>
            {MARCAS.map((marca) => (
              <Line
                key={`v${marca}`}
                x1={x(marca)}
                x2={x(marca)}
                y1={ALTURA_ESCALA}
                y2={ALTURA_ESCALA + alturaGrade}
                stroke={marca === 0 ? grafico.gradeBase : grafico.grade}
                strokeWidth={1}
              />
            ))}
            {[...itens, null].map((_, i) => (
              <Line
                key={`h${i}`}
                x1={INICIO_BARRAS}
                x2={INICIO_BARRAS + extensao}
                y1={topoLinha(i)}
                y2={topoLinha(i)}
                stroke={grafico.grade}
                strokeWidth={1}
              />
            ))}
            {itens.map((item, i) => (
              <Rect
                key={`b${item.rotulo}`}
                x={INICIO_BARRAS}
                y={topoLinha(i) + (ALTURA_LINHA - ESPESSURA_BARRA) / 2}
                width={x(item.valor) - INICIO_BARRAS}
                height={ESPESSURA_BARRA}
                // Mesmo nível de ocupação dos badges, nos tons 500 do Figma
                fill={corDaOcupacao(item.valor, 100).grafico}
              />
            ))}
          </Svg>

          {itens.map((item, i) => {
            const fimBarra = x(item.valor);
            // No Figma o valor fica logo depois do fim da barra; na barra cheia, entra nela
            const cabeFora = fimBarra + RECUO_VALOR + LARGURA_VALOR <= largura;
            const topoTexto = topoLinha(i) + (ALTURA_LINHA - ALTURA_ROTULO) / 2;

            return (
              <View key={`t${item.rotulo}`} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Text style={[styles.texto, styles.rotulo, { top: topoTexto }]} numberOfLines={1}>
                  {item.rotulo}
                </Text>
                <Text
                  style={[
                    styles.texto,
                    styles.valor,
                    { top: topoLinha(i) + (ALTURA_LINHA - ALTURA_VALOR) / 2 },
                    cabeFora
                      ? { left: fimBarra + RECUO_VALOR, textAlign: 'left' }
                      : { left: fimBarra - RECUO_VALOR_DENTRO - LARGURA_VALOR, textAlign: 'right' },
                  ]}
                >
                  {Math.round(item.valor)}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  texto: {
    ...tipografia.pequeno,
    color: grafico.eixo,
  },
  marca: {
    position: 'absolute',
    top: 0,
    width: LARGURA_MARCA,
    textAlign: 'center',
  },
  rotulo: {
    position: 'absolute',
    left: ESQUERDA_ROTULOS,
    width: LARGURA_ROTULOS,
    textAlign: 'right',
  },
  valor: {
    position: 'absolute',
    width: LARGURA_VALOR,
    fontSize: TAMANHO_VALOR,
  },
});
