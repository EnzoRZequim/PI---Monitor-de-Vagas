import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarLocais } from "./dados";
import type { ResumoLocal } from "./tipos";
import { Busca, Item, Selo, Tela, Topo } from "./ui";

export default function TelaLocais() {
  const navegar = useNavigate();
  const [locais, setLocais] = useState<ResumoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarLocais()
      .then(setLocais)
      .catch(() => setErro("Não foi possível carregar os locais."));
  }, []);

  const filtrados = locais.filter((local) =>
    local.Nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <Tela larga>
      <Topo titulo="Locais Parceiros" aoVoltar={() => navegar("/")} />

      <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar Local" />

      {erro && <p className="vg-aviso">{erro}</p>}

      <ul className="vg-lista vg-lista--grade">
        {filtrados.map((local) => (
          <Item
            key={local.ID}
            nome={local.Nome}
            descricao={`${local.Livres} vagas livres agora`}
            direita={<Selo livres={local.Livres} total={local.Total} />}
            aoClicar={() => navegar(`/locais/${local.ID}`)}
          />
        ))}
      </ul>

      {!erro && filtrados.length === 0 && <p className="vg-aviso">Nenhum local encontrado.</p>}
    </Tela>
  );
}
