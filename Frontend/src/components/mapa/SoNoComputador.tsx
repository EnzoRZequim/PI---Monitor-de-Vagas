import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { CaixaGradiente } from '@/components/base/CaixaGradiente';
import { cores, espaco, gradientes, raio, tipografia } from '@/theme';

// Aviso das ferramentas que só funcionam no navegador do computador (Editor de mapas e Monitor de
// vídeo dependem do SVG, do vídeo e do canvas do navegador)
export function SoNoComputador({ ferramenta }: { ferramenta: string }) {
  return (
    <CaixaGradiente
      borda={gradientes.neutro.borda}
      fundo={cores.superficie}
      raio={raio.cartao}
      estiloConteudo={styles.conteudo}
    >
      <Feather name="monitor" size={32} color={cores.primaria} />
      <View style={styles.textos}>
        <Text style={styles.titulo}>Use no computador</Text>
        <Text style={styles.texto}>O {ferramenta} funciona no navegador do computador. Abra o app por lá para usá-lo.</Text>
      </View>
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    alignItems: 'center',
    gap: espaco[4],
    padding: espaco[8],
  },
  textos: {
    alignItems: 'center',
    gap: espaco[2],
  },
  titulo: {
    ...tipografia.h6,
    color: cores.primaria,
    textAlign: 'center',
  },
  texto: {
    ...tipografia.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
  },
});
