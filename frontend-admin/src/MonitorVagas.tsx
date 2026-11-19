
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { analisarMapa, buscarMapa } from "./api";
import type { Mapa, OcupacaoMapa, ResumoMapa } from "./tipos";

import "./App.css";

type Props = {
  mapas: ResumoMapa[];
};

type TipoMensagem = "sucesso" | "erro" | "info";

function textoDoErro(erro: unknown): string {
  return erro instanceof Error
    ? erro.message
    : "Ocorreu um erro inesperado.";
}

export function MonitorVagas({ mapas }: Props) {
  const [mapaID, setMapaID] = useState("");
  const [mapa, setMapa] = useState<Mapa | null>(null);

  const [imagem, setImagem] = useState<File | null>(null);
  const [urlImagem, setUrlImagem] = useState<string | null>(null);

  const [ocupacao, setOcupacao] = useState<OcupacaoMapa | null>(null);

  const [ocupado, setOcupado] = useState(false);
  const [carregandoMapa, setCarregandoMapa] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] =
    useState<TipoMensagem>("info");

  const urlImagemRef = useRef<string | null>(null);
  const requisicaoRef = useRef(0);
  const montadoRef = useRef(true);

  const totalVagas = ocupacao?.Vagas.length ?? 0;

  const vagasOcupadas =
    ocupacao?.Vagas.filter((vaga) => vaga.Ocupada).length ?? 0;

  const vagasLivres = totalVagas - vagasOcupadas;

  function mostrarMensagem(
    texto: string,
    tipo: TipoMensagem = "info"
  ) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      requisicaoRef.current += 1;

      if (urlImagemRef.current) {
        URL.revokeObjectURL(urlImagemRef.current);
        urlImagemRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapaID) {
      setMapa(null);
      setCarregandoMapa(false);
      return;
    }

    let ignorar = false;

    setCarregandoMapa(true);
    setMapa(null);

    buscarMapa(mapaID)
      .then((dados) => {
        if (!ignorar) {
          setMapa(dados);
        }
      })
      .catch((erro: unknown) => {
        if (!ignorar) {
          mostrarMensagem(textoDoErro(erro), "erro");
        }
      })
      .finally(() => {
        if (!ignorar) {
          setCarregandoMapa(false);
        }
      });

    return () => {
      ignorar = true;
    };
  }, [mapaID]);

  function aoSelecionarMapa(
    evento: ChangeEvent<HTMLSelectElement>
  ) {
    if (ocupado) return;

    const id = evento.target.value;

    requisicaoRef.current += 1;

    setMapaID(id);
    setMapa(null);
    setOcupacao(null);
    setMensagem("");
  }

  function aoSelecionarImagem(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    if (ocupado) return;

    const arquivo = evento.target.files?.[0] ?? null;

    requisicaoRef.current += 1;

    setImagem(arquivo);
    setOcupacao(null);
    setMensagem("");

    if (urlImagemRef.current) {
      URL.revokeObjectURL(urlImagemRef.current);
      urlImagemRef.current = null;
    }

    if (arquivo) {
      const url = URL.createObjectURL(arquivo);

      urlImagemRef.current = url;
      setUrlImagem(url);
    } else {
      setUrlImagem(null);
    }
  }

  async function aoAnalisar(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (ocupado) return;

    if (!mapaID || !mapa) {
      mostrarMensagem(
        "Selecione um mapa válido antes de analisar.",
        "erro"
      );
      return;
    }

    if (!imagem) {
      mostrarMensagem(
        "Selecione uma imagem JPG ou PNG para analisar.",
        "erro"
      );
      return;
    }

    const requisicaoAtual = ++requisicaoRef.current;

    setOcupado(true);
    setOcupacao(null);

    mostrarMensagem(
      "A inteligência artificial está analisando as vagas..."
    );

    try {
      const resultado = await analisarMapa(
        mapaID,
        imagem
      );

      if (
        !montadoRef.current ||
        requisicaoAtual !== requisicaoRef.current
      ) {
        return;
      }

      setOcupacao(resultado);

      const ocupadas = resultado.Vagas.filter(
        (vaga) => vaga.Ocupada
      ).length;

      const livres = resultado.Vagas.length - ocupadas;

      mostrarMensagem(
        `Análise concluída: ${livres} vaga(s) livre(s) ` +
          `e ${ocupadas} vaga(s) ocupada(s).`,
        "sucesso"
      );
    } catch (erro) {
      if (
        !montadoRef.current ||
        requisicaoAtual !== requisicaoRef.current
      ) {
        return;
      }

      mostrarMensagem(textoDoErro(erro), "erro");
    } finally {
      if (
        montadoRef.current &&
        requisicaoAtual === requisicaoRef.current
      ) {
        setOcupado(false);
      }
    }
  }

  function estadoVaga(id: string): boolean | null {
    if (!ocupacao) return null;

    return (
      ocupacao.Vagas.find(
        (vaga) => vaga.ID === id
      )?.Ocupada ?? null
    );
  }

  return (
    <section className="monitor pagina-editor">
      <div className="pagina-introducao">
        <div>
          <span className="pagina-categoria">
            MONITORAMENTO INTELIGENTE
          </span>

          <h2>Monitor de vagas</h2>

          <p>
            Envie uma imagem do estacionamento para
            identificar automaticamente quais vagas
            estão livres ou ocupadas.
          </p>
        </div>
      </div>

      <form
        className="paineis"
        onSubmit={(evento) => void aoAnalisar(evento)}
      >
        <div className="painel">
          <div className="painel-cabecalho">
            <h3>Selecionar estacionamento</h3>

            <p>
              Escolha o mapa que corresponde à imagem
              que será analisada.
            </p>
          </div>

          <div className="campo-formulario">
            <label htmlFor="monitor-mapa">
              Mapa do estacionamento
            </label>

            <select
              id="monitor-mapa"
              value={mapaID}
              disabled={ocupado}
              onChange={aoSelecionarMapa}
            >
              <option value="" disabled>
                {mapas.length
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
          </div>

          {carregandoMapa && (
            <div
              className="status-processamento"
              role="status"
              aria-live="polite"
            >
              <strong>Carregando estacionamento...</strong>

              <progress
                aria-label="Carregamento do mapa"
              />
            </div>
          )}
        </div>

        <div className="painel">
          <div className="painel-cabecalho">
            <h3>Imagem para análise</h3>

            <p>
              Selecione uma imagem JPG ou PNG
              capturada do estacionamento.
            </p>
          </div>

          <div className="campo-formulario">
            <label htmlFor="monitor-imagem">
              Imagem do estacionamento
            </label>

            <input
              id="monitor-imagem"
              type="file"
              accept="image/jpeg,image/png"
              disabled={ocupado}
              onChange={aoSelecionarImagem}
            />

            <small>
              Utilize uma imagem correspondente
              ao mapa selecionado.
            </small>
          </div>

          {imagem && (
            <div className="monitor-arquivo">
              <strong>Imagem selecionada</strong>
              <span>{imagem.name}</span>
            </div>
          )}

          <button
            type="submit"
            className="botao-primario"
            disabled={
              ocupado ||
              carregandoMapa ||
              !mapa ||
              !imagem
            }
          >
            {ocupado
              ? "Analisando imagem..."
              : "Analisar ocupação"}
          </button>
        </div>
      </form>

      {ocupado && (
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
                Analisando ocupação das vagas
              </strong>

              <p>
                Estamos processando a imagem
                e verificando quais vagas
                estão livres ou ocupadas.
              </p>
            </div>
          </div>

          <progress
            aria-label="Análise de ocupação em andamento"
          />

          <small>
            Aguarde a conclusão da análise.
            O tempo pode variar conforme
            a imagem e o processamento.
          </small>
        </div>
      )}

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

      {ocupacao && (
        <section
          className="monitor-resultados"
          aria-label="Resultado da análise"
        >
          <div className="secao-editor-cabecalho">
            <div>
              <span className="pagina-categoria">
                RESULTADO DA ANÁLISE
              </span>

              <h3>Ocupação do estacionamento</h3>

              <p>
                Confira a classificação das vagas
                identificadas pela inteligência artificial.
              </p>
            </div>
          </div>

          <div className="monitor-indicadores">
            <div className="monitor-indicador">
              <span>Total de vagas</span>
              <strong>{totalVagas}</strong>
            </div>

            <div className="monitor-indicador monitor-livre">
              <span>Vagas livres</span>
              <strong>{vagasLivres}</strong>
            </div>

            <div className="monitor-indicador monitor-ocupada">
              <span>Vagas ocupadas</span>
              <strong>{vagasOcupadas}</strong>
            </div>
          </div>
        </section>
      )}

      {mapa && urlImagem && (
        <div className="area monitor-area">
          <div className="area-cabecalho">
            <div>
              <h3>Visualização do estacionamento</h3>

              <p>
                A imagem é exibida com as vagas
                definidas no mapa selecionado.
              </p>
            </div>

            {ocupacao && (
              <span className="selo-estado selo-salvo">
                Análise concluída
              </span>
            )}
          </div>

          <div className="editor-visualizacao">
            <svg
              className="editor-svg"
              viewBox={`0 0 ${mapa.Largura} ${mapa.Altura}`}
              style={{
                aspectRatio:
                  `${mapa.Largura} / ${mapa.Altura}`
              }}
              role="img"
              aria-label={
                `Mapa do estacionamento ${mapa.Nome}` +
                " com a classificação das vagas"
              }
            >
              <image
                href={urlImagem}
                width={mapa.Largura}
                height={mapa.Altura}
                preserveAspectRatio="none"
              />

              {mapa.Vagas.map((vaga) => {
                const estado = estadoVaga(vaga.ID);

                const classe =
                  estado === null
                    ? "vaga"
                    : estado
                      ? "vaga ocupada"
                      : "vaga livre";

                const descricao =
                  estado === null
                    ? "Aguardando análise"
                    : estado
                      ? "Ocupada"
                      : "Livre";

                return (
                  <polygon
                    key={vaga.ID}
                    points={vaga.Pontos.map(
                      (ponto) =>
                        `${ponto.X * mapa.Largura},` +
                        `${ponto.Y * mapa.Altura}`
                    ).join(" ")}
                    className={classe}
                  >
                    <title>
                      {vaga.Nome}: {descricao}
                    </title>
                  </polygon>
                );
              })}
            </svg>
          </div>

          <div className="monitor-legenda">
            <span>
              <i className="legenda-cor legenda-livre" />
              Livre
            </span>

            <span>
              <i className="legenda-cor legenda-ocupada" />
              Ocupada
            </span>

            <span>
              <i className="legenda-cor legenda-pendente" />
              Não analisada
            </span>
          </div>
        </div>
      )}

      {mapa && !urlImagem && (
        <div className="estado-vazio">
          <div className="estado-vazio-conteudo">
            <h3>Imagem não selecionada</h3>

            <p>
              Escolha uma imagem do estacionamento
              para visualizar as vagas e iniciar
              a análise de ocupação.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
