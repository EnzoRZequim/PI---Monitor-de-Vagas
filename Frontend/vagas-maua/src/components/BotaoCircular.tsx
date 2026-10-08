import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { cores, gradientes, raio } from '@/theme';

type Props = {
  icone: keyof typeof Feather.glyphMap;
  // Lido por leitores de tela, já que o botão não tem texto
  rotulo: string;
  onPress?: () => void;
};

export function BotaoCircular({ icone, rotulo, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => pressed && styles.pressionado}
    >
      <CaixaGradiente {...gradientes.primario} raio={raio.pilula} espessura={4} estiloConteudo={styles.conteudo}>
        <Feather name={icone} size={25} color={cores.textoInverso} />
      </CaixaGradiente>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: 14,
  },
  pressionado: {
    opacity: 0.9,
  },
});
