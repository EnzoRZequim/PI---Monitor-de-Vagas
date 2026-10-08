import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CartaoDetalhes } from '@/components/CartaoDetalhes';
import { cores, espaco } from '@/theme';

type Props = {
  nome: string;
  endereco: string;
  blocos: number;
  onEditar?: () => void;
  onExcluir?: () => void;
};

// Cartão de local na área do parceiro, com ações de editar e excluir ("Locais/Parceiro" no Figma)
export function CartaoLocalParceiro({ nome, endereco, blocos, onEditar, onExcluir }: Props) {
  return (
    <CartaoDetalhes titulo={nome} detalhes={[endereco, `${blocos} ${blocos === 1 ? 'Bloco' : 'Blocos'}`]}>
      <View style={styles.acoes}>
        <Pressable onPress={onEditar} accessibilityRole="button" accessibilityLabel={`Editar ${nome}`} hitSlop={8}>
          <Feather name="edit" size={22} color={cores.primaria} />
        </Pressable>
        <Pressable onPress={onExcluir} accessibilityRole="button" accessibilityLabel={`Excluir ${nome}`} hitSlop={8}>
          <Feather name="trash-2" size={22} color={cores.perigo} />
        </Pressable>
      </View>
    </CartaoDetalhes>
  );
}

const styles = StyleSheet.create({
  acoes: {
    flexDirection: 'row',
    gap: espaco[4],
  },
});
