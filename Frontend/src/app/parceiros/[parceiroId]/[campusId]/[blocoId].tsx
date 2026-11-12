import { useLocalSearchParams } from 'expo-router';

import { LocalNaoEncontrado } from '@/components/telas/LocalNaoEncontrado';
import { TelaMapa } from '@/components/telas/TelaMapa';
import { plantaDoBloco, useSimulacaoAoVivo, useVagasOcupadas } from '@/dados/ocupacaoAoVivo';
import { buscarCampus, buscarParceiro, type Bloco, type Campus } from '@/dados/parceiros';
import { rotaDoCampus } from '@/rotas';

export default function TelaBloco() {
  const { parceiroId, campusId, blocoId } = useLocalSearchParams<{
    parceiroId: string;
    campusId: string;
    blocoId: string;
  }>();
  const parceiro = buscarParceiro(parceiroId);
  const campus = buscarCampus(parceiro, campusId);
  const bloco = campus?.blocos.find((b) => b.id === blocoId);

  if (!parceiro || !campus || !bloco) return <LocalNaoEncontrado />;

  return <MapaDoBloco parceiroId={parceiro.id} campus={campus} bloco={bloco} />;
}

// Separado da rota para os hooks só rodarem quando o bloco existe
function MapaDoBloco({ parceiroId, campus, bloco }: { parceiroId: string; campus: Campus; bloco: Bloco }) {
  useSimulacaoAoVivo(campus.id, bloco);
  const ocupadas = useVagasOcupadas(campus.id, bloco);

  return (
    <TelaMapa
      titulo={bloco.nome}
      subtitulo={campus.nome}
      planta={plantaDoBloco(campus.id, bloco)}
      ocupadas={ocupadas}
      voltarPara={rotaDoCampus(parceiroId, campus.id)}
    />
  );
}
