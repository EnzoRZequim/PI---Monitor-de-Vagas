import { Redirect, Slot, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

import { consultarSessao } from '@/dados/autenticacao';

export default function LayoutAreaParceiro() {
  const caminho = usePathname();
  const [verificacao, setVerificacao] = useState<boolean>();

  useEffect(() => {
    let ativa = true;
    consultarSessao()
      .then(sessao => {
        if (ativa) setVerificacao(Boolean(sessao));
      })
      .catch(() => {
        if (ativa) setVerificacao(false);
      });
    return () => { ativa = false; };
  }, [caminho]);

  if (verificacao === undefined) return null;
  return verificacao ? <Slot /> : <Redirect href="/login" />;
}
