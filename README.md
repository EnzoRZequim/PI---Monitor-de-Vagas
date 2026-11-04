# APP Vaga Livre 🅿️

Sistema de estacionamento inteligente que identifica vagas livres e ocupadas a partir de imagens de câmeras, sem sensores físicos em cada vaga.

## O que o projeto faz

- **Editor de mapas:** cadastre uma imagem do estacionamento e marque as vagas com polígonos de 4 pontos (coordenadas normalizadas de 0 a 1).
- **Monitor de vagas:** carregue uma imagem da mesma câmera, visualize os polígonos sobrepostos e classifique cada vaga como livre ou ocupada.

> ⚠️ A rota de análise ainda retorna todas as vagas como **livres**, pois o classificador de IA (modelo ONNX) ainda não foi integrado. Consulte os próximos passos em [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md).

## Tecnologias

**Backend:** Node.js, TypeScript, Express, Multer, Sharp, Zod, ONNX Runtime  
**Frontend:** React, Vite, TypeScript, SVG

## Pré-requisitos

- [Node.js](https://nodejs.org/) e NPM instalados

Python 3 + `ultralytics` só são necessários se você for **treinar/exportar o modelo de IA**.

## Como rodar

### Opção 1: Backend e Frontend separados (recomendado)

Abra **dois terminais**:

**Terminal 1 — Backend (na raiz do projeto):**

```powershell
npm install
npm run dev
```

O servidor ficará disponível em:

- API: `http://localhost:3000`
- Status: `http://localhost:3000/saude`

**Terminal 2 — Frontend (na pasta `frontend/`):**

```powershell
cd frontend
npm install
npm run dev
```

A interface ficará disponível em: `http://localhost:5173`

> O Vite faz proxy de `/mapas` e `/imagens` para o backend em `http://localhost:3000`, então o backend precisa estar rodando primeiro.

### Opção 2: Backend e Frontend juntos (`dev:all`)

```powershell
npm run dev:all
```

Esse comando roda o backend e o frontend ao mesmo tempo, mas **não funciona muito bem ainda** (pode haver problemas de porta ou sincronização). Recomendamos usar a Opção 1.

## Arquivos de teste incluídos

O repositório já vem com um mapa e uma imagem prontos para testar:

- **Mapa:** `teste2` (32 vagas já mapeadas)
- **Imagem:** `estacionamento 2` (foto de referência do estacionamento)

Após iniciar o backend e o frontend, abra `http://localhost:5173`, selecione o mapa `teste2` no Editor de mapas ou Monitor de vagas e tudo já estará carregado.

## Modelo de IA (Git LFS)

O modelo de classificação `.onnx` e `.pt` são arquivos grandes e não são versionados diretamente no Git. Eles são gerenciados via **Git LFS**.

Após clonar o repositório, baixe os modelos com:

```powershell
git lfs pull
```

O modelo deve ficar em `data/models/classificador_vagas.onnx`. Enquanto ele não estiver disponível, a rota de análise retorna todas as vagas como livres.

## Documentação detalhada

Para arquitetura, estrutura de pastas, rotas da API detalhada, uso da interface e próximos passos, consulte:

👉 [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md)
