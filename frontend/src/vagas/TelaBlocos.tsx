import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarLocal } from "./dados";
import type { Local } from "./tipos";
import { Busca, Item, Selo, Tela, Topo } from "./ui";

export default function TelaBlocos() {
  const navegar = useNavigate();
  const { localID = "" } = useParams();
  const [local, setLocal] = useState<Local | null>(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    buscarLocal(localID)
      .then(setLocal)
      .finally(() => setCarregando(false));
  }, [localID]);

  if (carregando) {
    return (
      <Tela>
        <p className="vg-aviso">Carregando...</p>
      </Tela>
    );
  }

  if (!local) {
    return (
      <Tela>
        <Topo titulo="Local não encontrado" aoVoltar={() => navegar("/locais")} />
      </Tela>
    );
  }

  const filtrados = local.Blocos.filter((bloco) =>
    bloco.Nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <Tela larga>
      <Topo titulo={local.Nome} subtitulo={local.Endereco} aoVoltar={() => navegar("/locais")} />

      <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar Bloco" />

      <ul className="vg-lista vg-lista--grade">
        {filtrados.map((bloco) => (
          <Item
            key={bloco.ID}
            nome={bloco.Nome}
            descricao={`${bloco.Livres} de ${bloco.Total} vagas livres`}
            direita={<Selo livres={bloco.Livres} total={bloco.Total} />}
            aoClicar={() => navegar(`/locais/${local.ID}/blocos/${bloco.ID}`)}
          />
        ))}
      </ul>

      {filtrados.length === 0 && <p className="vg-aviso">Nenhum bloco encontrado.</p>}
    </Tela>
  );
}
