# Estrutura do Projeto

Este documento descreve a organização das pastas e arquivos do projeto **PI — Monitor de Vagas**, detalhando responsabilidades, rotas da API e próximos passos.

## Visão geral

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
│  ├─ index.html
│  ├─ public/
│  └─ src/
│     ├─ App.tsx
│     ├─ EditorVagas.tsx
│     ├─ api.ts
│     ├─ main.tsx
│     └─ tipos.ts
├─ scripts/
├─ treino/
│  ├─ Classificador/
│  ├─ Mapeador/
│  ├─ dados/
│  └─ ia_mapa/
├─ node_modules/
├─ dist/
├─ .gitattributes
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md
├─ requirements.txt
├─ tsconfig.json
└─ .venv/
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

Recursos compartilhados por mais de uma parte do backend. Possui `ResponseHelper.ts`, que padroniza respostas da API (sucesso, erro de validação, item não encontrado, conflito de dados).

### `backend/src/config/`

Configurações centralizadas.

- `paths.ts`: caminhos das pastas de dados (`data/images`, `data/maps`, `data/occupancy`, `data/temp`).
- `ensureDirectories.ts`: cria essas pastas automaticamente ao iniciar o servidor.

### `backend/src/routes/`

Rotas da API. O arquivo `mapas.ts` registra:

- `POST /mapas` — cadastra imagem e cria mapa vazio;
- `GET /mapas` — lista mapas cadastrados;
- `GET /mapas/:ID` — busca mapa pelo ID;
- `PUT /mapas/:ID/vagas` — salva/atualiza vagas mapeadas;
- `POST /mapas/:ID/analisar` — analisa imagem e retorna estado das vagas.

Cada vaga é validada com exatamente quatro pontos, com `X` e `Y` entre 0 e 1.

### `backend/src/services/`

Regras de acesso e persistência. `MapaStorage.ts` lê e salva arquivos JSON dos mapas em `data/maps`, além de listar resumos (`listarMapas`).

### `backend/src/types/`

Tipos e interfaces TypeScript. `Mapa.ts` descreve estrutura de mapa, vagas e pontos normalizados.

### `backend/src/server.ts`

Ponto de entrada. Configura Express, JSON, CORS, serve imagens via `/imagens` e registra rotas em `/mapas`.

### `data/`

Arquivos usados ou gerados durante a execução. **Não é enviada ao Git** (imagens, mapas locais, resultados, temporários).

```text
data/
├─ images/    Imagens de referência cadastradas
├─ maps/      Arquivos JSON com mapas e vagas
├─ models/    Modelo de classificação ONNX
├─ occupancy/ Resultados de ocupação (futuro)
└─ temp/      Arquivos temporários de processamento
```

Ao iniciar o servidor, a aplicação cria essa estrutura automaticamente na raiz do projeto.

### `docs/`

Documentação do projeto. Este arquivo explica pastas e responsabilidades.

### `frontend/`

Interface web em React + Vite.

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

- `App.tsx`: tela principal, seleção/criação de mapas e edição de vagas.
- `EditorVagas.tsx`: renderiza imagem e vagas, permite marcar e mover pontos.
- `api.ts`: chamadas à API do backend.
- `tipos.ts`: tipos TypeScript do frontend.

Durante `npm run dev`, sobe em `http://localhost:5173`. `node_modules/` e `dist/` são ignoradas pelo Git.

### `scripts/`

Scripts auxiliares. Possui `dev-all.js` (inicia backend e frontend juntos via `npm run dev:all`).

### `treino/`

Scripts e recursos de treinamento e inferência de IA em Python. Não é enviado ao Git (exceto scripts úteis via `.gitignore` exceções).

```text
treino/
├─ Classificador/     Preparo e treino do classificador de vagas
├─ Mapeador/          Treino de segmentação, exportação ONNX e validação
├─ dados/             Dataset local de treino (imagens — ignorado pelo Git)
└─ ia_mapa/           Serviço SAM (Segment Anything Model) para detecção de vagas
```

- `treino/Classificador/` — scripts `preparar_dados.py` e `treinar.py`
- `treino/Mapeador/` — scripts `preparar_dataset.py`, `treinar_segmentacao.py`, `validar_modelo.py`, `exportar_onnx.py`, `testar_previsao.py`
- `treino/ia_mapa/` — `sam_service.py`, `servidor.py`, `requirements.txt` (modelo SAM `.pth` via Git LFS)

Cada subpasta pode ter seu próprio `.venv`. Ambientes virtuais são ignorados pelo Git.

### `node_modules/`

Bibliotecas instaladas pelo NPM. Criada automaticamente pelo `npm install`; não vai ao Git.

### `dist/`

