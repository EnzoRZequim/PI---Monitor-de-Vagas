import { router } from 'expo-router';

import { CartaoLocal } from '@/components/CartaoLocal';
import { TelaLista } from '@/components/TelaLista';
import { ocupacaoDoParceiro, parceiros, type Parceiro } from '@/dados/parceiros';
import { rotaDoParceiro } from '@/rotas';

const chave = (p: Parceiro) => p.id;
const textoBusca = (p: Parceiro) => p.nome;

export default function TelaParceiros() {
  return (
    <TelaLista
      titulo="Nossos parceiros"
      placeholderBusca="Buscar parceiro"
      itens={parceiros}
      chave={chave}
      textoBusca={textoBusca}
      voltarPara="/"
      renderItem={(parceiro) => (
        <CartaoLocal
          nome={parceiro.nome}
          {...ocupacaoDoParceiro(parceiro)}
          onPress={() => router.push(rotaDoParceiro(parceiro))}
        />
      )}
    />
  );
}
