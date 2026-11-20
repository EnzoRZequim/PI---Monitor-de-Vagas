import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/botoes/Botao';
import { BotaoIcone } from '@/components/botoes/BotaoIcone';
import { CampoTexto } from '@/components/campos/CampoTexto';
import { CartaoBloco } from '@/components/cartoes/CartaoBloco';
import { DialogoConfirmacao } from '@/components/base/DialogoConfirmacao';
import { LinkAcao } from '@/components/botoes/LinkAcao';
import { ListaRolavel } from '@/components/base/ListaRolavel';
import { TelaParceiro } from '@/components/telas/TelaParceiro';
import { novoId, parceiroLogado, salvarLocal, type BlocoParceiro, type LocalParceiro } from '@/dados/areaParceiro';
import { ocupacaoDoBloco, useOcupacaoAoVivo, useOcupacaoReal } from '@/dados/ocupacaoAoVivo';
import { blocosDoCampus, buscarCampus, mapaDoBloco } from '@/dados/parceiros';
import { useTelaPequena } from '@/hooks/useTelaPequena';
import { voltar } from '@/rotas';
import { cores, espaco, fontes, tipografia } from '@/theme';

type NovoBloco = { nome: string; vagas: string };

// Cadastro e edição de local ("Novo local" no Figma). Sem `local`, cria um novo.
export function FormularioLocal({ local }: { local?: LocalParceiro }) {
  const telaPequena = useTelaPequena();
  const [nome, setNome] = useState(local?.nome ?? '');
  const [endereco, setEndereco] = useState(local?.endereco ?? '');
  const [blocos, setBlocos] = useState<BlocoParceiro[]>(local?.blocos ?? []);
  const [novoBloco, setNovoBloco] = useState<NovoBloco | null>(null);

  // Mesmo campus das listas públicas (o local tem o mesmo id): é dele que vem a ocupação analisada
  // pela IA. Enquanto o formulário está aberto, busca a ocupação real como as listas fazem.
  const campus = buscarCampus(parceiroLogado, local?.id);
  useOcupacaoAoVivo();
  useOcupacaoReal(blocosDoCampus(campus));

  // Total de vagas do bloco: o da análise da IA (o mesmo das caixinhas) quando o bloco tem mapa
  // analisado; senão, o do cadastro. Blocos novos, ainda não salvos, ficam com o do cadastro.
  function vagasDoBloco(bloco: BlocoParceiro) {
    const publico = campus?.blocos.find((b) => b.id === bloco.id);
    return campus && publico ? ocupacaoDoBloco(campus.id, publico).vagasTotais : bloco.vagasTotais;
  }

  // Erro do bloco em criação, mostrado logo abaixo dele
  const [erroBloco, setErroBloco] = useState('');
  // Erro do formulário, mostrado acima dos botões
  const [erro, setErro] = useState('');
  // Bloco aguardando confirmação no pop-up
  const [removendo, setRemovendo] = useState<BlocoParceiro | null>(null);

  const voltarParaLocais = () => voltar('/area-parceiro/locais');

  // Sugere a próxima letra (Bloco A, Bloco B...), que o parceiro pode trocar
  function abrirNovoBloco() {
    setNovoBloco({ nome: `Bloco ${String.fromCharCode(65 + (blocos.length % 26))}`, vagas: '' });
    setErroBloco('');
  }

  function alterarNovoBloco(mudanca: Partial<NovoBloco>) {
    if (novoBloco) setNovoBloco({ ...novoBloco, ...mudanca });
    setErroBloco('');
  }

  function cancelarNovoBloco() {
    setNovoBloco(null);
    setErroBloco('');
  }

  function adicionarBloco() {
    if (!novoBloco) return;
    const nomeBloco = novoBloco.nome.trim();
    const vagas = Number(novoBloco.vagas);

    if (!nomeBloco) return setErroBloco('Informe o nome do bloco.');
    if (!novoBloco.vagas) return setErroBloco('Informe o número de vagas do bloco.');
    if (!Number.isInteger(vagas) || vagas <= 0) return setErroBloco('O bloco precisa ter ao menos 1 vaga.');

    setBlocos([...blocos, { id: novoId('bloco'), nome: nomeBloco, vagasOcupadas: 0, vagasTotais: vagas, ativo: true }]);
    cancelarNovoBloco();
    setErro('');
  }

  function alterarBloco(id: string, mudanca: Partial<BlocoParceiro>) {
    setBlocos((atual) => atual.map((bloco) => (bloco.id === id ? { ...bloco, ...mudanca } : bloco)));
  }

  function confirmarRemocao() {
    if (removendo) setBlocos((atual) => atual.filter((bloco) => bloco.id !== removendo.id));
    setRemovendo(null);
  }

  function enviar() {
    if (!nome.trim()) return setErro('Informe o nome do local.');
    if (!endereco.trim()) return setErro('Informe o endereço do local.');
    if (blocos.length === 0) return setErro('Adicione ao menos um bloco monitorado.');

    salvarLocal({
      ...(local ?? { id: novoId('local'), camerasAtivas: 0, camerasTotais: 0 }),
      nome: nome.trim(),
      endereco: endereco.trim(),
      blocos,
    });
    voltarParaLocais();
  }

  const cartoesBlocos = blocos.map((bloco) => (
    <CartaoBloco
      key={bloco.id}
      nome={bloco.nome}
      vagas={vagasDoBloco(bloco)}
      ativo={bloco.ativo}
      onChangeAtivo={(ativo) => alterarBloco(bloco.id, { ativo })}
      onRemover={() => setRemovendo(bloco)}
      // Abre Mapas e IA na aba Monitor de vagas, já no mapa do bloco se ele tiver um. A análise feita
      // lá liga o bloco ao mapa e atualiza os cartões. O formulário fica embaixo na pilha de telas e
      // volta como estava pelo "Voltar"
      onMapa={() =>
        router.push({
          pathname: '/area-parceiro/mapas',
          params: {
            aba: 'monitor',
            mapa: mapaDoBloco(local?.id, bloco.id) ?? bloco.mapaId ?? '',
            bloco: bloco.nome,
            local: local?.id ?? '',
            blocoId: bloco.id,
          },
        })
      }
    />
  ));

  let subtitulo = 'Cadastre local e blocos';
  if (local) subtitulo = telaPequena ? 'Edite as informações' : 'Altere os dados e os blocos do local.';

  return (
    <TelaParceiro
      secao="locais"
      tituloAba={local ? 'Editar local' : 'Novo local'}
      titulo={local ? 'Editar local' : 'Novo local'}
      subtitulo={subtitulo}
    >
      {/* No celular as colunas viram uma pilha só, como no Figma */}
      <View style={telaPequena ? celular.pilha : styles.colunas}>
        <View style={telaPequena ? celular.pilha : styles.coluna}>
          <View style={[styles.campo, telaPequena && celular.campo]}>
            <Text style={styles.rotulo}>Nome</Text>
            <CampoTexto value={nome} onChangeText={setNome} placeholder="Ex: FMABC" accessibilityLabel="Nome" />
          </View>
          <View style={[styles.campo, telaPequena && celular.campo]}>
            <Text style={styles.rotulo}>Endereço</Text>
            <CampoTexto
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Rua, número, bairro..."
              accessibilityLabel="Endereço"
              autoComplete="street-address"
            />
          </View>
        </View>

        <View style={telaPequena ? celular.secaoBlocos : [styles.coluna, styles.campo]}>
          <View style={[styles.cabecalhoBlocos, telaPequena && celular.cabecalhoBlocos]}>
            <Text style={[styles.rotulo, telaPequena && celular.rotuloBlocos]}>Blocos monitorados</Text>
            <LinkAcao titulo="+ adicionar bloco" onPress={abrirNovoBloco} />
          </View>

          {telaPequena ? (
            blocos.length > 0 && (
              <ListaRolavel
                alturaMaxima={ALTURA_LISTA_BLOCOS}
                espacoItens={espaco[2]}
                espacoBarra={ESPACO_BARRA_BLOCOS}
              >
                {cartoesBlocos}
              </ListaRolavel>
            )
          ) : (
            cartoesBlocos
          )}

          {novoBloco && (
            <View style={styles.novoBloco}>
              <CampoTexto
                value={novoBloco.nome}
                onChangeText={(texto) => alterarNovoBloco({ nome: texto })}
                placeholder="Nome do bloco"
                accessibilityLabel="Nome do bloco"
                autoFocus
                style={styles.nomeBloco}
              />
              <CampoTexto
                value={novoBloco.vagas}
                onChangeText={(texto) => alterarNovoBloco({ vagas: texto.replace(/\D/g, '') })}
                placeholder="Vagas"
                accessibilityLabel="Quantidade de vagas"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={adicionarBloco}
                style={styles.vagasBloco}
              />
              <Botao titulo="Adicionar" onPress={adicionarBloco} />
              <Pressable
                onPress={cancelarNovoBloco}
                accessibilityRole="button"
                accessibilityLabel="Cancelar novo bloco"
                hitSlop={8}
              >
                <Feather name="x" size={22} color={cores.textoSuave} />
              </Pressable>
            </View>
          )}

          {erroBloco !== '' && (
            <Text style={styles.erroBloco} accessibilityRole="alert">
              {erroBloco}
            </Text>
          )}

          {blocos.length === 0 && !novoBloco && (
            <Text style={styles.vazio}>{'Nenhum bloco ainda. Use "+ adicionar bloco".'}</Text>
          )}
        </View>
      </View>

      {erro !== '' && <Text style={[styles.erro, telaPequena && celular.separado]}>{erro}</Text>}

      <View style={[styles.botoes, telaPequena && celular.separado]}>
        <BotaoIcone tipo="secundario" titulo="Voltar" icone="rotate-ccw" onPress={voltarParaLocais} />
        <BotaoIcone titulo="Enviar" icone="send" onPress={enviar} />
      </View>

      <DialogoConfirmacao
        visivel={removendo !== null}
        titulo={`Excluir ${removendo?.nome ?? 'bloco'}?`}
        mensagem={'Tem certeza que deseja excluir este bloco? A exclusão só é salva ao clicar em "Excluir".'}
        acao="Excluir"
        onConfirmar={confirmarRemocao}
        onCancelar={() => setRemovendo(null)}
      />
    </TelaParceiro>
  );
}

