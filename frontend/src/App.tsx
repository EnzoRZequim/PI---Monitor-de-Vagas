import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { buscarMapa, criarMapa, listarMapas, salvarVagas } from "./api";
import { EditorVagas } from "./EditorVagas";
import type { Mapa, Ponto, ResumoMapa, Vaga } from "./tipos";
import "./App.css";

const ID_VALIDO = /^[a-zA-Z0-9-]+$/;

function textoDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}

export default function App() {
  const [mapas, setMapas] = useState<ResumoMapa[]>([]);
  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [selecionadaID, setSelecionadaID] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Ponto[] | null>(null);
  const [alterado, setAlterado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [novoID, setNovoID] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [chaveArquivo, setChaveArquivo] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    listarMapas()
      .then(setMapas)
      .catch((erro: unknown) => setMensagem(textoDoErro(erro)));
  }, []);

  useEffect(() => {
    if (!alterado) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [alterado]);

  async function atualizarLista() {
    try {
      setMapas(await listarMapas());
    } catch (erro) {
      setMensagem(textoDoErro(erro));
    }
  }

  function confirmarDescarte(): boolean {
    return !alterado || confirm("Descartar alterações não salvas?");
  }

  function abrirMapa(dados: Mapa) {
    setMapa(dados);
    setVagas(structuredClone(dados.Vagas));
    setSelecionadaID(null);
    setRascunho(null);
    setAlterado(false);
  }

  async function abrirExistente(id: string) {
    if (!id || !confirmarDescarte()) return;

    try {
      const dados = await buscarMapa(id);
      abrirMapa(dados);
      setMensagem(`${dados.Nome}: ${dados.Vagas.length} vaga(s). Clique em "Nova vaga" para desenhar.`);
    } catch (erro) {
      setMensagem(textoDoErro(erro));
    }
  }

  async function aoCriar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const id = novoID.trim();
    const nome = novoNome.trim();

    if (!ID_VALIDO.test(id)) return setMensagem("ID inválido. Use letras, números e hífens.");
    if (!nome) return setMensagem("Informe o nome do mapa.");
    if (!novaImagem) return setMensagem("Selecione uma imagem JPG ou PNG.");
    if (!confirmarDescarte()) return;

    const dados = new FormData();
    dados.append("ID", id);
    dados.append("Nome", nome);
    dados.append("Imagem", novaImagem);

    setOcupado(true);

    try {
      const criado = await criarMapa(dados);
      abrirMapa(criado);
      setMensagem(`Mapa "${criado.Nome}" criado. Clique em "Nova vaga" para desenhar.`);
      setNovoID("");
      setNovoNome("");
      setNovaImagem(null);
      setChaveArquivo((chave) => chave + 1);
      await atualizarLista();
    } catch (erro) {
      setMensagem(textoDoErro(erro));
    } finally {
      setOcupado(false);
    }
  }

  function iniciarDesenho() {
    if (!mapa) return setMensagem("Abra ou crie um mapa primeiro.");
    setRascunho([]);
    setSelecionadaID(null);
    setMensagem("Clique nos 4 cantos da vaga.");
  }

  function cancelarDesenho() {
    setRascunho(null);
    setMensagem("Desenho cancelado.");
  }

  function adicionarPonto(ponto: Ponto) {
    if (!rascunho) return;

    const pontos = [...rascunho, ponto];

    if (pontos.length < 4) {
      setRascunho(pontos);
      setMensagem(`${pontos.length} de 4 pontos.`);
      return;
    }

    const vaga: Vaga = {
      ID: `vaga-${crypto.randomUUID()}`,
      Nome: `A${vagas.length + 1}`,
      Pontos: pontos
    };

    setVagas([...vagas, vaga]);
    setRascunho(null);
    setSelecionadaID(vaga.ID);
    setAlterado(true);
    setMensagem(`${vaga.Nome} criada. Renomeie se quiser e clique em "Salvar vagas".`);
  }

  function moverPonto(id: string, indice: number, ponto: Ponto) {
    setVagas((atual) =>
      atual.map((vaga) =>
        vaga.ID === id
          ? { ...vaga, Pontos: vaga.Pontos.map((p, i) => (i === indice ? ponto : p)) }
          : vaga
      )
    );
    setAlterado(true);
  }

  function renomearSelecionada(nome: string) {
    setVagas((atual) =>
      atual.map((vaga) => (vaga.ID === selecionadaID ? { ...vaga, Nome: nome } : vaga))
    );
    setAlterado(true);
  }

  function excluirSelecionada() {
    if (!selecionadaID) return setMensagem("Selecione uma vaga primeiro.");
    setVagas((atual) => atual.filter((vaga) => vaga.ID !== selecionadaID));
    setSelecionadaID(null);
    setAlterado(true);
    setMensagem('Vaga excluída localmente. Clique em "Salvar vagas" para salvar.');
  }

  async function salvar() {
    if (!mapa) return setMensagem("Abra ou crie um mapa primeiro.");
    if (rascunho) return setMensagem("Conclua ou cancele o desenho antes de salvar.");
    if (vagas.some((vaga) => !vaga.Nome.trim())) return setMensagem("Toda vaga precisa de um nome.");

    try {
      const atualizado = await salvarVagas(mapa.ID, vagas);
      setMapa(atualizado);
      setVagas(structuredClone(atualizado.Vagas));
      setAlterado(false);
      setMensagem(`${atualizado.Vagas.length} vaga(s) salva(s).`);
      await atualizarLista();
    } catch (erro) {
      setMensagem(textoDoErro(erro));
    }
  }

  const selecionada = vagas.find((vaga) => vaga.ID === selecionadaID);

  return (
    <main className="app">
      <h1>Mapeamento de vagas</h1>

      <section className="paineis">
        <div className="painel">
          <h2>Abrir mapa existente</h2>
          <select
            value={mapa?.ID ?? ""}
            onChange={(evento) => void abrirExistente(evento.target.value)}
          >
            <option value="" disabled>
              {mapas.length ? "Selecione um mapa" : "Nenhum mapa cadastrado"}
            </option>
            {mapas.map((item) => (
              <option key={item.ID} value={item.ID}>
                {item.Nome} ({item.QuantidadeVagas} vagas)
              </option>
            ))}
          </select>
        </div>

        <form className="painel" onSubmit={(evento) => void aoCriar(evento)}>
          <h2>Novo mapa a partir de uma imagem</h2>
          <input
            placeholder="ID (ex.: estacionamento-02)"
            value={novoID}
            onChange={(evento) => setNovoID(evento.target.value)}
          />
          <input
            placeholder="Nome (ex.: Estacionamento 02)"
            value={novoNome}
            onChange={(evento) => setNovoNome(evento.target.value)}
          />
          <input
            key={chaveArquivo}
            type="file"
            accept="image/jpeg,image/png"
            onChange={(evento) => setNovaImagem(evento.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={ocupado}>
            {ocupado ? "Criando..." : "Criar mapa"}
          </button>
        </form>
      </section>

      <p className="mensagem">{mensagem}</p>

      {mapa ? (
        <>
          <div className="controles">
            <button onClick={iniciarDesenho}>Nova vaga</button>
            <button onClick={cancelarDesenho} disabled={!rascunho}>
              Cancelar desenho
            </button>
            <button onClick={excluirSelecionada} disabled={!selecionada}>
              Excluir selecionada
            </button>
            <button onClick={() => void salvar()} disabled={!alterado}>
              Salvar vagas
            </button>
            {selecionada && (
              <input
                aria-label="Nome da vaga selecionada"
                value={selecionada.Nome}
                onChange={(evento) => renomearSelecionada(evento.target.value)}
              />
            )}
          </div>

          <div className="area">
            <EditorVagas
              mapa={mapa}
              vagas={vagas}
              selecionadaID={selecionadaID}
              rascunho={rascunho}
              aoSelecionar={setSelecionadaID}
              aoMoverPonto={moverPonto}
              aoAdicionarPonto={adicionarPonto}
            />
          </div>
        </>
      ) : (
        <p>Abra um mapa existente ou crie um novo a partir de uma imagem.</p>
      )}
    </main>
  );
}