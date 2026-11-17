import { useNavigate } from "react-router-dom";
import { Botao, Tela } from "./ui";

export default function TelaInicio() {
  const navegar = useNavigate();

  return (
    <Tela>
      <img className="vg-logo" src="/logo-vaga-livre.svg" alt="Vaga Livre" width={112} height={112} />

      <div className="vg-centro">
        <h1 className="vg-titulo">Vaga Livre</h1>
        <p className="vg-subtitulo">Sua vaga, sem voltas</p>
      </div>

      <div style={{ marginTop: 32 }}>
        <Botao aoClicar={() => navegar("/locais")}>Locais</Botao>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Botao secundario aoClicar={() => navegar("/parceiro/cadastro")}>
          Tornar-se parceiro
        </Botao>
        <Botao secundario aoClicar={() => navegar("/parceiro/login")}>
          Área do parceiro
        </Botao>
      </div>
    </Tela>
  );
}
