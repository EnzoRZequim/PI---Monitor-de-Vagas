import { useNavigate } from "react-router-dom";
import { Botao, Tela } from "./ui";

export default function TelaCadastroEnviado() {
  const navegar = useNavigate();

  return (
    <Tela>
      <div style={{ marginTop: 48 }}>
        <h1 className="vg-titulo">Tudo certo!</h1>
        <p className="vg-subtitulo">Dados enviados com sucesso</p>
      </div>

      <p className="vg-aviso vg-centro" style={{ marginTop: 32 }}>
        Em breve nossa equipe retornará com uma resposta no e-mail e no telefone
        informados no cadastro.
      </p>

      <div style={{ marginTop: 32 }}>
        <Botao aoClicar={() => navegar("/")}>Voltar ao menu</Botao>
      </div>
    </Tela>
  );
}
