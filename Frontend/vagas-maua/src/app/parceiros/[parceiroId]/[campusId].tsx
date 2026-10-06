import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { CartaoLocal } from '@/components/CartaoLocal';
import { LocalNaoEncontrado } from '@/components/LocalNaoEncontrado';
import { TelaLista } from '@/components/TelaLista';
import { buscarCampus, buscarParceiro, type Bloco } from '@/dados/parceiros';
import { salvarUltimoLocal } from '@/dados/ultimoLocal';
import { rotaDoParceiro } from '@/rotas';

const chave = (b: Bloco) => b.id;
const textoBusca = (b: Bloco) => b.nome;

export default function TelaBlocos() {
  const { parceiroId, campusId } = useLocalSearchParams<{ parceiroId: string; campusId: string }>();
  const parceiro = buscarParceiro(parceiroId);
  const campus = buscarCampus(parceiro, campusId);

  // Abrir os blocos de um campus o registra como "Último local visitado" na tela inicial
  useEffect(() => {
    if (parceiro && campus) salvarUltimoLocal({ parceiroId: parceiro.id, campusId: campus.id });
  }, [parceiro, campus]);

  if (!parceiro || !campus) return <LocalNaoEncontrado />;

  return (
    <TelaLista
      titulo={campus.nome}
      placeholderBusca="Buscar bloco"
      itens={campus.blocos}
      chave={chave}
      textoBusca={textoBusca}
      // Sem histórico, volta para a lista de locais (ou de parceiros, se só houver um campus)
      voltarPara={parceiro.campi.length > 1 ? rotaDoParceiro(parceiro) : '/parceiros'}
      colunas={3}
      renderItem={(bloco) => (
        <CartaoLocal
          nome={bloco.nome}
          vagasOcupadas={bloco.vagasOcupadas}
          vagasTotais={bloco.vagasTotais}
          mostrarBarra
        />
      )}
    />
  );
}