Versão compilada do backend (e frontend, se buildado). Gerada por `npm run build`; não deve ser editada manualmente nem enviada ao Git.

## Arquivos da raiz

### `package.json`

Dependências e scripts do projeto Node.js.

| Comando | Finalidade |
|---------|------------|
| `npm install` | Instala dependências |
| `npm run dev` | Backend em desenvolvimento |
| `npm run dev:all` | Backend e frontend juntos |
| `npm run dev:frontend` | Somente frontend |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa versão compilada em `dist/` |

### `package-lock.json`

Versões exatas das dependências. Deve ser enviado ao Git.

### `tsconfig.json`

Configuração do TypeScript: fonte em `backend/src/`, saída em `dist/`.

### `.gitignore`

Arquivos/pastas ignoradas pelo Git: `node_modules/`, `dist/`, `data/` (exceto `data/models/`), dataset local, `.env`, `.env.*` (exceto `.env.example`), `*.log`, `graphify-out/`, `.graphify-out/`, `treino/dados/`, `.venv/`, `**/.venv/`, `__pycache__/`, `*.pyc`.

### `.gitattributes`

Configura o Git LFS para arquivos grandes de modelo: `*.pt`, `*.pth`, `*.onnx`. Os modelos ficam em `data/models/`, `ia_mapa/` e `treino/Mapeador/`.

## Uso da interface

### Editor de mapas

1. Inicie o backend com `npm run dev` na raiz.
2. Inicie o frontend com `npm run dev` em `frontend/`.
3. Abra `http://localhost:5173` na aba **Editor de mapas**.
4. Selecione ou crie um mapa informando ID, nome e imagem.
5. Clique em **Nova vaga** e marque exatamente os quatro cantos da vaga.
6. Informe o nome da vaga e clique em **Salvar vagas**.
7. Ajuste, renomeie ou exclua vagas quando necessário e salve novamente.

Cada vaga possui `ID`, `Nome` e quatro pontos normalizados entre 0 e 1.

### Monitor de vagas

1. Vá para a aba **Monitor de vagas**.
2. Selecione um mapa cadastrado.
3. Selecione uma imagem da mesma câmera/ângulo do mapa.
4. Os polígonos das vagas aparecem sobrepostos à imagem.
5. Clique em **Analisar** para classificar as vagas.

A imagem enviada precisa ter proporção compatível com a imagem de referência do mapa, pois as coordenadas são normalizadas.

## API disponível

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/saude` | Verifica se a API está respondendo |
| `GET` | `/mapas` | Lista mapas cadastrados |
| `POST` | `/mapas` | Cadastra imagem e cria mapa vazio |
| `GET` | `/mapas/:ID` | Retorna um mapa cadastrado |
| `PUT` | `/mapas/:ID/vagas` | Atualiza lista completa de vagas do mapa |
| `POST` | `/mapas/:ID/analisar` | Analisa imagem e retorna estado das vagas |
| `GET` | `/imagens/:arquivo` | Exibe imagem de referência cadastrada |

### Detalhes das requisições

**`POST /mapas`**: envie `multipart/form-data` com `ID`, `Nome` e `Imagem`.

**`PUT /mapas/:ID/vagas`**: envie JSON com a lista completa de vagas. Cada vaga deve ter `ID`, `Nome` e exatamente quatro `Pontos` com `X` e `Y` entre 0 e 1.

**`POST /mapas/:ID/analisar`**: envie `multipart/form-data` com o campo `Imagem`. A resposta contém `MapaID`, `Data` e lista de vagas com `ID`, `Nome`, `Ocupada` e `Sobreposicao`.

> ⚠️ Atualmente a rota de análise retorna todas as vagas como **livres**, pois o classificador de IA ainda não foi integrado.

## Dataset de exemplo

O dataset [PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot) será usado para treinar e avaliar o classificador de vagas, pois já traz cada vaga rotulada como livre ou ocupada.

O dataset deve permanecer separado da pasta `data/`. Para o mapeamento, basta uma imagem de referência por câmera/cenário; não é necessário cadastrar todas as imagens do dataset.

Antes de usar o dataset em relatórios ou apresentações, consulte os termos de licença e atribuição na [página do PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot).

## Próximas etapas

1. Treinar um classificador de vagas (livre/ocupada) com o dataset PKLot e exportar para ONNX.
2. Integrar o classificador à rota `POST /mapas/:ID/analisar`.
3. Aplicar histerese para evitar alternância de estado entre análises consecutivas.
4. Armazenar resultados de ocupação em `data/occupancy/`.
5. Avaliar acurácia, precisão e recall com o PKLot.
6. Integrar atualização em tempo real (foto a cada X segundos de vídeo/câmera).
