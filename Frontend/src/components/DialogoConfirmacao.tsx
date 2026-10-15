import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { BotaoIcone } from '@/components/BotaoIcone';
import { CaixaGradiente } from '@/components/CaixaGradiente';
import { cores, espaco, gradientes, raio, tipografia } from '@/theme';

type Props = {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  // Texto do botão que confirma (ex.: "Excluir")
  acao: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

// Pop-up que pede confirmação antes de uma ação destrutiva. O Figma não define este pop-up; segue o
// estilo dos cartões e botões do design system.
export function DialogoConfirmacao({ visivel, titulo, mensagem, acao, onConfirmar, onCancelar }: Props) {
  return (
    // Sem animação: ao fechar, quem usa limpa o item e o texto sumiria durante um fade
    <Modal visible={visivel} transparent animationType="none" onRequestClose={onCancelar}>
      <View style={styles.fundo}>
        {/* Clicar fora da caixa cancela */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancelar} accessibilityLabel="Cancelar" />

        <CaixaGradiente
          borda={gradientes.destaque.borda}
          fundo={cores.superficie}
          raio={raio.cartao}
          style={styles.caixa}
          estiloConteudo={styles.conteudo}
        >
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          <Text style={styles.mensagem}>{mensagem}</Text>

          <View style={styles.botoes}>
            <Botao tipo="secundario" titulo="Cancelar" onPress={onCancelar} />
            <BotaoIcone titulo={acao} icone="trash-2" onPress={onConfirmar} />
          </View>
        </CaixaGradiente>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco[4],
    backgroundColor: 'rgba(3, 11, 22, 0.45)',
  },
  caixa: {
    width: '100%',
    maxWidth: 440,
  },
  conteudo: {
    gap: espaco[4],
    padding: espaco[6],
  },
  titulo: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  mensagem: {
    ...tipografia.corpo,
    lineHeight: 22,
    color: cores.textoSecundario,
  },
  botoes: {
    marginTop: espaco[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco[4],
  },
});
