import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { Interruptor } from '@/components/Interruptor';
import { cores, espaco, fontes, gradientes, raio, tipografia } from '@/theme';

type Props = {
  nome: string;
  vagas: number;
  onRemover?: () => void;
  // Com onChangeAtivo, mostra o liga/desliga (variante "Bloco edit" do Figma)
  ativo?: boolean;
  onChangeAtivo?: (ativo: boolean) => void;
};

// Linha de bloco na edição de um local ("Locais" no Figma)
export function CartaoBloco({ nome, vagas, onRemover, ativo = false, onChangeAtivo }: Props) {
  return (
    <CaixaGradiente
      borda={gradientes.neutro.borda}
      fundo={cores.superficie}
      raio={raio.cartao}
      estiloConteudo={styles.conteudo}
    >
      <View style={styles.textos}>
        <Text style={styles.nome} numberOfLines={1}>
          {nome}
        </Text>
        <Text style={styles.vagas}>{vagas} Vagas</Text>
      </View>

      <View style={styles.acoes}>
        {onChangeAtivo && <Interruptor ativo={ativo} onChange={onChangeAtivo} rotulo={`Ativar ${nome}`} />}
        <Pressable onPress={onRemover} accessibilityRole="button" accessibilityLabel={`Remover ${nome}`} hitSlop={8}>
          <Feather name="x" size={22} color={cores.perigo} />
        </Pressable>
      </View>
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: espaco[4],
    paddingVertical: 18,
  },
  textos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: espaco[6],
  },
  nome: {
    ...tipografia.corpo,
    flexShrink: 1,
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
  },
  vagas: {
    ...tipografia.corpo,
    color: cores.textoSuave,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[4],
  },
});
