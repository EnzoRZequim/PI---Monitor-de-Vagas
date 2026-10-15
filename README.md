# APP Vaga Livre 🅿️

**Sua vaga, sem voltas.**

O **APP Vaga Livre** é um projeto de estacionamento inteligente que utiliza imagens de câmeras para identificar vagas livres e ocupadas, sem exigir sensores dedicados em cada vaga.

## Estado atual

A etapa implementada é o **mapeamento manual de vagas em uma imagem de referência** e o **monitor de vagas com sobreposição do mapa em outras imagens**.

A interface web é uma aplicação React + Vite, servida separadamente do backend. Ela possui duas abas:

- **Editor de mapas:** cadastrar uma imagem JPG ou PNG de um estacionamento e criar um mapa; listar e abrir mapas; marcar, ajustar, renomear e excluir vagas com polígonos de quatro pontos; salvar coordenadas normalizadas entre 0 e 1.
- **Monitor de vagas:** selecionar um mapa e uma imagem qualquer da mesma câmera/ângulo; visualizar os polígonos das vagas sobrepostos à imagem; enviar a imagem para análise e visualizar cada vaga classificada como livre (verde) ou ocupada (vermelho).

A rota de análise (`POST /mapas/:ID/analisar`) já valida a imagem e retorna o estado de cada vaga. Atualmente ela retorna todas as vagas como livres, pois o classificador de vagas ainda não foi integrado.

A classificação de vagas como livres ou ocupadas por IA, a histerese e a atualização em tempo real ainda não foram implementadas.

## Tecnologias

Backend:

- Node.js
- TypeScript
- Express
- Multer
- Sharp
- Zod
- ONNX Runtime (`onnxruntime-node`)

Frontend:

- React
- Vite
- TypeScript
- HTML, CSS e SVG

## Pré-requisitos

