import { useWindowDimensions } from 'react-native';

import { larguras } from '@/theme';

// Abaixo da largura "md" do Figma as telas usam o layout de celular. Recalcula ao girar o aparelho
// ou redimensionar a janela do navegador.
export function useTelaPequena() {
  const { width } = useWindowDimensions();
  return width < larguras.md;
}
