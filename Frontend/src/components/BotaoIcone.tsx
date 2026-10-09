import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { useDestaque } from '@/hooks/useDestaque';
import { cores, espaco, fontes, gradientes, raio, tamanhoFonte, tipografia } from '@/theme';

type Props = {
  titulo: string;
  icone: keyof typeof Feather.glyphMap;
  tipo?: 'primario' | 'secundario';
  // Título maior, como o "Acessar Locais" da tela inicial no celular
  grande?: boolean;
  onPress?: () => void;
};

const ESPESSURA = 3;
const CIRCULO = 32;
// Distância do círculo do ícone até a borda (paddingRight e paddingVertical)
const RECUO = 6;

// Botão em pílula com ícone à direita. No hover, o primário expande o círculo branco por todo o
// botão e o secundário ganha o fundo azul.
export function BotaoIcone({ titulo, icone, tipo = 'primario', grande = false, onPress }: Props) {
  const { progresso, eventos } = useDestaque();
  const [largura, setLargura] = useState(0);

  if (tipo === 'secundario') {
    return (
      <Pressable onPress={onPress} {...eventos} accessibilityRole="button">
        <Conteudo titulo={titulo} icone={icone} grande={grande} cor={cores.primaria} corIcone={cores.primariaEscura} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: progresso }]}>
          <Conteudo titulo={titulo} icone={icone} grande={grande} cor={cores.textoInverso} preenchido />
        </Animated.View>
      </Pressable>
    );
  }

  const larguraInterna = Math.max(largura - ESPESSURA * 2, CIRCULO);
  const circulo = {
    top: progresso.interpolate({ inputRange: [0, 1], outputRange: [RECUO, 0] }),
    right: progresso.interpolate({ inputRange: [0, 1], outputRange: [RECUO, 0] }),
    bottom: progresso.interpolate({ inputRange: [0, 1], outputRange: [RECUO, 0] }),
    width: progresso.interpolate({ inputRange: [0, 1], outputRange: [CIRCULO, larguraInterna] }),
  };

  return (
    <Pressable
      onPress={onPress}
      {...eventos}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      accessibilityRole="button"
    >
      <CaixaGradiente {...gradientes.primario} raio={raio.pilula} espessura={ESPESSURA} estiloConteudo={styles.conteudo}>
        <Text style={[styles.titulo, grande && styles.tituloGrande, { color: cores.textoInverso }]}>{titulo}</Text>
        <View style={styles.espacoIcone} />
        <Animated.View style={[styles.circulo, circulo]}>
          <CaixaGradiente
            {...gradientes.secundario}
            raio={raio.pilula}
            espessura={2}
            style={styles.preencher}
            estiloConteudo={[styles.preencher, styles.centro]}
          >
            <Feather name={icone} size={20} color={cores.primaria} />
          </CaixaGradiente>
        </Animated.View>
      </CaixaGradiente>
    </Pressable>
  );
}

type ConteudoProps = {
  titulo: string;
  icone: keyof typeof Feather.glyphMap;
  grande: boolean;
  cor: string;
  corIcone?: string;
  preenchido?: boolean;
};

function Conteudo({ titulo, icone, grande, cor, corIcone = cor, preenchido = false }: ConteudoProps) {
  return (
    <CaixaGradiente
      borda={gradientes.primario.borda}
      // Sem fundo no Figma; usa a cor da página (ver CaixaGradiente)
      fundo={preenchido ? gradientes.primario.fundo : cores.fundo}
      raio={raio.pilula}
      espessura={ESPESSURA}
      estiloConteudo={styles.conteudo}
    >
      <Text style={[styles.titulo, grande && styles.tituloGrande, { color: cor }]}>{titulo}</Text>
      <View style={[styles.espacoIcone, styles.centro]}>
        <Feather name={icone} size={20} color={corIcone} />
      </View>
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: espaco[3],
    paddingRight: RECUO,
    paddingVertical: RECUO,
  },
  titulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.seminegrito,
  },
  tituloGrande: {
    fontSize: tamanhoFonte.lg,
  },
  espacoIcone: {
    width: CIRCULO,
    height: CIRCULO,
  },
  circulo: {
    position: 'absolute',
  },
  preencher: {
    flex: 1,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
