import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/botoes/Botao';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { EditorMapas } from '@/components/mapa/EditorMapas';
import { MonitorVagas } from '@/components/mapa/MonitorVagas';
import { MonitorVideo } from '@/components/mapa/MonitorVideo';
import { TelaParceiro } from '@/components/telas/TelaParceiro';
import { listarMapas, type ResumoMapaDoBackend } from '@/dados/api';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, tipografia } from '@/theme';

type Aba = 'editor' | 'monitor' | 'video';

const ABAS: { id: Aba; titulo: string }[] = [
  { id: 'editor', titulo: 'Editor de mapas' },
  { id: 'monitor', titulo: 'Monitor de vagas' },
  { id: 'video', titulo: 'Monitor de vídeo' },
];

// Mapas e IA: as ferramentas que antes ficavam no frontend-admin (editor de mapas, monitor de vagas
// e monitor de vídeo), agora dentro da área do parceiro. O ícone de mapa dos blocos abre aqui
// (?aba=monitor&mapa=<ID do mapa>&bloco=<nome>).
export default function TelaMapasEIA() {
  // local e blocoId: o bloco que abriu esta tela (ícone de mapa), ligado ao mapa analisado aqui
  const parametros = useLocalSearchParams<{ aba?: string; mapa?: string; bloco?: string; local?: string; blocoId?: string }>();
  const [aba, setAba] = useState<Aba>(ABAS.some((a) => a.id === parametros.aba) ? (parametros.aba as Aba) : 'editor');
  const [mapas, setMapas] = useState<ResumoMapaDoBackend[]>([]);
  const [erro, setErro] = useState('');

  const atualizarMapas = useCallback(async () => {
    try {
      setMapas(await listarMapas());
      setErro('');
    } catch {
      setErro('Não foi possível falar com o servidor. Confira se o backend está rodando.');
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    listarMapas()
      .then((lista) => ativo && setMapas(lista))
      .catch(() => ativo && setErro('Não foi possível falar com o servidor. Confira se o backend está rodando.'));
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <TelaParceiro
      secao="locais"
      tituloAba="Mapas e IA"
      titulo="Mapas e IA"
      subtitulo={parametros.bloco ? `${parametros.bloco}: mapa e análise das vagas` : 'Mapas das câmeras e análise das vagas'}
    >
      <View style={styles.abas} accessibilityRole="tablist">
        {ABAS.map((item) => (
          <Botao
            key={item.id}
            tipo="secundario"
            titulo={item.titulo}
            selecionado={aba === item.id}
            onPress={() => setAba(item.id)}
          />
        ))}
      </View>

      {erro !== '' && (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      )}

      {aba === 'editor' && <EditorMapas mapas={mapas} aoAtualizarMapas={atualizarMapas} />}
      {aba === 'monitor' && (
        <MonitorVagas
          mapas={mapas}
          mapaInicial={parametros.mapa}
          bloco={
            parametros.local && parametros.blocoId
              ? { campusId: parametros.local, blocoId: parametros.blocoId, nome: parametros.bloco ?? 'bloco' }
              : undefined
          }
        />
      )}
      {aba === 'video' && <MonitorVideo mapas={mapas} />}

      <View style={styles.rodape}>
        <BotaoIcone tipo="secundario" titulo="Voltar" icone="rotate-ccw" onPress={() => voltar('/area-parceiro/locais')} />
      </View>
    </TelaParceiro>
  );
}

const styles = StyleSheet.create({
  abas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco[3],
    marginBottom: espaco[8],
  },
  erro: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.perigo,
    marginBottom: espaco[6],
  },
  rodape: {
    marginTop: espaco[10],
    alignItems: 'flex-start',
  },
});
