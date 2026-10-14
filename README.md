# APP Vaga Livre 🅿️

**Sua vaga, sem voltas.**

O **APP Vaga Livre** é um projeto de estacionamento inteligente que utiliza imagens de câmeras para identificar vagas livres e ocupadas, sem exigir sensores dedicados em cada vaga.

## Estado atual

A etapa implementada é o **mapeamento manual de vagas em uma imagem de referência**.

A interface web agora é uma aplicação React + Vite, servida separadamente do backend. Ela permite:

- Cadastrar uma imagem JPG ou PNG de um estacionamento e criar um mapa.
- Listar e abrir mapas já cadastrados.
- Exibir a imagem em um editor web e marcar as vagas com polígonos.
- Criar, ajustar, renomear e excluir vagas sobre a imagem.
- Representar cada vaga com um polígono de exatamente quatro pontos.
- Salvar as coordenadas dos pontos normalizadas entre 0 e 1.
- Armazenar imagens e mapas localmente em arquivos JSON.

A detecção de carros, a classificação de vagas como livres ou ocupadas, a atualização em tempo real e a interface final de monitoramento ainda não foram implementadas.

## Tecnologias

Backend:

- Node.js
- TypeScript
- Express
- Multer
- Sharp
- Zod

Frontend:

- React
- Vite
- TypeScript
- HTML, CSS e SVG

## Pré-requisitos

- [Node.js](https://nodejs.org/) e NPM instalados.
- Uma imagem JPG ou PNG de estacionamento para criar um mapa.
- Terminais abertos na raiz do projeto (backend) e em `frontend/` (interface).

Não é necessário instalar banco de dados nesta etapa.

## Instalação e execução

### Backend

Na raiz do projeto, instale as dependências:

```bat
npm install
```

Inicie o backend em modo de desenvolvimento:

```bat
npm run dev
```

O servidor ficará disponível em:

```text
API:       http://localhost:3000
Status:    http://localhost:3000/saude
```

Para interromper o servidor, pressione `Ctrl + C`.

### Frontend (interface React + Vite)

Em outro terminal, entre na pasta do frontend e instale as dependências:

```bat
cd frontend
npm install
```

Inicie o frontend em modo de desenvolvimento:

```bat
npm run dev
```

A interface ficará disponível em:

```text
Frontend:  http://localhost:5173
```

O Vite faz proxy de `/mapas` e `/imagens` para `http://localhost:3000`, então o backend precisa estar rodando.

## Compilação

Para verificar os tipos e gerar a versão compilada do backend:

```bat
npm run build
```

O comando cria a pasta `dist/`, contendo os arquivos JavaScript compilados a partir de `backend/src/`.

Para executar a versão compilada:

```bat
npm start
```

A pasta `dist/` é gerada automaticamente e não deve ser editada manualmente.

Para a interface, os scripts equivalentes são, dentro de `frontend/`:

```bat
npm run build
npm run preview
```

## Uso da interface

1. Inicie o backend com `npm run dev` na raiz.
2. Inicie o frontend com `npm run dev` em `frontend/`.
3. Abra `http://localhost:5173`.
4. Selecione um mapa existente ou crie um novo informando ID, nome e imagem.
5. Clique em **Nova vaga**.
6. Marque exatamente os quatro cantos da vaga.
7. Informe o nome da vaga e clique em **Salvar vagas**.
8. Ajuste, renomeie ou exclua vagas quando necessário e clique novamente em **Salvar vagas**.

Cada vaga possui um `ID`, um `Nome` e exatamente quatro pontos normalizados entre 0 e 1.

## Dados locais

Ao iniciar o servidor, a aplicação cria automaticamente, na raiz do projeto:

```text
data/
├─ images/
├─ maps/
├─ occupancy/
└─ temp/
```

| Pasta             | Finalidade                                                      |
| ----------------- | --------------------------------------------------------------- |
| `data/images/`    | Imagens de referência cadastradas                               |
| `data/maps/`      | Arquivos JSON contendo mapas e vagas                            |
| `data/occupancy/` | Reservada para resultados futuros de ocupação                   |
| `data/temp/`      | Reservada para arquivos temporários do processamento de imagens |

A pasta `data/` é ignorada pelo Git porque contém arquivos criados localmente durante a execução. Os caminhos ficam centralizados em `backend/src/config/paths.ts`, o que mantém a execução consistente mesmo com `npm start`.

## Imagens

As imagens cadastradas são salvas em `data/images/` e servidas pela API em `/imagens/:arquivo`. A interface React usa esse endpoint para exibir a imagem de referência de cada mapa.

## Dataset de exemplo

O dataset [PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot) pode ser usado como fonte opcional de imagens para teste e, futuramente, para avaliação da detecção de ocupação.

O dataset deve permanecer separado da pasta `data/`. Para o mapeamento, basta escolher uma imagem de referência por câmera ou cenário; não é necessário cadastrar todas as imagens do dataset.

Antes de usar o dataset em relatórios ou apresentações, consulte os termos de licença e a atribuição necessária na [página do PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot).

## API disponível

| Método | Rota                | Função                                     |
| ------ | ------------------- | ------------------------------------------ |
| `GET`  | `/saude`            | Verifica se a API está respondendo         |
| `GET`  | `/mapas`            | Lista mapas cadastrados                   |
| `POST` | `/mapas`            | Cadastra uma imagem e cria um mapa vazio   |
| `GET`  | `/mapas/:ID`        | Retorna um mapa cadastrado                 |
| `PUT`  | `/mapas/:ID/vagas`  | Atualiza a lista completa de vagas do mapa |
| `GET`  | `/imagens/:arquivo` | Exibe uma imagem cadastrada               |

No `POST /mapas`, envie `multipart/form-data` com `ID`, `Nome` e `Imagem`.

No `PUT /mapas/:ID/vagas`, envie um JSON com a lista completa de vagas. Cada vaga deve possuir `ID`, `Nome` e exatamente quatro `Pontos`, com `X` e `Y` entre 0 e 1.

## Estrutura do projeto

```text
PI---Monitor-de-Vagas/
├─ backend/
│  └─ src/
│     ├─ common/
│     ├─ config/
│     ├─ routes/
│     ├─ services/
│     ├─ types/
│     └─ server.ts
├─ data/
│  ├─ images/
│  ├─ maps/
│  ├─ occupancy/
│  └─ temp/
├─ docs/
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ src/
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md
└─ tsconfig.json
```

Para uma descrição detalhada da estrutura e da responsabilidade de cada pasta, consulte:

- [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md)

## Comandos disponíveis

### Backend (raiz)

| Comando         | Finalidade                                   |
| --------------- | -------------------------------------------- |
| `npm install`   | Instala as dependências do projeto           |
| `npm run dev`   | Executa o backend em modo de desenvolvimento |
| `npm run build` | Compila o TypeScript para a pasta `dist/`    |
| `npm start`     | Executa a versão compilada do backend        |

### Frontend (`frontend/`)

| Comando         | Finalidade                                   |
| --------------- | -------------------------------------------- |
| `npm install`   | Instala as dependências do frontend         |
| `npm run dev`   | Executa a interface em modo de desenvolvimento |
| `npm run build` | Compila a interface para `frontend/dist/`    |
| `npm run preview` | Exibe a build de produção localmente      |

## Próximas etapas

1. Aprimorar a usabilidade do editor de vagas.
2. Processar imagens de estacionamento.
3. Identificar veículos nas regiões mapeadas.
4. Classificar vagas como livres ou ocupadas.
5. Armazenar resultados de ocupação.
6. Integrar uma interface para exibir as vagas disponíveis.
