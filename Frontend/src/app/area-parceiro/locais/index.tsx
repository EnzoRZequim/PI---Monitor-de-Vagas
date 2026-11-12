import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BotaoCircular } from '@/components/botoes/BotaoCircular';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { CartaoLocalParceiro } from '@/components/cartoes/CartaoLocalParceiro';
import { DialogoConfirmacao } from '@/components/base/DialogoConfirmacao';
import { TelaParceiro } from '@/components/telas/TelaParceiro';
import { removerLocal, useLocaisParceiro, type LocalParceiro } from '@/dados/areaParceiro';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { rotaDoLocalParceiro } from '@/rotas';
import { cores, espaco, tipografia } from '@/theme';

// Locais do parceiro com editar e excluir ("Seus locais" no Figma)
export default function TelaLocaisParceiro() {
  const locais = useLocaisParceiro();
  const telaPequena = useTelaPequena();
  // Local aguardando confirmação no pop-up
  const [excluindo, setExcluindo] = useState<LocalParceiro | null>(null);

  const novoLocal = () => router.push('/area-parceiro/locais/novo');

  function confirmarExclusao() {
    if (excluindo) removerLocal(excluindo.id);
    setExcluindo(null);
  }

  return (
    <TelaParceiro
      secao="locais"
      tituloAba="Seus locais"
      titulo="Seus locais"
      subtitulo="Adicione, edite ou remova."
      // No celular o "Novo local" vira o botão circular "+" do Figma
      acao={!telaPequena && <BotaoIcone titulo="Novo local" icone="plus" onPress={novoLocal} />}
      acaoFlutuante={<BotaoCircular icone="plus" rotulo="Novo local" onPress={novoLocal} />}
      espacoTitulo={38}
    >
      {locais.length > 0 ? (
        <View style={telaPequena ? celular.lista : styles.grade}>
          {locais.map((local) => (
            <View key={local.id} style={telaPequena ? undefined : [styles.celula, styles.celulaDesktop]}>
              <CartaoLocalParceiro
                nome={local.nome}
                endereco={local.endereco}
                blocos={local.blocos.length}
                onEditar={() => router.push(rotaDoLocalParceiro(local.id))}
                onExcluir={() => setExcluindo(local)}
              />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.vazio}>
          {`Nenhum local cadastrado. Clique em "${telaPequena ? '+' : 'Novo local'}" para começar.`}
        </Text>
      )}

      <DialogoConfirmacao
        visivel={excluindo !== null}
        titulo={`Excluir ${excluindo?.nome ?? 'local'}?`}
        mensagem="Tem certeza que deseja excluir este local? Ele e todos os seus blocos deixarão de ser monitorados."
        acao="Excluir"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluindo(null)}
      />
    </TelaParceiro>
  );
}

const styles = StyleSheet.create({
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -espaco[2],
  },
  celula: {
    width: '100%',
    padding: espaco[2],
  },
  celulaDesktop: {
    width: '50%',
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
  },
});

const celular = StyleSheet.create({
  // Figma: 12px entre os cartões
  lista: {
    gap: espaco[3],
  },
});
