import { useId, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { cores, espaco, grafico, tipografia } from '@/theme';

type Props = {
  // Um rótulo por ponto (ex.: "9h")
  rotulos: string[];
  // Valores de 0 a 100, na mesma ordem dos rótulos
  valores: number[];
  legenda: string;
  // Lido por leitores de tela no lugar do gráfico
  descricao: string;
};

// Medidas do Figma ("Ocupação por horário", 361x241). A largura acompanha o espaço disponível; as
// alturas são fixas.
const LARGURA_EIXO_Y = 29;
const RECUO_EIXO_Y = 4;
const MARGEM_DIREITA = 19;
const ALTURA_AREA = 195;
const TOPO_GRADE = 6;
const BASE_GRADE = 189;
const ALTURA_ROTULO = 15;
// O eixo X começa 2px antes do fim da área do gráfico (gap -2 no Figma)
const TOPO_EIXO_X = ALTURA_AREA - 2;
const ALTURA_EIXO_X = 24;
const ALTURA_LEGENDA = 24;
const ALTURA_TOTAL = TOPO_EIXO_X + ALTURA_EIXO_X + ALTURA_LEGENDA;
const MARCAS = [100, 80, 60, 40, 20, 0];
const RAIO_PONTO = 4;

// Gráfico de linha com área em degradê ("BarLineChart" de linha no Figma)
export function GraficoLinha({ rotulos, valores, legenda, descricao }: Props) {
  const [largura, setLargura] = useState(0);
  // Id único do degradê; o SVG não aceita ":" no id
  const idDegrade = `degrade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const inicio = LARGURA_EIXO_Y + 1;
  const fim = largura - MARGEM_DIREITA;
  const passo = valores.length > 1 ? (fim - inicio) / (valores.length - 1) : 0;
  const x = (i: number) => inicio + i * passo;
  const y = (valor: number) => TOPO_GRADE + (1 - Math.min(Math.max(valor, 0), 100) / 100) * (BASE_GRADE - TOPO_GRADE);

  const pontos = valores.map((valor, i) => `${x(i)},${y(valor)}`);
  const linha = `M${pontos.join(' L')}`;
  const area = `${linha} L${x(valores.length - 1)},${BASE_GRADE} L${x(0)},${BASE_GRADE} Z`;

  return (
    <View
      style={styles.grafico}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricao}
    >
      {largura > 0 && (
        <>
          <Svg width={largura} height={ALTURA_AREA}>
            <Defs>
              <LinearGradient id={idDegrade} x1="0" y1="0" x2="0" y2="1">
                {grafico.area.map((parada, i) => (
                  <Stop key={i} offset={i} stopColor={parada.cor} stopOpacity={parada.opacidade} />
                ))}
              </LinearGradient>
            </Defs>

            {MARCAS.map((marca) => (
              <Line
                key={`h${marca}`}
                x1={inicio}
                x2={fim}
                y1={y(marca)}
                y2={y(marca)}
                stroke={marca === 0 ? grafico.gradeBase : grafico.grade}
                strokeWidth={1}
              />
            ))}
            {valores.map((_, i) => (
              <Line
                key={`v${i}`}
                x1={x(i)}
                x2={x(i)}
                y1={TOPO_GRADE}
                y2={BASE_GRADE}
                stroke={grafico.grade}
                strokeWidth={1}
              />
            ))}

            <Path d={area} fill={`url(#${idDegrade})`} />
            <Path d={linha} fill="none" stroke={grafico.linha} strokeWidth={2} />
            {valores.map((valor, i) => (
              <Ponto key={`p${i}`} cx={x(i)} cy={y(valor)} />
            ))}
          </Svg>

          {MARCAS.map((marca) => (
            <Text key={`y${marca}`} style={[styles.texto, styles.rotuloY, { top: y(marca) - ALTURA_ROTULO / 2 }]}>
              {marca}
            </Text>
          ))}
          {rotulos.map((rotulo, i) => (
            <Text key={`x${rotulo}`} style={[styles.texto, styles.rotuloX, { left: x(i) - LARGURA_ROTULO_X / 2 }]}>
              {rotulo}
            </Text>
          ))}

          <View style={styles.legenda}>
            <Svg width={TAMANHO_AMOSTRA} height={TAMANHO_AMOSTRA}>
              <Line
                x1={0}
                x2={TAMANHO_AMOSTRA}
                y1={TAMANHO_AMOSTRA / 2}
                y2={TAMANHO_AMOSTRA / 2}
                stroke={grafico.linha}
                strokeWidth={2}
              />
              <Ponto cx={TAMANHO_AMOSTRA / 2} cy={TAMANHO_AMOSTRA / 2} />
            </Svg>
            <Text style={styles.texto}>{legenda}</Text>
          </View>
        </>
      )}
    </View>
  );
}

// Ponto do Figma: círculo de 8px, branco, com borda blue-500 de 1px
function Ponto({ cx, cy }: { cx: number; cy: number }) {
  return <Circle cx={cx} cy={cy} r={RAIO_PONTO} fill={cores.superficie} stroke={grafico.linha} strokeWidth={1} />;
}

const LARGURA_ROTULO_X = 30;
const TAMANHO_AMOSTRA = 16;

const styles = StyleSheet.create({
  grafico: {
    height: ALTURA_TOTAL,
  },
  texto: {
    ...tipografia.pequeno,
    color: grafico.eixo,
  },
  rotuloY: {
    position: 'absolute',
    left: 0,
    width: LARGURA_EIXO_Y - RECUO_EIXO_Y,
    textAlign: 'right',
  },
  rotuloX: {
    position: 'absolute',
    top: TOPO_EIXO_X,
    width: LARGURA_ROTULO_X,
    textAlign: 'center',
  },
  legenda: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TOPO_EIXO_X + ALTURA_EIXO_X,
    height: ALTURA_LEGENDA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[1],
  },
});
