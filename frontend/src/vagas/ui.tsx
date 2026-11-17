import type { ReactNode } from "react";
import { nivelDeVagas } from "./dados";
import "./tema.css";

type TelaProps = {
  children: ReactNode;
  larga?: boolean;
};

export function Tela({ children, larga }: TelaProps) {
  return (
    <div className="vg-app">
      <div className={larga ? "vg-tela vg-tela--larga" : "vg-tela"}>{children}</div>
    </div>
  );
}

type TopoProps = {
  titulo: string;
  subtitulo?: string;
  aoVoltar?: () => void;
};

export function Topo({ titulo, subtitulo, aoVoltar }: TopoProps) {
  return (
    <header>
      {aoVoltar && (
        <button className="vg-voltar" onClick={aoVoltar}>
          ← Voltar
        </button>
      )}
      <h1 className="vg-titulo">{titulo}</h1>
      {subtitulo && <p className="vg-subtitulo">{subtitulo}</p>}
      <hr className="vg-divisor" style={{ marginTop: 12 }} />
    </header>
  );
}

type BuscaProps = {
  valor: string;
  aoMudar: (valor: string) => void;
  rotulo: string;
};

export function Busca({ valor, aoMudar, rotulo }: BuscaProps) {
  return (
    <input
      className="vg-campo"
      aria-label={rotulo}
      placeholder={rotulo}
      value={valor}
      onChange={(evento) => aoMudar(evento.target.value)}
    />
  );
}

type SeloProps = {
  livres: number;
  total: number;
};

export function Selo({ livres, total }: SeloProps) {
  return (
    <span className={`vg-badge vg-badge--${nivelDeVagas(livres, total)}`}>
      {livres}/{total}
    </span>
  );
}

type ItemProps = {
  nome: string;
  descricao?: string;
  direita?: ReactNode;
  aoClicar: () => void;
};

export function Item({ nome, descricao, direita, aoClicar }: ItemProps) {
  return (
    <li>
      <button className="vg-item" onClick={aoClicar}>
        <span>
          <span className="vg-item-nome">{nome}</span>
          {descricao && (
            <>
              <br />
              <span className="vg-item-descricao">{descricao}</span>
            </>
          )}
        </span>
        {direita}
      </button>
    </li>
  );
}

type BotaoProps = {
  children: ReactNode;
  aoClicar: () => void;
  secundario?: boolean;
  tipo?: "button" | "submit";
  desabilitado?: boolean;
};

export function Botao({ children, aoClicar, secundario, tipo = "button", desabilitado }: BotaoProps) {
  return (
    <button
      className={secundario ? "vg-botao vg-botao--secundario" : "vg-botao"}
      type={tipo}
      disabled={desabilitado}
      onClick={tipo === "submit" ? undefined : aoClicar}
    >
      {children}
    </button>
  );
}

type CampoProps = {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  tipo?: "text" | "email" | "password" | "tel";
  exemplo?: string;
  dica?: string;
  erro?: string;
  modo?: "text" | "numeric" | "tel";
};

export function Campo({ rotulo, valor, aoMudar, tipo = "text", exemplo, dica, erro, modo }: CampoProps) {
  const id = "campo-" + rotulo.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="vg-campo-grupo">
      <label className="vg-rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <input
        id={id}
        className={erro ? "vg-campo vg-campo--erro" : "vg-campo"}
        type={tipo}
        value={valor}
        placeholder={exemplo}
        inputMode={modo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? id + "-erro" : undefined}
        onChange={(evento) => aoMudar(evento.target.value)}
      />
      {erro ? (
        <span className="vg-erro" id={id + "-erro"}>
          {erro}
        </span>
      ) : (
        dica && <span className="vg-dica">{dica}</span>
      )}
    </div>
  );
}
