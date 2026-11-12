import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { BotaoCircular } from '@/components/botoes/BotaoCircular';
import type { Planta, Ponto, VagaPlanta } from '@/dados/mapaVagas';
import { animacao, cores, espaco, fontes, mapa, tamanhoFonte } from '@/theme';

type Props = {
  planta: Planta;
  // IDs das vagas ocupadas
  ocupadas: ReadonlySet<string>;
  // Lido por leitores de tela no lugar do mapa
  descricao: string;
};

// Respiro em volta da planta (em unidades do Figma, onde a escala 1 mostra as vagas com 101x37)
const MARGEM = 24;
// Zoom máximo: o dobro do tamanho do Figma (ou mais, quando a planta já abre ampliada)
const ZOOM_MAXIMO = 2;

const ponto = (p: Ponto, planta: Planta) => ({ x: p.X * planta.Largura + MARGEM, y: p.Y * planta.Altura + MARGEM });

// Contorno do quadrilátero com os cantos arredondados (raio do Figma)
function caminhoArredondado(pontos: { x: number; y: number }[], raio: number) {
  const n = pontos.length;
  return (
    pontos
      .map((p1, i) => {
        const p0 = pontos[(i + n - 1) % n];
        const p2 = pontos[(i + 1) % n];
        const d1 = Math.hypot(p0.x - p1.x, p0.y - p1.y);
        const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const r = Math.min(raio, d1 / 2, d2 / 2);
        const a = { x: p1.x + ((p0.x - p1.x) / d1) * r, y: p1.y + ((p0.y - p1.y) / d1) * r };
        const b = { x: p1.x + ((p2.x - p1.x) / d2) * r, y: p1.y + ((p2.y - p1.y) / d2) * r };
        return `${i === 0 ? 'M' : 'L'}${a.x} ${a.y}Q${p1.x} ${p1.y} ${b.x} ${b.y}`;
      })
      .join('') + 'Z'
  );
}

