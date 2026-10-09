# APP Vaga Livre 🅿

**Sua vaga, sem voltas.**

O APP Vaga Livre é um projeto de estacionamento inteligente. A proposta é usar imagens de câmeras para identificar vagas livres e apresentar essa informação aos motoristas em uma interface visual, sem exigir um sensor dedicado em cada vaga.

## Estado atual

A etapa implementada até agora é o **mapeamento manual das vagas de uma imagem de referência**:

- O backend recebe uma imagem e cria um mapa vazio.
- Uma página provisória exibe a imagem e permite desenhar, ajustar e excluir polígonos de vagas.
- Os pontos são salvos com coordenadas normalizadas entre 0 e 1.
- Os mapas ficam em arquivos JSON e as imagens ficam armazenadas localmente.

Em paralelo, a interface definitiva está sendo desenvolvida como um **app Expo** (React Native) na pasta `Frontend/`:

- Tela inicial com atalho para o último local visitado, salvo no próprio aparelho.
- Lista de parceiros, campi de cada parceiro e ocupação das vagas por bloco, com busca.
- Design system com as cores, fontes e componentes definidos no Figma.

A classificação de vagas como livres ou ocupadas e a atualização em tempo real **ainda não foram implementadas**. O app ainda usa dados provisórios e não está conectado ao backend. O `Frontend/editor.html` é só uma ferramenta de teste do mapeamento.

## Pré-requisitos

- Node.js e npm instalados.
- Uma imagem JPG ou PNG de um estacionamento para cadastrar como referência.
- Acesso a um terminal na raiz do projeto.
- Para testar o app: o aplicativo **Expo Go** no celular (Android ou iOS) ou um navegador.

Não é necessário instalar PostgreSQL nesta etapa.

## Instalação

Clone o repositório ou baixe seus arquivos. No terminal, entre na pasta raiz do projeto — a pasta que contém `package.json` e `src/`, não a pasta `Frontend/` — e instale as dependências do backend:

```bat
npm install
```

Confira se o TypeScript não aponta erros:

```bat
npx tsc --noEmit
```

Inicie o backend a partir da **raiz do projeto**:

```bat
npx tsx src/server.ts
```

Deixe esse terminal aberto. Por padrão, a API ficará em `http://localhost:3000`. Para verificar se está respondendo, abra:

```text
http://localhost:3000/saude
```

A resposta esperada é `{"status":"ok"}`. Para parar o servidor, pressione `Ctrl+C`.

> Execute o servidor a partir da raiz do projeto: os caminhos de `data/maps`, `data/images` e `Frontend/editor.html` são resolvidos a partir da pasta em que o comando foi iniciado.

## Dados de exemplo

É possível usar **qualquer imagem JPG ou PNG** de uma câmera de estacionamento para testar o editor. O formato COCO e as anotações não são necessários para cadastrar e desenhar um mapa manualmente.

Para usar imagens de exemplo, o dataset [PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot) oferece downloads nas opções `640` e `raw`. Se escolher `640`, baixe as imagens e selecione um arquivo `.jpg` de uma das pastas extraídas. O dataset é opcional: não é necessário incluí-lo no repositório nem importá-lo para o backend. O Roboflow informa licença **CC BY 4.0** e pede atribuição ao trabalho original ao usar o dataset em publicações. [292]

## Cadastrar uma imagem e um mapa

Com o servidor ligado, abra **outro terminal** na raiz do projeto. O cadastro é feito por `POST /mapas`, usando um arquivo JPG ou PNG existente no seu computador.

No Prompt de Comando do Windows (`cmd`):

```bat
curl.exe -X POST "http://localhost:3000/mapas" -F "ID=estacionamento-01" -F "Nome=Estacionamento 01" -F "Imagem=@CAMINHO_REAL_DA_IMAGEM.jpg"
```

**Antes de executar**, substitua `CAMINHO_REAL_DA_IMAGEM.jpg` pelo caminho completo de um arquivo real. Por exemplo, se você baixou o PKLot dentro do projeto, localize uma foto com:

```bat
dir /s /b "PKLot.v2-640.coco\*.jpg"
```

Copie **uma linha completa** retornada pelo `dir` e coloque-a depois do `@` no comando de cadastro. Mantenha as aspas em torno de `"Imagem=@..."`, especialmente se o caminho tiver espaços. Não execute o texto `CAMINHO_REAL_DA_IMAGEM.jpg` literalmente.

Uma resposta com `"statusCode":201` indica que o mapa foi criado. Um ID já cadastrado é recusado; o cadastro não substitui o mapa anterior. O sistema salva:

```text
data/
├── images/
│   └── estacionamento-01.jpg
└── maps/
    └── estacionamento-01.json
```

A extensão da imagem salva seguirá o formato identificado pelo servidor: `.jpg` ou `.png`.

## Editar as vagas na imagem

1. Abra `http://localhost:3000/editor` no navegador.
2. No campo de ID, informe o mesmo ID usado no cadastro, por exemplo `estacionamento-01`, e clique em **Carregar mapa**.
3. Clique em **Nova vaga** e depois nos cantos da vaga sobre a imagem. Marque pelo menos três pontos.
4. Clique em **Concluir vaga**, informe um nome e clique em **Salvar vagas**.
5. Para ajustar uma vaga, clique no polígono e arraste seus pontos. Para removê-la, selecione-a e clique em **Excluir selecionada**. Salve novamente para persistir as alterações.

O editor não faz upload: uma imagem precisa ser cadastrada pela API **antes** de abrir seu mapa na tela. Se aparecer “Mapa não encontrado”, confira o ID digitado e se o cadastro retornou `201`.

Para verificar a persistência, abra `http://localhost:3000/mapas/estacionamento-01` ou consulte o arquivo em `data/maps`. A imagem cadastrada também pode ser aberta em `http://localhost:3000/imagens/estacionamento-01.jpg`, ajustando o ID e a extensão conforme o cadastro.

## API disponível

| Método | Rota                | Função                                 |
| ------ | ------------------- | -------------------------------------- |
| GET    | `/saude`            | Verifica se a API está respondendo     |
| POST   | `/mapas`            | Cadastra imagem e cria um mapa vazio   |
| GET    | `/mapas/:ID`        | Retorna um mapa cadastrado             |
| PUT    | `/mapas/:ID/vagas`  | Substitui a lista de vagas do mapa     |
| GET    | `/imagens/:arquivo` | Exibe uma imagem cadastrada            |
| GET    | `/editor`           | Abre a página provisória de mapeamento |

No `POST /mapas`, envie `multipart/form-data` com os campos `ID`, `Nome` e o arquivo `Imagem`. No `PUT /mapas/:ID/vagas`, envie JSON com uma propriedade `Vagas` contendo a lista completa. Cada vaga deve ter `ID`, `Nome` e pelo menos três `Pontos` com `X` e `Y` entre 0 e 1.

## Executar o app

O app fica na pasta `Frontend/` e tem dependências próprias, separadas das do backend. Nesta etapa ele não precisa do backend ligado. Em um terminal, entre na pasta e instale as dependências:

```bat
cd Frontend
npm install
```

O aviso `npm warn deprecated uuid@7.0.3` e o resumo de vulnerabilidades no final da instalação são esperados: vêm das ferramentas internas do Expo e não impedem o app de rodar. **Não execute `npm audit fix --force`**, pois ele rebaixa o Expo para uma versão antiga e quebra o projeto.

Confira se o TypeScript não aponta erros:

```bat
npx tsc --noEmit
```

Inicie o servidor de desenvolvimento:

```bat
npx expo start
```

Escaneie o QR code exibido no terminal com o Expo Go (Android) ou com a câmera (iOS). O celular precisa estar na mesma rede Wi-Fi do computador. Para abrir no navegador, pressione `w`. Para parar, pressione `Ctrl+C`.

> Para adicionar bibliotecas ao app, use `npx expo install <pacote>` em vez de `npm install <pacote>`: o Expo escolhe a versão compatível com o SDK do projeto. Se o `npm install` voltar a mostrar avisos `ERESOLVE`, rode `npx expo install --fix`.

## Organização desta etapa

- `src/`: backend Node.js, TypeScript e Express.
- `Frontend/`: app Expo (React Native e TypeScript) com a interface definitiva.
  - `Frontend/src/app/`: telas do app; cada arquivo é uma rota do Expo Router.
  - `Frontend/src/components/`: componentes do design system.
  - `Frontend/src/dados/`: dados provisórios dos parceiros e o último local visitado.
  - `Frontend/src/theme.ts`: cores, fontes, espaçamentos e tipografia vindos do Figma.
- `Frontend/editor.html`: editor provisório para testar os polígonos.
- `data/maps/`: mapas cadastrados em JSON.
- `data/images/`: imagens de referência cadastradas.

O backend e o frontend são responsabilidades separadas, cada um com seu próprio `package.json`. O `editor.html` existe apenas para validar o fluxo de mapeamento, e o app ainda será conectado à API.