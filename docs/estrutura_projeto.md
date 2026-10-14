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

O arquivo `paths.ts` define os caminhos das pastas de dados, evitando que caminhos como `data/images` e `data/maps` sejam repetidos manualmente em vários arquivos.

### `backend/src/routes/`

Contém as rotas da API.

O arquivo `mapas.ts` registra as rotas relacionadas aos mapas de estacionamento, incluindo:

- Cadastro de mapa e imagem;
- Busca de um mapa pelo ID;
- Salvamento e atualização das vagas mapeadas.

### `backend/src/services/`

Contém regras de acesso e persistência dos dados.

O arquivo `MapaStorage.ts` é responsável por ler e salvar os arquivos JSON dos mapas na pasta `data/maps`.

### `backend/src/types/`

Contém os tipos e interfaces TypeScript utilizados pelo backend.

O arquivo `Mapa.ts` descreve a estrutura de um mapa, das vagas e de seus pontos normalizados.

### `backend/src/server.ts`

É o ponto de entrada do backend. Ele cria e configura o servidor Express, habilita recursos como JSON e CORS e registra as rotas de mapas.

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

Armazena imagens de estacionamentos enviadas no cadastro de um mapa.

### `data/maps/`

Armazena arquivos JSON com os mapas cadastrados, incluindo dados da imagem, dimensões e polígonos das vagas.

### `data/occupancy/`

Será usada futuramente para guardar os resultados da análise de ocupação de cada vaga, como `livre`, `ocupada`, nível de confiança e data/hora da análise.

### `data/temp/`

Será usada para arquivos temporários, como recortes de imagens de vagas ou arquivos intermediários criados durante a etapa de visão computacional.

### `docs/`

Contém a documentação do projeto.

O arquivo `estrutura-do-projeto.md` explica a finalidade de cada pasta e arquivo principal. Outros documentos podem registrar arquitetura, decisões técnicas, formato dos mapas e referências utilizadas.

### `frontend/`

Contém a interface web do projeto.

Atualmente, o arquivo `editor.html` apresenta o editor de vagas, permitindo visualizar uma imagem, marcar as vagas com polígonos e enviar os dados para a API.

O frontend atual é estático e não utiliza React, Vue, Angular ou Vite. Por isso, ele não possui `package.json` ou `node_modules` próprios.

### `node_modules/`

Contém as bibliotecas instaladas pelo NPM, como Express, Sharp, Zod, TypeScript e TSX.

Essa pasta é criada automaticamente pelo comando `npm install` e não deve ser enviada ao Git.

### `dist/`

Contém a versão compilada do backend.

Os arquivos TypeScript de `backend/src/` são convertidos em JavaScript nessa pasta quando o comando `npm run build` é executado.

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

Apresenta o projeto, seu objetivo, instruções básicas de instalação e execução e um link para a documentação em `docs/`.