# APP Vaga Livre 🅿️

**Sua vaga, sem voltas.**

O **APP Vaga Livre** é um projeto de estacionamento inteligente que utiliza imagens de câmeras para identificar vagas livres e ocupadas, sem exigir sensores dedicados em cada vaga.

## Estado atual

A etapa implementada é o **mapeamento manual de vagas em uma imagem de referência**.

O sistema atualmente permite:

- Cadastrar uma imagem JPG ou PNG de um estacionamento.
- Criar um mapa associado à imagem cadastrada.
- Exibir a imagem em um editor web provisório.
- Criar, ajustar e excluir vagas sobre a imagem.
- Representar cada vaga com um polígono de exatamente quatro pontos.
- Salvar as coordenadas dos pontos normalizadas entre 0 e 1.
- Armazenar imagens e mapas localmente em arquivos JSON.

A detecção de carros, a classificação de vagas como livres ou ocupadas, a atualização em tempo real e a interface definitiva ainda não foram implementadas.

## Tecnologias

- Node.js
- TypeScript
- Express
- Multer
- Sharp
- Zod
- HTML, CSS e JavaScript puro

## Pré-requisitos

- [Node.js](https://nodejs.org/) e NPM instalados.
- Uma imagem JPG ou PNG de estacionamento para criar um mapa.
- Terminal aberto na raiz do projeto.

Não é necessário instalar banco de dados nesta etapa.

## Instalação e execução

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
Editor:    http://localhost:3000/editor
Status:    http://localhost:3000/saude
```

Para interromper o servidor, pressione `Ctrl + C`.

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

## Uso do editor

1. Inicie o backend com `npm run dev`.
2. Cadastre uma imagem e crie um mapa.
3. Abra `http://localhost:3000/editor`.
4. Informe o ID do mapa e clique em **Carregar mapa**.
5. Clique em **Nova vaga**.
6. Marque exatamente os quatro cantos da vaga.
7. Clique em **Concluir vaga**, informe seu nome e salve.
8. Ajuste ou exclua vagas quando necessário e clique em **Salvar vagas**.

Cada vaga possui um `ID`, um `Nome` e exatamente quatro pontos normalizados entre 0 e 1.

## Dados locais

Ao iniciar o servidor, a aplicação cria automaticamente:

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

A pasta `data/` é ignorada pelo Git porque contém arquivos criados localmente durante a execução.

## Dataset de exemplo

O dataset [PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot) pode ser usado como fonte opcional de imagens para teste e, futuramente, para avaliação da detecção de ocupação.

O dataset deve permanecer separado da pasta `data/`. Para o mapeamento, basta escolher uma imagem de referência por câmera ou cenário; não é necessário cadastrar todas as imagens do dataset.

Antes de usar o dataset em relatórios ou apresentações, consulte os termos de licença e a atribuição necessária na [página do PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot). [292]

## API disponível

| Método | Rota                | Função                                     |
| ------ | ------------------- | ------------------------------------------ |
| `GET`  | `/saude`            | Verifica se a API está respondendo         |
| `POST` | `/mapas`            | Cadastra uma imagem e cria um mapa vazio   |
| `GET`  | `/mapas/:ID`        | Retorna um mapa cadastrado                 |
| `PUT`  | `/mapas/:ID/vagas`  | Atualiza a lista completa de vagas do mapa |
| `GET`  | `/imagens/:arquivo` | Exibe uma imagem cadastrada                |
| `GET`  | `/editor`           | Abre o editor provisório de vagas          |

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
│  └─ editor.html
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md
└─ tsconfig.json
```

Para uma descrição detalhada da estrutura e da responsabilidade de cada pasta, consulte:

- [`docs/estrutura-do-projeto.md`](docs/estrutura-do-projeto.md)

## Comandos disponíveis

| Comando         | Finalidade                                   |
| --------------- | -------------------------------------------- |
| `npm install`   | Instala as dependências do projeto           |
| `npm run dev`   | Executa o backend em modo de desenvolvimento |
| `npm run build` | Compila o TypeScript para a pasta `dist/`    |
| `npm start`     | Executa a versão compilada do backend        |

## Próximas etapas

1. Aprimorar a usabilidade do editor de vagas.
2. Processar imagens de estacionamento.
3. Identificar veículos nas regiões mapeadas.
4. Classificar vagas como livres ou ocupadas.
5. Armazenar resultados de ocupação.
6. Integrar uma interface para exibir as vagas disponíveis.