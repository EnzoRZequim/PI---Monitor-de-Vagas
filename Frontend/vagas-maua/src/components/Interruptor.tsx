import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { animacao, cores, gradientes, raio } from '@/theme';

type Props = {
  ativo: boolean;
  onChange: (ativo: boolean) => void;
  // Lido por leitores de tela
  rotulo: string;
};

const LARGURA = 50;
const ALTURA = 24;
const ESPESSURA = 2;
const PINO = 16;
const FOLGA_X = 4;
const FOLGA_Y = 2;
// Quanto o pino anda de um lado ao outro
const CURSO = LARGURA - ESPESSURA * 2 - FOLGA_X * 2 - PINO;

// Botão liga/desliga ("activate" no Figma)
export function Interruptor({ ativo, onChange, rotulo }: Props) {
  const progresso = useRef(new Animated.Value(ativo ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: ativo ? 1 : 0,
      duration: animacao.duracao,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [ativo, progresso]);

  const deslocamento = progresso.interpolate({ inputRange: [0, 1], outputRange: [0, CURSO] });

  return (
    <Pressable
      onPress={() => onChange(!ativo)}
      accessibilityRole="switch"
      accessibilityState={{ checked: ativo }}
      accessibilityLabel={rotulo}
      style={styles.trilho}
    >
      {/* Desligado por baixo; o ligado aparece por cima com fade */}
      <CaixaGradiente
        borda={[cores.inativo, cores.inativo]}
        fundo={gradientes.secundario.fundo}
        raio={raio.pilula}
        espessura={ESPESSURA}
        style={StyleSheet.absoluteFill}
        estiloConteudo={styles.preencher}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progresso }]}>
        <CaixaGradiente
          {...gradientes.primario}
          raio={raio.pilula}
          espessura={ESPESSURA}
          style={styles.preencher}
          estiloConteudo={styles.preencher}
        />
      </Animated.View>

      <Animated.View style={[styles.pino, { transform: [{ translateX: deslocamento }] }]}>
        <View style={[styles.preencher, { backgroundColor: cores.inativo }]} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progresso }]}>
          <LinearGradient colors={gradientes.secundario.fundo} style={styles.preencher} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trilho: {
    width: LARGURA,
    height: ALTURA,
  },
  preencher: {
    flex: 1,
  },
  pino: {
    position: 'absolute',
    left: ESPESSURA + FOLGA_X,
    top: ESPESSURA + FOLGA_Y,
    width: PINO,
    height: PINO,
    borderRadius: PINO / 2,
    overflow: 'hidden',
  },
});
