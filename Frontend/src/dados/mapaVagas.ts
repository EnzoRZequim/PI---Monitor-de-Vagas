// Planta 2D (vista de cima) de um bloco, gerada a partir do número de vagas. Os tipos seguem o formato
// do backend (Vaga { ID, Nome, Pontos } com coordenadas de 0 a 1), mas aqui as coordenadas são da
// planta e não da foto da câmera. Quando o backend guardar a planta, ela substitui `gerarPlanta`.
export type Ponto = { X: number; Y: number };

export type TipoVaga = 'comum' | 'preferencial';

export type VagaPlanta = {
  ID: string;
  Nome: string;
  Tipo: TipoVaga;
  // Quadrilátero da vaga, em sentido horário a partir do canto superior esquerdo
  Pontos: Ponto[];
};

export type Linha = { De: Ponto; Para: Ponto };

export type Planta = {
  // Tamanho da planta em unidades do Figma (a escala 1 mostra as vagas com 101x37)
  Largura: number;
  Altura: number;
  // Ponto onde os carros entram, na borda de baixo
  Entrada: Ponto;
  Vagas: VagaPlanta[];
  // Paredes e separações entre as vagas
  Linhas: Linha[];
};

type VagaBase = { ID: string; Nome: string };

// Medidas do frame "Bloco A (mapa)" do Figma: vagas de 101x37, linhas de separação a cada 49 e
// corredor de 81 entre as duas colunas (módulo de 307 de largura)
const LARGURA_VAGA = 101;
const ALTURA_VAGA = 37;
const PASSO = 49;
const LARGURA_COLUNA = 113;
const LARGURA_CORREDOR = 81;
const LARGURA_MODULO = LARGURA_COLUNA * 2 + LARGURA_CORREDOR;
const RECUO_VAGA = (LARGURA_COLUNA - LARGURA_VAGA) / 2;
// O Figma tem 9 fileiras por coluna; mais vagas que isso viram outros módulos
const FILEIRAS_MAXIMAS = 9;
const ESPACO_ENTRE_MODULOS = 48;
// Faixa de baixo, onde fica a marca da entrada
const ALTURA_ENTRADA = 56;
// Proporção (largura / altura) preferida para a planta: fica entre a do celular e a do desktop
const PROPORCAO_ALVO = 0.75;
// Cota de vagas preferenciais (2%, no mínimo uma)
const COTA_PREFERENCIAIS = 0.02;

