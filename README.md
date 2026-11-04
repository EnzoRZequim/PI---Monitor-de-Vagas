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
- Duas terminais abertas: uma na raiz do projeto (backend) e outra em `frontend/` (interface)

Python 3 + `ultralytics` só são necessários se você for **treinar/exportar o modelo de IA**.

## Como rodar

### 1. Backend (raiz do projeto)

```powershell
npm install
npm run dev
```

O servidor ficará disponível em:

- API: `http://localhost:3000`
- Status: `http://localhost:3000/saude`

### 2. Frontend (em outro terminal)

```powershell
cd frontend
npm install
npm run dev
```

A interface ficará disponível em: `http://localhost:5173`

> O Vite faz proxy de `/mapas` e `/imagens` para o backend, então o backend precisa estar rodando.

### 3. Modelo de IA (opcional para esta etapa)

O modelo `.onnx` deve ficar em `data/models/classificador_vagas.onnx`. Essa pasta não é versionada no Git, então, se clonar o projeto em outra máquina, coloque o modelo manualmente nessa pasta antes de usar a análise por IA.

## Documentação detalhada

Para arquitetura, estrutura de pastas, rotas da API detalhada, uso da interface e próximos passos, consulte:

👉 [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md)
