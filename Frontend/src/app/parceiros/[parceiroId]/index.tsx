import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { CartaoLocal } from '@/components/cartoes/CartaoLocal';
import { LocalNaoEncontrado } from '@/components/telas/LocalNaoEncontrado';
import { TelaLista } from '@/components/telas/TelaLista';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { buscarParceiro, ocupacaoDoCampus, type Campus } from '@/dados/parceiros';
import { rotaDoCampus } from '@/rotas';

const chave = (c: Campus) => c.id;
const textoBusca = (c: Campus) => c.nome;

export default function TelaLocais() {
  const { parceiroId } = useLocalSearchParams<{ parceiroId: string }>();
  const parceiro = buscarParceiro(parceiroId);
  const telaPequena = useTelaPequena();

  if (!parceiro) return <LocalNaoEncontrado />;

  // Com um único campus não há o que escolher: segue direto para os blocos
  if (parceiro.campi.length === 1) {
    return <Redirect href={rotaDoCampus(parceiro.id, parceiro.campi[0].id)} />;
  }

  return (
    <TelaLista
      // Nome usado no Figma (celular)
      titulo={telaPequena ? 'Locais registrados' : 'Campus registrados'}
      subtitulo={parceiro.nome}
      placeholderBusca="Buscar local"
      itens={parceiro.campi}
      chave={chave}
      textoBusca={textoBusca}
      voltarPara="/parceiros"
      renderItem={(campus) => (
        <CartaoLocal
          nome={campus.nome}
          {...ocupacaoDoCampus(campus)}
          onPress={() => router.push(rotaDoCampus(parceiro.id, campus.id))}
        />
      )}
    />
  );
}