- [Node.js](https://nodejs.org/) e NPM instalados.
- [Python 3](https://www.python.org/) com o pacote `ultralytics` instalado, apenas para treinar e exportar o modelo de classificação uma única vez.
- Uma imagem JPG ou PNG de estacionamento para criar um mapa.
- Terminais abertos na raiz do projeto (backend) e em `frontend/` (interface).

Não é necessário instalar banco de dados nesta etapa.

## Instalação e execução

### Backend

Na raiz do projeto, instale as dependências:

```bat
npm install
```

### Modelo de classificação (uma única vez)

O backend utiliza um modelo ONNX que classifica cada recorte de vaga como livre ou ocupada. O modelo será treinado com o dataset PKLot e exportado para `data/models/classificador_vagas.onnx`.

Enquanto o modelo não estiver disponível, a rota de análise retorna todas as vagas como livres.

### Iniciar o backend

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

### Editor de mapas

1. Inicie o backend com `npm run dev` na raiz.
2. Inicie o frontend com `npm run dev` em `frontend/`.
3. Abra `http://localhost:5173` e permaneça na aba **Editor de mapas**.
4. Selecione um mapa existente ou crie um novo informando ID, nome e imagem.
5. Clique em **Nova vaga**.
6. Marque exatamente os quatro cantos da vaga.
7. Informe o nome da vaga e clique em **Salvar vagas**.
8. Ajuste, renomeie ou exclua vagas quando necessário e clique novamente em **Salvar vagas**.

Cada vaga possui um `ID`, um `Nome` e exatamente quatro pontos normalizados entre 0 e 1.

### Monitor de vagas

1. Vá para a aba **Monitor de vagas**.
2. Selecione um mapa cadastrado.
3. Selecione uma imagem da mesma câmera/ângulo do mapa.
4. Os polígonos das vagas aparecem sobrepostos à imagem.
5. Clique em **Analisar** para classificar as vagas.

A imagem enviada precisa ter proporção compatível com a imagem de referência do mapa, pois as coordenadas das vagas são normalizadas.

## Dados locais

Ao iniciar o servidor (`npm run dev` na raiz ou `npm start`), a aplicação cria automaticamente, na raiz do projeto, a pasta `data/` e todas as subpastas abaixo, caso ainda não existam. **Não é necessário criar essas pastas manualmente.**

```text
data/
├─ images/
├─ maps/
├─ models/
├─ occupancy/
└─ temp/
```

| Pasta             | Finalidade                                       |
| ----------------- | ------------------------------------------------ |
| `data/images/`    | Imagens de referência cadastradas                |
| `data/maps/`      | Arquivos JSON contendo mapas e vagas             |
| `data/models/`    | Modelo de classificação em formato ONNX          |
| `data/occupancy/` | Resultados de ocupação das vagas                 |
| `data/temp/`      | Arquivos temporários do processamento de imagens |

A pasta `data/` é ignorada pelo Git porque contém arquivos criados localmente durante a execução, incluindo o modelo de IA. Por isso, ao clonar o projeto em outra máquina, basta iniciar o servidor para que a estrutura seja recriada e, em seguida, colocar o modelo `.onnx` em `data/models/`.

Os caminhos ficam centralizados em `backend/src/config/paths.ts`, o que mantém a execução consistente mesmo com `npm start`.

## Imagens

As imagens de referência dos mapas são salvas em `data/images/` e servidas pela API em `/imagens/:arquivo`. A interface React usa esse endpoint para exibir a imagem de referência de cada mapa.

As imagens enviadas na análise (aba Monitor) são processadas em memória e não são salvas.

## Dataset de exemplo

O dataset [PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot) será usado para treinar e avaliar o classificador de vagas, pois já traz cada vaga rotulada como livre ou ocupada.

O dataset deve permanecer separado da pasta `data/`. Para o mapeamento, basta escolher uma imagem de referência por câmera ou cenário; não é necessário cadastrar todas as imagens do dataset.

Antes de usar o dataset em relatórios ou apresentações, consulte os termos de licença e a atribuição necessária na [página do PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot).

## API disponível

| Método | Rota                  | Função                                          |
| ------ | --------------------- | ----------------------------------------------- |
| `GET`  | `/saude`              | Verifica se a API está respondendo              |
| `GET`  | `/mapas`              | Lista mapas cadastrados                         |
| `POST` | `/mapas`              | Cadastra uma imagem e cria um mapa vazio        |
| `GET`  | `/mapas/:ID`          | Retorna um mapa cadastrado                      |
| `PUT`  | `/mapas/:ID/vagas`    | Atualiza a lista completa de vagas do mapa      |
| `POST` | `/mapas/:ID/analisar` | Analisa uma imagem e retorna o estado das vagas |
| `GET`  | `/imagens/:arquivo`   | Exibe uma imagem de referência cadastrada       |

No `POST /mapas`, envie `multipart/form-data` com `ID`, `Nome` e `Imagem`.

No `PUT /mapas/:ID/vagas`, envie um JSON com a lista completa de vagas. Cada vaga deve possuir `ID`, `Nome` e exatamente quatro `Pontos`, com `X` e `Y` entre 0 e 1.

No `POST /mapas/:ID/analisar`, envie `multipart/form-data` com o campo `Imagem`. A resposta contém `MapaID`, `Data` e a lista de vagas com `ID`, `Nome`, `Ocupada` e `Sobreposicao`.

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
│  ├─ models/
│  ├─ occupancy/
│  └─ temp/
├─ docs/
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ src/
├─ scripts/
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

| Comando                | Finalidade                                   |
| ---------------------- | -------------------------------------------- |
| `npm install`          | Instala as dependências do projeto           |
| `npm run dev`          | Executa o backend em modo de desenvolvimento |
| `npm run dev:all`      | Executa backend e frontend juntos            |
| `npm run dev:frontend` | Executa somente o frontend                   |
| `npm run build`        | Compila o TypeScript para a pasta `dist/`    |
| `npm start`            | Executa a versão compilada do backend        |

### Frontend (`frontend/`)

| Comando           | Finalidade                                     |
| ----------------- | ---------------------------------------------- |
| `npm install`     | Instala as dependências do frontend            |
| `npm run dev`     | Executa a interface em modo de desenvolvimento |
| `npm run build`   | Compila a interface para `frontend/dist/`      |
| `npm run preview` | Exibe a build de produção localmente           |

## Próximas etapas

1. Treinar um classificador de vagas (livre/ocupada) com o dataset PKLot e exportar para ONNX.
2. Integrar o classificador à rota `POST /mapas/:ID/analisar`.
3. Aplicar histerese para evitar alternância de estado entre análises consecutivas.
4. Armazenar resultados de ocupação em `data/occupancy/`.
5. Avaliar acurácia, precisão e recall com o PKLot.
6. Integrar atualização em tempo real (foto a cada X segundos de vídeo/câmera).