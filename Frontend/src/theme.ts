// ===== Valores =====
// Escalas do design system (nomes iguais aos do Figma). Componentes devem preferir os tokens abaixo.

export const paleta = {
  black: {
    50: "#e6e7e8",
    100: "#b1b3b7",
    200: "#8b8f94",
    300: "#565c63",
    400: "#353c45",
    500: "#030b16",
    600: "#030a14",
    700: "#020810",
    800: "#02060c",
    900: "#010509",
  },
  white: {
    50: "#fefefe",
    100: "#fcfcfc",
    200: "#fafafa",
    300: "#f8f8f8",
    400: "#f7f7f7",
    500: "#f5f5f5",
    600: "#dfdfdf",
    700: "#aeaeae",
    800: "#878787",
    900: "#676767",
  },
  blue: {
    50: "#e7eef7",
    100: "#b6cbe5",
    200: "#92b1d8",
    300: "#618ec7",
    400: "#4278bc",
    500: "#1356ab",
    600: "#114e9c",
    700: "#0d3d79",
    800: "#0a2f5e",
    900: "#082448",
  },
  green: {
    50: "#eafcf0",
    100: "#bdf5d0",
    200: "#9df0b9",
    300: "#70ea98",
    400: "#55e585",
    500: "#2adf66",
    600: "#26cb5d",
    700: "#1e9e48",
    800: "#177b38",
    900: "#125e2b",
  },
  red: {
    50: "#fceaea",
    100: "#f5bdbd",
    200: "#f09d9d",
    300: "#ea7070",
    400: "#e55555",
    500: "#df2a2a",
    600: "#cb2626",
    700: "#9e1e1e",
    800: "#7b1717",
    900: "#5e1212",
  },
  yellow: {
    50: "#fefde7",
    100: "#fbf8b4",
    200: "#f9f590",
    300: "#f6f05e",
    400: "#f4ed3e",
    500: "#f1e90e",
    600: "#dbd40d",
    700: "#aba50a",
    800: "#858008",
    900: "#656206",
  },
} as const;

// Cada peso é um arquivo de fonte separado. Para usar outro, adicione aqui e carregue em app/_layout.tsx.
export const fontes = {
  montserrat: { regular: "Montserrat_400Regular", negrito: "Montserrat_700Bold" },
  inter: {
    regular: "Inter_400Regular",
    medio: "Inter_500Medium",
    seminegrito: "Inter_600SemiBold",
    negrito: "Inter_700Bold",
  },
  spaceMono: { regular: "SpaceMono_400Regular" },
};

// Base 16, escala 1.333
export const tamanhoFonte = {
  xxs: 9,
  xs: 12,
  base: 16,
  lg: 21,
  xl: 28,
  "2xl": 38,
  "3xl": 51,
  "4xl": 67,
  "5xl": 90,
};

// Chave = token do Figma (múltiplos de 4px)
export const espaco = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  64: 256,
};

export const larguras = {
  padrao: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// ===== Tokens =====

export const cores = {
  texto: paleta.black[500],
  textoSecundario: paleta.black[400],
  textoSuave: paleta.black[200],
  textoInverso: paleta.white[50],
  fundo: paleta.white[500],
  superficie: paleta.white[50],
  borda: paleta.white[600],
  primaria: paleta.blue[500],
  primariaClara: paleta.blue[400],
  primariaEscura: paleta.blue[600],
  secundaria: paleta.blue[300],
  inativo: paleta.black[100],
  perigo: paleta.red[500],
  perigoSuave: paleta.red[300],
  logo: paleta.white[600],
};

// Cores de cima para baixo
export const gradientes = {
  primario: {
    fundo: [paleta.blue[700], paleta.blue[400]],
    borda: [paleta.blue[300], paleta.blue[700]],
  },
  primarioClaro: {
    fundo: [paleta.blue[500], paleta.blue[300]],
    borda: [paleta.blue[200], paleta.blue[500]],
  },
  secundario: {
    fundo: [paleta.white[600], paleta.white[50]],
    borda: [paleta.white[50], paleta.white[700]],
  },
  // Cartões e campos
  neutro: { borda: [paleta.white[500], paleta.white[600]] },
  foco: { borda: [paleta.blue[200], paleta.blue[400]] },
  // Card de dados (Dashboard)
  destaque: { borda: [paleta.blue[100], paleta.blue[400]] },
  navegacao: { fundo: [paleta.blue[500], paleta.blue[600]] },
} as const;

// Badge e barra dos cartões, por nível de ocupação
export const ocupacao = {
  livre: {
    fundo: [paleta.green[400], paleta.green[400]],
    borda: [paleta.green[300], paleta.green[900]],
    texto: paleta.green[900],
    barra: paleta.green[600],
  },
  moderado: {
    fundo: [paleta.yellow[600], paleta.yellow[400]],
    borda: [paleta.yellow[200], paleta.yellow[900]],
    texto: paleta.yellow[900],
    barra: paleta.yellow[600],
  },
  cheio: {
    fundo: [paleta.red[300], paleta.red[300]],
    borda: [paleta.red[200], paleta.red[900]],
    texto: paleta.red[900],
    barra: paleta.red[600],
  },
} as const;

export const raio = { cartao: 15, pilula: 999 };

export const sombras = { foco: "0px 2px 4px rgba(97, 142, 199, 0.35)" };

// Transições de hover/pressionado/liga-desliga (ms)
export const animacao = { duracao: 200 };

export const tipografia = {
  h1: { fontFamily: fontes.montserrat.negrito, fontSize: tamanhoFonte["5xl"] },
  h2: { fontFamily: fontes.montserrat.negrito, fontSize: tamanhoFonte["4xl"] },
  h3: { fontFamily: fontes.montserrat.negrito, fontSize: tamanhoFonte["3xl"] },
  h4: { fontFamily: fontes.montserrat.negrito, fontSize: tamanhoFonte["2xl"] },
  h5: { fontFamily: fontes.montserrat.negrito, fontSize: tamanhoFonte.xl },
  h6: { fontFamily: fontes.montserrat.negrito, fontSize: tamanhoFonte.lg },
  corpo: { fontFamily: fontes.inter.regular, fontSize: tamanhoFonte.base },
  pequeno: { fontFamily: fontes.inter.regular, fontSize: tamanhoFonte.xs },
  tag: { fontFamily: fontes.spaceMono.regular, fontSize: tamanhoFonte.xxs },
};

// Largura máxima do conteúdo no desktop
export const LARGURA_CONTEUDO = larguras.lg;
