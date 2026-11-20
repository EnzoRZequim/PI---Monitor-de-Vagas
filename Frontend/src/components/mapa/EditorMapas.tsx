import { SoNoComputador } from '@/components/mapa/SoNoComputador';
import type { ResumoMapaDoBackend } from '@/dados/api';

type Props = {
  mapas: ResumoMapaDoBackend[];
  aoAtualizarMapas: () => Promise<void>;
};

// No celular: o editor de verdade está em EditorMapas.web.tsx (depende do SVG do navegador)
export function EditorMapas(_props: Props) {
  return <SoNoComputador ferramenta="Editor de mapas" />;
}
