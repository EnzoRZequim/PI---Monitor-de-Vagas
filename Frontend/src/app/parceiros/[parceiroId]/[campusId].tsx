import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { CartaoLocal } from '@/components/cartoes/CartaoLocal';
import { LocalNaoEncontrado } from '@/components/telas/LocalNaoEncontrado';
import { TelaLista } from '@/components/telas/TelaLista';
import { buscarCampus, buscarParceiro, type Bloco } from '@/dados/parceiros';
import { salvarUltimoLocal } from '@/dados/ultimoLocal';
import { rotaDoParceiro } from '@/rotas';

// Valores do Figma (celular): lista de 320px que rola, 19px entre os cartões e 8px até a barra
const LISTA_BLOCOS = { alturaMaxima: 320, espacoItens: 19, espacoBarra: 8 };

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
      // No celular o título fica à esquerda, como no Figma
      tituloEsquerda
      listaRolavel={LISTA_BLOCOS}
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
