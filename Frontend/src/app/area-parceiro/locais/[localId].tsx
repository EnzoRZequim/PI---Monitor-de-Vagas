import { Redirect, useLocalSearchParams } from 'expo-router';

import { FormularioLocal } from '@/components/FormularioLocal';
import { useLocaisParceiro } from '@/dados/areaParceiro';

export default function TelaEditarLocal() {
  const { localId } = useLocalSearchParams<{ localId: string }>();
  const local = useLocaisParceiro().find((l) => l.id === localId);

  // Local removido ou URL inválida: volta para a lista
  if (!local) return <Redirect href="/area-parceiro/locais" />;

  // A key recria o formulário (e o estado dele) se a URL mudar para outro local
  return <FormularioLocal key={local.id} local={local} />;
}
