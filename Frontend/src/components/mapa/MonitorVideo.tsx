import { SoNoComputador } from '@/components/mapa/SoNoComputador';
import type { ResumoMapaDoBackend } from '@/dados/api';

type Props = {
  mapas: ResumoMapaDoBackend[];
};

// No celular: o monitor de verdade está em MonitorVideo.web.tsx (depende do vídeo e do canvas do navegador)
export function MonitorVideo(_props: Props) {
  return <SoNoComputador ferramenta="Monitor de vídeo" />;
}