// Mistura duas cores "#rrggbb" (t de 0 a 1)
function misturar(de: string, para: string, t: number) {
  const canal = (cor: string, i: number) => parseInt(cor.slice(1 + i * 2, 3 + i * 2), 16);
  const c = (i: number) => Math.round(canal(de, i) + (canal(para, i) - canal(de, i)) * t);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

// Progresso de 0 (livre) a 1 (ocupada): anima só quando a vaga troca de estado
function useProgresso(ocupada: boolean) {
  const [progresso, setProgresso] = useState(ocupada ? 1 : 0);
  const anterior = useRef(ocupada);

  useEffect(() => {
    if (anterior.current === ocupada) return;
    anterior.current = ocupada;
    const de = ocupada ? 0 : 1;
    const para = ocupada ? 1 : 0;
    let inicio: number | undefined;
    let quadro = 0;

    const passo = (agora: number) => {
      inicio ??= agora;
      const t = Math.min((agora - inicio) / animacao.duracao, 1);
      setProgresso(de + (para - de) * t);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ocupada]);

  return progresso;
}

type VagaProps = { vaga: VagaPlanta; planta: Planta; ocupada: boolean };

// Vaga do Figma: preenchimento a 50% e contorno sólido. Verde livre, vermelha ocupada; a preferencial
// é azul quando livre e, ocupada, fica vermelha mas mantém o contorno azul e o símbolo.
const Vaga = memo(function Vaga({ vaga, planta, ocupada }: VagaProps) {
  const progresso = useProgresso(ocupada);
  const pontos = vaga.Pontos.map((p) => ponto(p, planta));
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const centroX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centroY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const altura = Math.max(...ys) - Math.min(...ys);

  const preferencial = vaga.Tipo === 'preferencial';
  const preenchimento = misturar(preferencial ? mapa.preferencial : mapa.livre, mapa.ocupada, progresso);
  const contorno = preferencial ? mapa.preferencial : preenchimento;
  // Escala dos ícones em relação à altura da vaga
  const k = altura / 37;

  return (
    <>
      <Path
        d={caminhoArredondado(pontos, mapa.raioVaga)}
        fill={preenchimento}
        fillOpacity={mapa.opacidadePreenchimento}
        stroke={contorno}
        strokeWidth={mapa.espessuraContorno}
      />
      {preferencial && <Cadeirante x={ocupada ? centroX - 30 * k : centroX} y={centroY} k={k} />}
      {ocupada && <Carro x={preferencial ? centroX + 16 * k : centroX} y={centroY} k={preferencial ? k * 0.7 : k} />}
    </>
  );
});

// Símbolo de acesso (pessoa em cadeira de rodas), desenhado em um quadrado de 24 centrado em (x, y)
function Cadeirante({ x, y, k }: { x: number; y: number; k: number }) {
  const p = (dx: number, dy: number) => `${x + dx * k} ${y + dy * k}`;
  return (
    <>
      <Circle cx={x - 2 * k} cy={y - 9 * k} r={2.4 * k} fill={cores.textoInverso} />
      <Path
        d={`M${p(-2, -5)}L${p(-2, 3)}L${p(5, 3)}L${p(8, 9)}M${p(-2, -1)}L${p(4, -1)}`}
        stroke={cores.textoInverso}
        strokeWidth={2.2 * k}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={x - 1.5 * k} cy={y + 5.5 * k} r={5.5 * k} stroke={cores.textoInverso} strokeWidth={2.2 * k} fill="none" />
    </>
  );
}

// Carro visto de cima, de frente para a direita, em uma caixa de 52x24 centrada em (x, y)
function Carro({ x, y, k }: { x: number; y: number; k: number }) {
  const p = (dx: number, dy: number) => `${x + dx * k} ${y + dy * k}`;
  const poligono = (...pontos: [number, number][]) => pontos.map(([dx, dy]) => p(dx, dy).replace(' ', ',')).join(' ');
  return (
    <>
      {/* Carroceria, com a frente mais arredondada que a traseira */}
      <Path
        d={`M${p(-22, -12)}H${x + 14 * k}Q${p(26, -12)} ${p(26, -4)}V${y + 4 * k}Q${p(26, 12)} ${p(14, 12)}H${x - 22 * k}Q${p(-26, 12)} ${p(-26, 8)}V${y - 8 * k}Q${p(-26, -12)} ${p(-22, -12)}Z`}
        fill={cores.textoInverso}
      />
      {/* Retrovisores */}
      <Rect x={x + 7 * k} y={y - 15 * k} width={5 * k} height={4 * k} rx={1.5 * k} fill={cores.textoInverso} />
      <Rect x={x + 7 * k} y={y + 11 * k} width={5 * k} height={4 * k} rx={1.5 * k} fill={cores.textoInverso} />
      {/* Para-brisa e vidro traseiro */}
      <Polygon points={poligono([4, -8], [15, -6], [15, 6], [4, 8])} fill={mapa.ocupada} />
      <Polygon points={poligono([-16, -6.5], [-11, -7.5], [-11, 7.5], [-16, 6.5])} fill={mapa.ocupada} />
    </>
  );
}

function limitar(valor: number, minimo: number, maximo: number) {
  'worklet';
  return Math.min(Math.max(valor, minimo), maximo);
}

// Mantém o mapa dentro da área: centralizado quando cabe, sem deixar espaço vazio quando é maior
function manter(posicao: number, conteudo: number, area: number) {
  'worklet';
  if (conteudo <= area) return (area - conteudo) / 2;
  return limitar(posicao, area - conteudo, 0);
}

// Planta com zoom (pinça, toque duplo e roda do mouse) e arrasto, no estilo dos mapas de navegação
export function MapaVagas({ planta, ocupadas, descricao }: Props) {
  const [area, setArea] = useState({ largura: 0, altura: 0 });
  const areaRef = useRef<View>(null);

  const larguraConteudo = planta.Largura + MARGEM * 2;
  const alturaConteudo = planta.Altura + MARGEM * 2;
  // Escala em que a planta inteira cabe na área; é também o menor zoom
  const ajuste =
    area.largura > 0 && area.altura > 0 ? Math.min(area.largura / larguraConteudo, area.altura / alturaConteudo) : 0;
  const maximo = Math.max(ZOOM_MAXIMO, ajuste * 2);

  const escala = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const areaLargura = useSharedValue(0);
  const areaAltura = useSharedValue(0);
  const minimo = useSharedValue(1);
  const escalaInicial = useSharedValue(1);
  const xInicial = useSharedValue(0);
  const yInicial = useSharedValue(0);

  // Abre (e reabre, se a área mudar de tamanho) com a planta inteira centralizada
  useEffect(() => {
    if (!ajuste) return;
    areaLargura.set(area.largura);
    areaAltura.set(area.altura);
    minimo.set(ajuste);
    escala.set(ajuste);
    x.set((area.largura - larguraConteudo * ajuste) / 2);
    y.set((area.altura - alturaConteudo * ajuste) / 2);
  }, [ajuste, area, larguraConteudo, alturaConteudo, areaLargura, areaAltura, minimo, escala, x, y]);

  const gestos = useMemo(() => {
    const arrastar = Gesture.Pan()
      .maxPointers(1)
      .onStart(() => {
        xInicial.set(x.get());
        yInicial.set(y.get());
      })
      .onUpdate((e) => {
        x.set(manter(xInicial.get() + e.translationX, larguraConteudo * escala.get(), areaLargura.get()));
        y.set(manter(yInicial.get() + e.translationY, alturaConteudo * escala.get(), areaAltura.get()));
      });

    // O ponto sob os dedos continua sob os dedos enquanto o zoom muda
    const pinca = Gesture.Pinch()
      .onStart(() => {
        escalaInicial.set(escala.get());
        xInicial.set(x.get());
        yInicial.set(y.get());
      })
      .onUpdate((e) => {
        const nova = limitar(escalaInicial.get() * e.scale, minimo.get(), maximo);
        const px = (e.focalX - xInicial.get()) / escalaInicial.get();
        const py = (e.focalY - yInicial.get()) / escalaInicial.get();
        escala.set(nova);
        x.set(manter(e.focalX - px * nova, larguraConteudo * nova, areaLargura.get()));
        y.set(manter(e.focalY - py * nova, alturaConteudo * nova, areaAltura.get()));
      });

    // Toque duplo: aproxima no ponto tocado (vagas no tamanho do Figma) ou volta à planta inteira
    const duploToque = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((e) => {
        const atual = escala.get();
        const alvo = atual < minimo.get() * 1.5 ? limitar(Math.max(1, minimo.get() * 2), minimo.get(), maximo) : minimo.get();
        const px = (e.x - x.get()) / atual;
        const py = (e.y - y.get()) / atual;
        const config = { duration: animacao.duracao };
        escala.set(withTiming(alvo, config));
        x.set(withTiming(manter(e.x - px * alvo, larguraConteudo * alvo, areaLargura.get()), config));
        y.set(withTiming(manter(e.y - py * alvo, alturaConteudo * alvo, areaAltura.get()), config));
      });

    return Gesture.Race(duploToque, Gesture.Simultaneous(pinca, arrastar));
  }, [larguraConteudo, alturaConteudo, maximo, escala, x, y, areaLargura, areaAltura, minimo, escalaInicial, xInicial, yInicial]);

  // Na web a roda do mouse (e a pinça do touchpad) dá zoom no ponto sob o cursor, e o arrasto e a
  // pinça são do mapa, e não da página
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const no = areaRef.current as unknown as HTMLElement | null;
    if (!no) return;
    no.style.touchAction = 'none';

    const aoRolar = (e: WheelEvent) => {
      e.preventDefault();
      const caixa = no.getBoundingClientRect();
      const fx = e.clientX - caixa.left;
      const fy = e.clientY - caixa.top;
      const atual = escala.get();
      const nova = limitar(atual * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), minimo.get(), maximo);
      const px = (fx - x.get()) / atual;
      const py = (fy - y.get()) / atual;
      escala.set(nova);
      x.set(manter(fx - px * nova, larguraConteudo * nova, areaLargura.get()));
      y.set(manter(fy - py * nova, alturaConteudo * nova, areaAltura.get()));
    };
    no.addEventListener('wheel', aoRolar, { passive: false });
    return () => no.removeEventListener('wheel', aoRolar);
  }, [larguraConteudo, alturaConteudo, maximo, escala, x, y, areaLargura, areaAltura, minimo]);

  const estiloMapa = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: escala.get() }],
  }));

  const recentralizar = () => {
    const config = { duration: animacao.duracao };
    escala.set(withTiming(ajuste, config));
    x.set(withTiming((area.largura - larguraConteudo * ajuste) / 2, config));
    y.set(withTiming((area.altura - alturaConteudo * ajuste) / 2, config));
  };

  const entrada = ponto(planta.Entrada, planta);
  // Texto e seta da entrada, em unidades do mapa (legíveis quando se aproxima)
  const tamanhoEntrada = tamanhoFonte.lg;

  return (
    <View style={styles.raiz}>
      <GestureDetector gesture={gestos}>
        <View
          ref={areaRef}
          style={styles.area}
          onLayout={(e) => setArea({ largura: e.nativeEvent.layout.width, altura: e.nativeEvent.layout.height })}
          accessible
          accessibilityRole="image"
          accessibilityLabel={descricao}
        >
          <Animated.View style={[styles.mapa, { width: larguraConteudo, height: alturaConteudo }, estiloMapa]}>
            <Svg width={larguraConteudo} height={alturaConteudo}>
              {planta.Linhas.map((linha, i) => {
                const de = ponto(linha.De, planta);
                const para = ponto(linha.Para, planta);
                return (
                  <Line
                    key={i}
                    x1={de.x}
                    y1={de.y}
                    x2={para.x}
                    y2={para.y}
                    stroke={mapa.linha}
                    strokeWidth={mapa.espessuraLinha}
                    strokeLinecap="round"
                  />
                );
              })}

              {planta.Vagas.map((vaga) => (
                <Vaga key={vaga.ID} vaga={vaga} planta={planta} ocupada={ocupadas.has(vaga.ID)} />
              ))}

              {/* Seta da entrada, apontando para dentro do corredor */}
              <Line
                x1={entrada.x}
                y1={entrada.y + 2}
                x2={entrada.x}
                y2={entrada.y - 14}
                stroke={cores.primaria}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <Polygon
                points={`${entrada.x - 10},${entrada.y - 12} ${entrada.x},${entrada.y - 26} ${entrada.x + 10},${entrada.y - 12}`}
                fill={cores.primaria}
              />
            </Svg>

            <Text
              style={[
                styles.entrada,
                { left: entrada.x - 60, top: entrada.y + 4, fontSize: tamanhoEntrada, lineHeight: tamanhoEntrada },
              ]}
            >
              Entrada
            </Text>
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.recentralizar}>
        <BotaoCircular icone="maximize" rotulo="Mostrar o mapa inteiro" onPress={recentralizar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  area: {
    flex: 1,
    overflow: 'hidden',
  },
  mapa: {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: 'top left',
  },
  entrada: {
    position: 'absolute',
    width: 120,
    textAlign: 'center',
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
  },
  recentralizar: {
    position: 'absolute',
    right: espaco[3],
    bottom: espaco[3],
  },
});