const styles = StyleSheet.create({
  colunas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco[12],
  },
  coluna: {
    flex: 1,
    gap: espaco[8],
  },
  campo: {
    gap: espaco[3],
  },
  rotulo: {
    ...tipografia.h6,
    color: cores.primaria,
  },
  cabecalhoBlocos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaco[2],
  },
  novoBloco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
  },
  nomeBloco: {
    flex: 1,
  },
  vagasBloco: {
    width: 100,
  },
  vazio: {
    ...tipografia.corpo,
    color: cores.textoSuave,
  },
  erro: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
    color: cores.perigo,
    marginTop: espaco[8],
  },
  erroBloco: {
    ...tipografia.pequeno,
    fontFamily: fontes.inter.medio,
    color: cores.perigo,
    // Cola na linha do bloco, compensando o gap da coluna
    marginTop: -espaco[1],
  },
  botoes: {
    marginTop: espaco[10],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

// Valores do Figma ("Novo local" e "Editar local", 393px)
const ESPACO_SECOES = 28;
// A lista mostra pouco mais de 3 blocos e rola o resto
const ALTURA_LISTA_BLOCOS = 215;
const ESPACO_BARRA_BLOCOS = 10;

const celular = StyleSheet.create({
  // Nome, Endereço, Blocos e botões, um embaixo do outro
  pilha: {
    gap: ESPACO_SECOES,
  },
  campo: {
    gap: espaco[2],
  },
  secaoBlocos: {
    gap: espaco[4],
  },
  // Título em duas linhas e "+ adicionar bloco" sempre ao lado
  cabecalhoBlocos: {
    flexWrap: 'nowrap',
  },
  rotuloBlocos: {
    width: 150,
  },
  separado: {
    marginTop: ESPACO_SECOES,
  },
});
