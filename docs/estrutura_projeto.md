# Estrutura do Projeto

Este documento descreve a organização das pastas e arquivos do projeto
**PI — Monitor de Vagas**.

## Visão geral

```text
PI---Monitor-de-Vagas/
├─ backend/
├─ data/
├─ docs/
├─ frontend/
├─ scripts/
├─ node_modules/
├─ dist/
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md
└─ tsconfig.json
```

## Pastas principais

### `backend/`

Contém o código do servidor da aplicação, desenvolvido em TypeScript e executado com Node.js.

```text
backend/
└─ src/
   ├─ common/
   ├─ config/
   ├─ routes/
   ├─ services/
   ├─ types/
   └─ server.ts
```

### `backend/src/common/`

Contém recursos compartilhados por mais de uma parte do backend.

Atualmente, possui o arquivo `ResponseHelper.ts`, responsável por padronizar as respostas enviadas pela API, como respostas de sucesso, erro de validação, item não encontrado e conflito de dados.

### `backend/src/config/`

Contém configurações centralizadas da aplicação.

- `paths.ts` define os caminhos das pastas de dados (`data/images`, `data/maps`, `data/occupancy`, `data/temp`), evitando caminhos repetidos em vários arquivos.
- `ensureDirectories.ts` cria essas pastas automaticamente quando o servidor é iniciado.

### `backend/src/routes/`

Contém as rotas da API.

O arquivo `mapas.ts` registra as rotas relacionadas aos mapas de estacionamento, incluindo:

- Cadastro de mapa e imagem (`POST /mapas`);
- Listagem de mapas cadastrados (`GET /mapas`);
- Busca de um mapa pelo ID (`GET /mapas/:ID`);
- Salvamento e atualização das vagas mapeadas (`PUT /mapas/:ID/vagas`).

Cada vaga é validada com exatamente quatro pontos, com `X` e `Y` entre 0 e 1.

### `backend/src/services/`

Contém regras de acesso e persistência dos dados.

O arquivo `MapaStorage.ts` é responsável por ler e salvar os arquivos JSON dos mapas em `data/maps`, além de listar resumos de mapas (`listarMapas`) para uso nas telas de seleção.

### `backend/src/types/`

Contém os tipos e interfaces TypeScript utilizados pelo backend.

O arquivo `Mapa.ts` descreve a estrutura de um mapa, das vagas e de seus pontos normalizados.

### `backend/src/server.ts`

É o ponto de entrada do backend. Ele cria e configura o servidor Express, habilita JSON e CORS, serve imagens via `/imagens` e registra as rotas em `/mapas`.

### `data/`

Contém arquivos usados ou gerados durante a execução da aplicação. Essa pasta não é enviada ao Git, pois pode conter imagens grandes, mapas locais, resultados de execução e arquivos temporários.

```text
data/
├─ images/
├─ maps/
├─ occupancy/
└─ temp/
```

### `data/images/`

Armazena imagens de estacionamentos enviadas no cadastro de um mapa. São servidas pela API em `/imagens/:arquivo`.

### `data/maps/`

Armazena arquivos JSON com os mapas cadastrados, incluindo dados da imagem, dimensões e polígonos das vagas.

### `data/occupancy/`

Será usada futuramente para guardar os resultados da análise de ocupação de cada vaga, como `livre`, `ocupada`, nível de confiança e data/hora da análise.

### `data/temp/`

Será usada para arquivos temporários, como recortes de imagens de vagas ou arquivos intermediários criados durante a etapa de visão computacional.

### `docs/`

Contém a documentação do projeto.

O arquivo `estrutura_projeto.md` explica a finalidade de cada pasta e arquivo principal. Outros documentos podem registrar arquitetura, decisões técnicas, formato dos mapas e referências utilizadas.

### `frontend/`

Contém a interface web em React + Vite usada para mapear vagas.

```text
frontend/
├─ package.json
├─ vite.config.ts
├─ index.html
├─ public/
└─ src/
   ├─ App.tsx
   ├─ EditorVagas.tsx
   ├─ api.ts
   ├─ main.tsx
   └─ tipos.ts
```

Principais arquivos:

- `package.json`: dependências e scripts do frontend (`dev`, `build`, `lint`, `preview`).
- `vite.config.ts`: configuração do Vite, incluindo o proxy de `/mapas` e `/imagens` para o backend em `http://localhost:3000`.
- `src/App.tsx`: tela principal, com seleção/criação de mapas e edição de vagas.
- `src/EditorVagas.tsx`: renderiza a imagem e as vagas, permitindo marcar e mover pontos.
- `src/api.ts`: chamadas à API do backend.
- `src/tipos.ts`: tipos TypeScript do frontend.

Durante `npm run dev`, o frontend sobe em `http://localhost:5173`. Sua pasta `node_modules/` e `dist/` são ignoradas pelo Git.

### `scripts/`

Contém scripts auxiliares de desenvolvimento.

Atualmente, possui `dev-all.js`, que inicia o backend e o frontend juntos com o comando `npm run dev:all` na raiz do projeto.

### `node_modules/`

Contém as bibliotecas instaladas pelo NPM, como Express, Sharp, Zod, TypeScript, React e Vite.

Essa pasta é criada automaticamente pelo comando `npm install` e não deve ser enviada ao Git.

### `dist/`

Contém a versão compilada do backend (e, se builds forem executados na pasta `frontend/`, da interface compilada também).

Os arquivos TypeScript de `backend/src/` são convertidos em JavaScript nessa pasta quando o comando `npm run build` é executado na raiz.

Essa pasta não deve ser editada manualmente nem enviada ao Git, porque pode ser recriada a qualquer momento a partir do código-fonte.

## Arquivos da raiz

### `package.json`

Descreve o projeto Node.js, suas dependências e os comandos disponíveis.

Comandos principais:

```bash
npm run dev
npm run build
npm start
```

- `npm run dev`: executa o backend em modo de desenvolvimento, usando TypeScript diretamente e reiniciando ao detectar alterações.
- `npm run build`: compila o TypeScript de `backend/src/` para JavaScript dentro de `dist/`.
- `npm start`: executa a versão JavaScript compilada em `dist/`.

### `package-lock.json`

Registra as versões exatas das dependências instaladas. Deve ser enviado ao Git para que outras pessoas instalem versões compatíveis das mesmas bibliotecas.

### `tsconfig.json`

Define como o TypeScript deve verificar e compilar os arquivos do backend.

Ele informa que os arquivos-fonte estão em `backend/src/` e que a saída compilada deve ser criada em `dist/`.

### `.gitignore`

Define quais arquivos e pastas não devem ser enviados ao Git, incluindo `node_modules/`, `dist/`, `data/`, dataset local, arquivos de ambiente e logs.

### `README.md`

Apresenta o projeto, seu objetivo, instruções básicas de instalação e execução, URLs de uso e um link para a documentação em `docs/`.
