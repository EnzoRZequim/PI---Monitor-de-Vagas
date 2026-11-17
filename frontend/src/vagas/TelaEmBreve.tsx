import { useNavigate } from "react-router-dom";
import { Botao, Tela, Topo } from "./ui";

/** Espaço reservado para a área do parceiro (próxima etapa). */
export default function TelaEmBreve() {
  const navegar = useNavigate();

  return (
    <Tela>
      <Topo titulo="Em construção" subtitulo="Esta tela entra na próxima etapa." aoVoltar={() => navegar("/")} />
      <Botao aoClicar={() => navegar("/")}>Voltar ao início</Botao>
    </Tela>
  );
}
