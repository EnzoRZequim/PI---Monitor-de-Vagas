
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  buscarMapa,
  criarMapa,
  detectarVagas,
  listarMapas,
  salvarVagas
} from "./api";

import { EditorVagas } from "./EditorVagas";
import { MonitorVagas } from "./MonitorVagas";
import MonitorVideo from "./MonitorVideo";
import { temaPainel } from "./temaPainel";

import type { Mapa, Ponto, ResumoMapa, Vaga } from "./tipos";

import "./App.css";
import "./temaPainel.css";

const ID_VALIDO = /^[a-zA-Z0-9-]+$/;

type Aba = "editor" | "monitor" | "monitor-video";
type TipoMensagem = "sucesso" | "erro" | "info";

function textoDoErro(erro: unknown): string {
  return erro instanceof Error
    ? erro.message
    : "Ocorreu um erro inesperado.";
}

export default function App() {
  const [aba, setAba] = useState<Aba>("editor");

  const [mapas, setMapas] = useState<ResumoMapa[]>([]);
  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [vagas, setVagas] = useState<Vaga[]>([]);

  const [selecionadaID, setSelecionadaID] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Ponto[] | null>(null);

  const [criandoVagasIA, setCriandoVagasIA] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const [alterado, setAlterado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] =
    useState<TipoMensagem>("info");

  const [novoID, setNovoID] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [chaveArquivo, setChaveArquivo] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  const iniciarDesenhoRef = useRef<() => void>(() => {});

  const processando =
    ocupado || criandoVagasIA || salvando || carregandoMapa;

  const selecionada = vagas.find(
    (vaga) => vaga.ID === selecionadaID
  );

  const quantidadeVagas = vagas.length;

  function mostrarMensagem(
    texto: string,
    tipo: TipoMensagem = "info"
  ) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  useEffect(() => {
    iniciarDesenhoRef.current = iniciarDesenho;
  });

  useEffect(() => {
    let ativo = true;

    listarMapas()
      .then((dados) => {
        if (ativo) setMapas(dados);
      })
      .catch((erro: unknown) => {
        if (ativo) {
          setMensagem(textoDoErro(erro));
          setTipoMensagem("erro");
        }
      })
      .finally(() => {
        if (ativo) setCarregandoLista(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!alterado) return;

    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
    };

    window.addEventListener("beforeunload", avisar);

    return () => {
      window.removeEventListener("beforeunload", avisar);
    };
  }, [alterado]);

  async function atualizarLista() {
    try {
      const lista = await listarMapas();
      setMapas(lista);
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro), "erro");
    }
  }

  function confirmarDescarte(): boolean {
    return (
      !alterado ||
      window.confirm("Descartar alterações não salvas?")
    );
  }

  function abrirMapa(dados: Mapa) {
    setMapa(dados);
    setVagas(structuredClone(dados.Vagas));
    setSelecionadaID(null);
    setRascunho(null);
    setAlterado(false);
  }

  async function abrirExistente(id: string) {
    if (!id || processando) return;
    if (!confirmarDescarte()) return;

    setCarregandoMapa(true);
    mostrarMensagem("Carregando mapa selecionado...");

    try {
      const dados = await buscarMapa(id);

      abrirMapa(dados);

      mostrarMensagem(
        `${dados.Nome}: ${dados.Vagas.length} vaga(s) carregada(s).`,
        "sucesso"
      );
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro), "erro");
    } finally {
      setCarregandoMapa(false);
    }
  }

  async function aoCriar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (processando) return;

    const id = novoID.trim();
    const nome = novoNome.trim();

    if (!ID_VALIDO.test(id)) {
      mostrarMensagem(
        "ID inválido. Use letras, números e hífens.",
        "erro"
      );
      return;
    }

    if (!nome) {
      mostrarMensagem("Informe o nome do mapa.", "erro");
      return;
    }

    if (!novaImagem) {
      mostrarMensagem(
        "Selecione uma imagem JPG ou PNG.",
        "erro"
      );
      return;
    }

    if (!confirmarDescarte()) return;

    const dados = new FormData();
    dados.append("ID", id);
    dados.append("Nome", nome);
    dados.append("Imagem", novaImagem);

    setOcupado(true);
    mostrarMensagem("Criando novo mapa...");

    try {
      const criado = await criarMapa(dados);

      abrirMapa(criado);

      setNovoID("");
      setNovoNome("");
      setNovaImagem(null);
      setChaveArquivo((chave) => chave + 1);

      await atualizarLista();

      mostrarMensagem(
        `Mapa "${criado.Nome}" criado com sucesso.`,
        "sucesso"
      );
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro), "erro");
    } finally {
      setOcupado(false);
    }
  }

  function iniciarDesenho() {
    if (processando) return;

    if (!mapa) {
      mostrarMensagem(
        "Abra ou crie um mapa primeiro.",
        "erro"
      );
      return;
    }

    setRascunho([]);
    setSelecionadaID(null);

    mostrarMensagem(
      "Modo de desenho ativado. Clique nos 4 cantos da vaga."
    );
  }

  async function criarVagasIA() {
    if (!mapa || processando) return;

    if (
      vagas.length > 0 &&
      !window.confirm(
        "Substituir as vagas atuais pelas vagas detectadas pela IA?"
      )
    ) {
      return;
    }

    const idMapa = mapa.ID;

    setCriandoVagasIA(true);

    mostrarMensagem(
      "A inteligência artificial está identificando as vagas..."
    );

    try {
      const resultado = await detectarVagas(idMapa);

      const novasVagas: Vaga[] = resultado.Vagas.map(
        (vaga, indice) => ({
          ID: `vaga-${crypto.randomUUID()}`,
          Nome: `A${indice + 1}`,
          Pontos: vaga.Pontos
        })
      );

      setVagas(novasVagas);
      setSelecionadaID(null);
      setRascunho(null);
      setAlterado(true);

      mostrarMensagem(
        `${novasVagas.length} vaga(s) detectada(s). ` +
          'Revise os resultados e clique em "Salvar vagas".',
        "sucesso"
      );
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro), "erro");
    } finally {
      setCriandoVagasIA(false);
    }
  }

  function cancelarDesenho() {
    if (processando) return;

    setRascunho(null);
    mostrarMensagem("Desenho cancelado.");
  }

  function adicionarPonto(ponto: Ponto) {
    if (!rascunho || processando) return;

    const pontos = [...rascunho, ponto];

    if (pontos.length < 4) {
      setRascunho(pontos);

      mostrarMensagem(
        `${pontos.length} de 4 pontos selecionados.`
      );
      return;
    }

    const vaga: Vaga = {
      ID: `vaga-${crypto.randomUUID()}`,
      Nome: `A${vagas.length + 1}`,
      Pontos: pontos
    };

    setVagas((atual) => [...atual, vaga]);
    setRascunho(null);
    setSelecionadaID(vaga.ID);
    setAlterado(true);

    mostrarMensagem(
      `${vaga.Nome} criada com sucesso.`,
      "sucesso"
    );
  }

  function moverPonto(
    id: string,
    indice: number,
    ponto: Ponto
  ) {
    if (processando) return;

    setVagas((atual) =>
      atual.map((vaga) =>
        vaga.ID === id
          ? {
              ...vaga,
              Pontos: vaga.Pontos.map((p, i) =>
                i === indice ? ponto : p
              )
            }
          : vaga
      )
    );

    setAlterado(true);
  }

  function renomearSelecionada(nome: string) {
    if (processando) return;

    setVagas((atual) =>
      atual.map((vaga) =>
        vaga.ID === selecionadaID
          ? { ...vaga, Nome: nome }
          : vaga
      )
    );

    setAlterado(true);
  }

  function excluirSelecionada() {
    if (processando) return;

    if (!selecionadaID) {
      mostrarMensagem(
        "Selecione uma vaga primeiro.",
        "erro"
      );
      return;
    }

    setVagas((atual) =>
      atual.filter((vaga) => vaga.ID !== selecionadaID)
    );

    setSelecionadaID(null);
    setAlterado(true);

    mostrarMensagem(
      "Vaga excluída localmente. Salve para confirmar.",
      "info"
    );
  }

  async function salvar() {
    if (!mapa || processando) return;

    if (rascunho) {
      mostrarMensagem(
        "Conclua ou cancele o desenho antes de salvar.",
        "erro"
      );
      return;
    }

    if (vagas.some((vaga) => !vaga.Nome.trim())) {
      mostrarMensagem(
        "Toda vaga precisa de um nome.",
        "erro"
      );
      return;
    }

    setSalvando(true);
    mostrarMensagem("Salvando alterações do mapa...");

    try {
      const atualizado = await salvarVagas(
        mapa.ID,
        vagas
      );

      setMapa(atualizado);
      setVagas(structuredClone(atualizado.Vagas));
      setAlterado(false);

      await atualizarLista();

      mostrarMensagem(
        `${atualizado.Vagas.length} vaga(s) salva(s) com sucesso.`,
        "sucesso"
      );
    } catch (erro) {
      mostrarMensagem(textoDoErro(erro), "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="app vaga-livre-admin" style={temaPainel}>
      <header className="cabecalho-app">
        <div className="cabecalho-conteudo">
          <div className="identidade-app">
            <div className="identidade-marca">
              <span className="marca-icone" aria-hidden="true">
                P
              </span>

              <div className="marca-textos">
                <h1>Vaga Livre</h1>
                <span>Painel de gerenciamento</span>
              </div>
            </div>
          </div>

          <div className="cabecalho-status">
            <span className="status-sistema">
              <span
                className="status-indicador"
                aria-hidden="true"
              />
              Painel administrativo
            </span>
          </div>
        </div>
      </header>

      <div className="conteudo-app">
        <nav
          className="abas navegacao-principal"
          aria-label="Navegação do painel"
        >
          <button
            type="button"
            className={
              aba === "editor" ? "aba ativa" : "aba"
            }
            aria-current={
              aba === "editor" ? "page" : undefined
            }
            onClick={() => setAba("editor")}
          >
            Editor de mapas
          </button>

          <button
            type="button"
            className={
              aba === "monitor" ? "aba ativa" : "aba"
            }
            aria-current={
              aba === "monitor" ? "page" : undefined
            }
            onClick={() => setAba("monitor")}
          >
            Monitor de vagas
          </button>

          <button
            type="button"
            className={
              aba === "monitor-video"
                ? "aba ativa"
                : "aba"
            }
            aria-current={
              aba === "monitor-video" ? "page" : undefined
            }
            onClick={() => setAba("monitor-video")}
          >
            Monitor de vídeo
          </button>
        </nav>

        {aba === "monitor-video" ? (
          <MonitorVideo />
        ) : aba === "monitor" ? (
          <MonitorVagas mapas={mapas} />
        ) : (
          <div className="pagina-editor">
            <section className="pagina-introducao">
              <div>
                <span className="pagina-categoria">
                  GERENCIAMENTO DE ESTACIONAMENTOS
                </span>

                <h2>Editor de mapas</h2>

                <p>
                  Configure o estacionamento, identifique
                  vagas com inteligência artificial e
                  gerencie suas posições.
                </p>
              </div>

              {mapa && (
                <div className="indicadores-editor">
                  <div className="indicador-editor">
                    <span>Vagas cadastradas</span>
                    <strong>{quantidadeVagas}</strong>
                  </div>

                  <div className="indicador-editor">
                    <span>Alterações</span>
                    <strong>
                      {alterado ? "Pendentes" : "Salvas"}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            <section
              className="paineis"
              aria-label="Gerenciamento de mapas"
            >
              <div className="painel">
                <div className="painel-cabecalho">
                  <h3>Abrir mapa existente</h3>

                  <p>
                    Selecione um estacionamento já cadastrado
                    para visualizar ou editar suas vagas.
                  </p>
                </div>

                <label htmlFor="selecionar-mapa">
                  Estacionamento
                </label>

                <select
                  id="selecionar-mapa"
                  value={mapa?.ID ?? ""}
                  disabled={
                    processando || carregandoLista
                  }
                  onChange={(evento) =>
                    void abrirExistente(
                      evento.target.value
                    )
                  }
                >
                  <option value="" disabled>
                    {carregandoLista
                      ? "Carregando mapas..."
                      : mapas.length
                        ? "Selecione um mapa"
                        : "Nenhum mapa cadastrado"}
                  </option>

                  {mapas.map((item) => (
                    <option
                      key={item.ID}
                      value={item.ID}
                    >
                      {item.Nome} (
                      {item.QuantidadeVagas} vagas)
                    </option>
                  ))}
                </select>

                {carregandoMapa && (
                  <div
                    className="status-processamento"
                    role="status"
                  >
                    <strong>Carregando mapa...</strong>
                    <progress />
                  </div>
                )}
              </div>

              <form
                className="painel"
                onSubmit={(evento) =>
                  void aoCriar(evento)
                }
              >
                <div className="painel-cabecalho">
                  <h3>Criar novo mapa</h3>

                  <p>
                    Cadastre um estacionamento a partir
                    de uma imagem JPG ou PNG.
                  </p>
                </div>

                <div className="campo-formulario">
                  <label htmlFor="novo-mapa-id">
                    Identificador do mapa
                  </label>

                  <input
                    id="novo-mapa-id"
                    placeholder="Ex.: estacionamento-02"
                    value={novoID}
                    disabled={processando}
                    onChange={(evento) =>
                      setNovoID(evento.target.value)
                    }
                    required
                  />
                </div>

                <div className="campo-formulario">
                  <label htmlFor="novo-mapa-nome">
                    Nome do estacionamento
                  </label>

                  <input
                    id="novo-mapa-nome"
                    placeholder="Ex.: Estacionamento 02"
                    value={novoNome}
                    disabled={processando}
                    onChange={(evento) =>
                      setNovoNome(evento.target.value)
                    }
                    required
                  />
                </div>

                <div className="campo-formulario">
                  <label htmlFor="novo-mapa-imagem">
                    Imagem do estacionamento
                  </label>

                  <input
                    key={chaveArquivo}
                    id="novo-mapa-imagem"
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={processando}
                    onChange={(evento) =>
                      setNovaImagem(
                        evento.target.files?.[0] ?? null
                      )
                    }
                    required
                  />

                  <small>
                    Formatos aceitos: JPG e PNG.
                  </small>
                </div>

                <button
                  type="submit"
                  className="botao-primario"
                  disabled={processando}
                >
                  {ocupado
                    ? "Criando mapa..."
                    : "Criar mapa"}
                </button>

                {ocupado && (
                  <div
                    className="status-processamento"
                    role="status"
                    aria-live="polite"
                  >
                    <strong>
                      Preparando estacionamento
                    </strong>

                    <p>
                      Estamos cadastrando o mapa
                      e processando sua imagem.
                    </p>

                    <progress
                      aria-label="Criação do mapa em andamento"
                    />
                  </div>
                )}
              </form>
            </section>

            {mensagem && (
              <div
                className={`mensagem mensagem-${tipoMensagem}`}
                role={
                  tipoMensagem === "erro"
                    ? "alert"
                    : "status"
                }
                aria-live={
                  tipoMensagem === "erro"
                    ? "assertive"
                    : "polite"
                }
              >
                <span>{mensagem}</span>

                <button
                  type="button"
                  className="botao-fechar-mensagem"
                  aria-label="Fechar mensagem"
                  onClick={() => setMensagem("")}
                >
                  ×
                </button>
              </div>
            )}

            {mapa ? (
              <section className="secao-editor">
                <div className="secao-editor-cabecalho">
                  <div>
                    <span className="pagina-categoria">
                      MAPA SELECIONADO
                    </span>

                    <h3>{mapa.Nome}</h3>

                    <p>
                      Gerencie as vagas manualmente
                      ou utilize a detecção automática.
                    </p>
                  </div>

                  <span
                    className={
                      alterado
                        ? "selo-estado selo-pendente"
                        : "selo-estado selo-salvo"
                    }
                  >
                    {alterado
                      ? "Alterações não salvas"
                      : "Tudo salvo"}
                  </span>
                </div>

                <div
                  className="controles"
                  aria-label="Ferramentas do editor"
                >
                  <button
                    type="button"
                    onClick={iniciarDesenho}
                    disabled={
                      processando || rascunho !== null
                    }
                  >
                    Nova vaga (V)
                  </button>

                  <button
                    type="button"
                    className="botao-ia"
                    onClick={() =>
                      void criarVagasIA()
                    }
                    disabled={processando}
                  >
                    {criandoVagasIA
                      ? "Detectando vagas..."
                      : "Criar vagas com IA"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelarDesenho}
                    disabled={
                      processando || rascunho === null
                    }
                  >
                    Cancelar desenho
                  </button>

                  <button
                    type="button"
                    className="botao-perigo"
                    onClick={excluirSelecionada}
                    disabled={
                      processando || !selecionada
                    }
                  >
                    Excluir selecionada
                  </button>

                  <button
                    type="button"
                    className="botao-primario"
                    onClick={() => void salvar()}
                    disabled={
                      processando || !alterado
                    }
                  >
                    {salvando
                      ? "Salvando..."
                      : "Salvar vagas"}
                  </button>
                </div>

                {selecionada && (
                  <div className="painel-edicao-vaga">
                    <div>
                      <strong>Vaga selecionada</strong>
                      <p>
                        Altere o nome da vaga selecionada.
                      </p>
                    </div>

                    <div className="campo-formulario">
                      <label htmlFor="nome-vaga">
                        Nome da vaga
                      </label>

                      <input
                        id="nome-vaga"
                        aria-label="Nome da vaga selecionada"
                        value={selecionada.Nome}
                        disabled={processando}
                        onChange={(evento) =>
                          renomearSelecionada(
                            evento.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {criandoVagasIA && (
                  <div
                    className="status-processamento status-ia"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <div className="status-ia-conteudo">
                      <span
                        className="status-ia-indicador"
                        aria-hidden="true"
                      />

                      <div>
                        <strong>
                          Identificando vagas com
                          inteligência artificial
                        </strong>

                        <p>
                          Estamos analisando a imagem
                          do estacionamento e identificando
                          as possíveis vagas.
                        </p>
                      </div>
                    </div>

                    <progress
                      aria-label="Detecção de vagas em andamento"
                    />

                    <small>
                      O tempo de processamento pode variar
                      conforme a imagem. Mantenha esta
                      página aberta.
                    </small>
                  </div>
                )}

                {salvando && (
                  <div
                    className="status-processamento"
                    role="status"
                    aria-live="polite"
                  >
                    <strong>
                      Salvando alterações...
                    </strong>

                    <progress
                      aria-label="Salvamento em andamento"
                    />
                  </div>
                )}

                <div className="area">
                  <div className="area-cabecalho">
                    <div>
                      <h3>Visualização do estacionamento</h3>

                      <p>
                        Selecione uma vaga ou clique nos
                        pontos da imagem para editar.
                      </p>
                    </div>

                    <span className="contador-vagas">
                      {quantidadeVagas} vaga(s)
                    </span>
                  </div>

                  <div
                    className="editor-visualizacao"
                    aria-busy={processando}
                    style={{
                      pointerEvents: processando
                        ? "none"
                        : "auto"
                    }}
                  >
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
                </div>
              </section>
            ) : (
              <section className="estado-vazio">
                <div className="estado-vazio-conteudo">
                  <span
                    className="estado-vazio-icone"
                    aria-hidden="true"
                  >
                    P
                  </span>

                  <h3>Nenhum mapa selecionado</h3>

                  <p>
                    Abra um estacionamento existente
                    ou crie um novo mapa a partir de
                    uma imagem para começar.
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
