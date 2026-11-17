export type EstadoVaga = "livre" | "ocupada" | "indisponivel";

export type VagaMapa = {
  ID: string;
  Nome: string;
  Estado: EstadoVaga;
};

export type Bloco = {
  ID: string;
  Nome: string;
  Total: number;
  Livres: number;
  Vagas: VagaMapa[];
};

export type Local = {
  ID: string;
  Nome: string;
  Endereco: string;
  Blocos: Bloco[];
};

export type ResumoLocal = {
  ID: string;
  Nome: string;
  Total: number;
  Livres: number;
};

export type Nivel = "alta" | "media" | "baixa";

export type CadastroParceiro = {
  Email: string;
  Senha: string;
  NomeEmpresa: string;
  Cnpj: string;
  Contato: string;
  NomeContato: string;
  Endereco: string;
};