// Sorteio com semente: o mesmo bloco gera sempre a mesma planta e a mesma ocupação inicial
export function criarSorteio(semente: string) {
  let h = 1779033703 ^ semente.length;
  for (let i = 0; i < semente.length; i++) {
    h = Math.imul(h ^ semente.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let estado = h >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Escolhe quantas colunas de módulos deixam a planta mais próxima da proporção alvo
function colunasDaGrade(modulos: number, alturaModulo: number) {
  let melhor = 1;
  let menorDesvio = Infinity;
  for (let colunas = 1; colunas <= modulos; colunas++) {
    const linhas = Math.ceil(modulos / colunas);
    const largura = colunas * LARGURA_MODULO + (colunas - 1) * ESPACO_ENTRE_MODULOS;
    const altura = linhas * alturaModulo + (linhas - 1) * ESPACO_ENTRE_MODULOS + ALTURA_ENTRADA;
    const desvio = Math.abs(Math.log(largura / altura / PROPORCAO_ALVO));
    if (desvio < menorDesvio) {
      menorDesvio = desvio;
      melhor = colunas;
    }
  }
  return melhor;
}

type Entrada = {
  // Letra do bloco, usada nos nomes gerados ("A1", "A2"...)
  letra: string;
  // Prefixo dos IDs gerados
  prefixoId: string;
  total: number;
  // Vagas já existentes no backend (mesmo ID e nome); sem isso os IDs e nomes são gerados
  vagas?: VagaBase[];
};

// Fileiras duplas como no Figma: duas colunas de vagas de frente para o corredor. Vagas demais para
// um módulo viram vários módulos, distribuídos numa grade.
export function gerarPlanta({ letra, prefixoId, total, vagas }: Entrada): Planta {
  const modulos = Math.max(1, Math.ceil(total / (2 * FILEIRAS_MAXIMAS)));
  const fileiras = Math.max(1, Math.ceil(total / (2 * modulos)));
  const alturaModulo = fileiras * PASSO;
  const colunas = colunasDaGrade(modulos, alturaModulo);
  const linhasDeModulos = Math.ceil(modulos / colunas);

  const largura = colunas * LARGURA_MODULO + (colunas - 1) * ESPACO_ENTRE_MODULOS;
  const altura = linhasDeModulos * alturaModulo + (linhasDeModulos - 1) * ESPACO_ENTRE_MODULOS + ALTURA_ENTRADA;
  const ponto = (x: number, y: number): Ponto => ({ X: x / largura, Y: y / altura });

  type Posicao = { x: number; y: number };
  const posicoes: Posicao[] = [];
  const linhas: Linha[] = [];
  const reta = (x1: number, y1: number, x2: number, y2: number) =>
    linhas.push({ De: ponto(x1, y1), Para: ponto(x2, y2) });

  for (let m = 0; m < modulos && posicoes.length < total; m++) {
    const x0 = (m % colunas) * (LARGURA_MODULO + ESPACO_ENTRE_MODULOS);
    const y0 = Math.floor(m / colunas) * (alturaModulo + ESPACO_ENTRE_MODULOS);
    const colunasX = [x0, x0 + LARGURA_COLUNA + LARGURA_CORREDOR];
    const vagasPorColuna = [0, 0];

    // Numeração por fileira, da esquerda para a direita
    for (let f = 0; f < fileiras && posicoes.length < total; f++) {
      for (let c = 0; c < 2 && posicoes.length < total; c++) {
        posicoes.push({ x: colunasX[c] + RECUO_VAGA, y: y0 + f * PASSO + (PASSO - ALTURA_VAGA) / 2 });
        vagasPorColuna[c]++;
      }
    }

    // Separações de cada coluna, uma a cada fileira (e a de cima e a de baixo)
    colunasX.forEach((x, c) => {
      for (let i = 0; i <= vagasPorColuna[c]; i++) reta(x, y0 + i * PASSO, x + LARGURA_COLUNA, y0 + i * PASSO);
    });
    // Paredes laterais e de cima do módulo; o corredor fica aberto embaixo
    const alturaParede = Math.max(...vagasPorColuna) * PASSO;
    reta(x0, y0, x0 + LARGURA_MODULO, y0);
    reta(x0, y0, x0, y0 + alturaParede);
    reta(x0 + LARGURA_MODULO, y0, x0 + LARGURA_MODULO, y0 + alturaParede);
  }

  // A entrada fica no corredor do módulo de baixo à esquerda
  const entrada = { x: LARGURA_COLUNA + LARGURA_CORREDOR / 2, y: altura - ALTURA_ENTRADA / 2 };

  // As preferenciais são as vagas mais próximas da entrada
  const preferenciais = Math.max(1, Math.round(total * COTA_PREFERENCIAIS));
  const idsPreferenciais = new Set(
    posicoes
      .map((p, i) => ({ i, distancia: Math.hypot(p.x + LARGURA_VAGA / 2 - entrada.x, p.y + ALTURA_VAGA / 2 - entrada.y) }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, preferenciais)
      .map((item) => item.i),
  );

  const vagasPlanta: VagaPlanta[] = posicoes.map((p, i) => ({
    ID: vagas?.[i]?.ID ?? `${prefixoId}-vaga-${i + 1}`,
    Nome: vagas?.[i]?.Nome ?? `${letra}${i + 1}`,
    Tipo: idsPreferenciais.has(i) ? 'preferencial' : 'comum',
    Pontos: [
      ponto(p.x, p.y),
      ponto(p.x + LARGURA_VAGA, p.y),
      ponto(p.x + LARGURA_VAGA, p.y + ALTURA_VAGA),
      ponto(p.x, p.y + ALTURA_VAGA),
    ],
  }));

  return { Largura: largura, Altura: altura, Entrada: ponto(entrada.x, entrada.y), Vagas: vagasPlanta, Linhas: linhas };
}
