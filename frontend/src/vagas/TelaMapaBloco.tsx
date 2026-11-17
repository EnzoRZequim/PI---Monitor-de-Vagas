import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarBloco } from "./dados";
import type { Bloco, Local } from "./tipos";
import { Selo, Tela, Topo } from "./ui";

type Conteudo = { local: Local; bloco: Bloco } | null;

export default function TelaMapaBloco() {
  const navegar = useNavigate();
  const { localID = "", blocoID = "" } = useParams();
  const [conteudo, setConteudo] = useState<Conteudo>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    buscarBloco(localID, blocoID)
      .then(setConteudo)
      .finally(() => setCarregando(false));
  }, [localID, blocoID]);

  if (carregando) {
    return (
      <Tela>
        <p className="vg-aviso">Carregando...</p>
      </Tela>
    );
  }

  if (!conteudo) {
    return (
      <Tela>
        <Topo titulo="Bloco não encontrado" aoVoltar={() => navegar(`/locais/${localID}`)} />
      </Tela>
    );
  }

  const { local, bloco } = conteudo;

  return (
    <Tela larga>
      <Topo
        titulo={bloco.Nome}
        subtitulo={local.Nome}
        aoVoltar={() => navegar(`/locais/${local.ID}`)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Selo livres={bloco.Livres} total={bloco.Total} />
        <span className="vg-legenda">vagas livres neste bloco</span>
      </div>

      <div className="vg-legendas">
        <span className="vg-legenda-item">
          <span className="vg-ponto" style={{ background: "var(--vg-verde)" }} /> Livre
        </span>
        <span className="vg-legenda-item">
          <span className="vg-ponto" style={{ background: "var(--vg-vermelho)" }} /> Ocupada
        </span>
        <span className="vg-legenda-item">
          <span className="vg-ponto" style={{ background: "var(--vg-card-sec)" }} /> Indisponível
        </span>
      </div>

      <div className="vg-mapa">
        {bloco.Vagas.map((vaga) => (
          <span
            key={vaga.ID}
            className={`vg-vaga vg-vaga--${vaga.Estado}`}
            title={`${vaga.Nome}: ${vaga.Estado}`}
          >
            {vaga.Nome}
          </span>
        ))}
      </div>
    </Tela>
  );
}
