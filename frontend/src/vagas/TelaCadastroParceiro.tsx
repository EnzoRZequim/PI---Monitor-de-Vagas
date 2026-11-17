import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { enviarCadastroParceiro } from "./dados";
import type { CadastroParceiro } from "./tipos";
import { Botao, Campo, Tela, Topo } from "./ui";

const VAZIO: CadastroParceiro = {
  Email: "",
  Senha: "",
  NomeEmpresa: "",
  Cnpj: "",
  Contato: "",
  NomeContato: "",
  Endereco: ""
};

function mascaraCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 14);
  let saida = digitos.slice(0, 2);

  if (digitos.length > 2) saida += "." + digitos.slice(2, 5);
  if (digitos.length > 5) saida += "." + digitos.slice(5, 8);
  if (digitos.length > 8) saida += "/" + digitos.slice(8, 12);
  if (digitos.length > 12) saida += "-" + digitos.slice(12, 14);

  return saida;
}

function mascaraTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos;

  const corte = digitos.length > 10 ? 7 : 6;
  const meio = digitos.slice(2, corte);
  const fim = digitos.slice(corte);

  return `(${digitos.slice(0, 2)}) ${meio}` + (fim ? `-${fim}` : "");
}

function cnpjValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) return false;

  const digitoVerificador = (tamanho: number): number => {
    let soma = 0;
    let peso = tamanho - 7;

    for (let i = 0; i < tamanho; i++) {
      soma += Number(digitos[i]) * peso--;
      if (peso < 2) peso = 9;
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digitoVerificador(12) === Number(digitos[12])
    && digitoVerificador(13) === Number(digitos[13]);
}

function validar(dados: CadastroParceiro): Partial<Record<keyof CadastroParceiro, string>> {
  const erros: Partial<Record<keyof CadastroParceiro, string>> = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.Email.trim())) {
    erros.Email = "Informe um e-mail válido.";
  }

  if (dados.Senha.length < 8) {
    erros.Senha = "A senha deve ter pelo menos 8 caracteres.";
  }

  if (dados.NomeEmpresa.trim().length < 2) {
    erros.NomeEmpresa = "Informe o nome da empresa.";
  }

  if (!cnpjValido(dados.Cnpj)) {
    erros.Cnpj = "CNPJ inválido. Confira os 14 dígitos.";
  }

  if (dados.Contato.replace(/\D/g, "").length < 10) {
    erros.Contato = "Informe o DDD e o número.";
  }

  if (dados.NomeContato.trim().length < 2) {
    erros.NomeContato = "Informe o nome de quem vamos procurar.";
  }

  if (dados.Endereco.trim().length < 4) {
    erros.Endereco = "Informe a cidade e o local do estacionamento.";
  }

  return erros;
}

export default function TelaCadastroParceiro() {
  const navegar = useNavigate();
  const [dados, setDados] = useState<CadastroParceiro>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<keyof CadastroParceiro, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState("");

  function alterar(campo: keyof CadastroParceiro, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  async function enviar() {
    const encontrados = validar(dados);
    setErros(encontrados);

    if (Object.keys(encontrados).length > 0) {
      setFalha("Confira os campos destacados.");
      return;
    }

    setFalha("");
    setEnviando(true);

    try {
      await enviarCadastroParceiro(dados);
      navegar("/parceiro/sucesso");
    } catch {
      setFalha("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Topo
        titulo="Tornar-se Parceiro"
        subtitulo="Seu estacionamento, suas vagas"
        aoVoltar={() => navegar("/")}
      />

      <form
        className="vg-formulario"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        <Campo
          rotulo="E-mail"
          tipo="email"
          valor={dados.Email}
          erro={erros.Email}
          dica="Será o login de acesso à área do parceiro"
          aoMudar={(valor) => alterar("Email", valor)}
        />

        <Campo
          rotulo="Senha"
          tipo="password"
          valor={dados.Senha}
          erro={erros.Senha}
          dica="Mínimo de 8 caracteres"
          aoMudar={(valor) => alterar("Senha", valor)}
        />

        <Campo
          rotulo="Nome da empresa"
          valor={dados.NomeEmpresa}
          erro={erros.NomeEmpresa}
          exemplo="Ex.: Estacionamento Central Ltda."
          aoMudar={(valor) => alterar("NomeEmpresa", valor)}
        />

        <Campo
          rotulo="CNPJ"
          valor={dados.Cnpj}
          erro={erros.Cnpj}
          exemplo="00.000.000/0000-00"
          modo="numeric"
          aoMudar={(valor) => alterar("Cnpj", mascaraCnpj(valor))}
        />

        <Campo
          rotulo="Número de contato"
          tipo="tel"
          valor={dados.Contato}
          erro={erros.Contato}
          exemplo="(11) 90000-0000"
          modo="tel"
          aoMudar={(valor) => alterar("Contato", mascaraTelefone(valor))}
        />

        <Campo
          rotulo="Nome do contato"
          valor={dados.NomeContato}
          erro={erros.NomeContato}
          exemplo="Quem vamos procurar"
          aoMudar={(valor) => alterar("NomeContato", valor)}
        />

        <Campo
          rotulo="Endereço (cidade/local)"
          valor={dados.Endereco}
          erro={erros.Endereco}
          exemplo="Ex.: São Caetano do Sul — Praça Mauá, 1"
          aoMudar={(valor) => alterar("Endereco", valor)}
        />

        {falha && <p className="vg-erro-geral">{falha}</p>}

        <Botao tipo="submit" desabilitado={enviando} aoClicar={() => void enviar()}>
          {enviando ? "Enviando..." : "Enviar cadastro"}
        </Botao>
      </form>
    </Tela>
  );
}
