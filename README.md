# APP Vaga Livre 🅿️

Sistema de estacionamento inteligente que identifica vagas livres e ocupadas a partir de imagens de câmeras, sem sensores físicos em cada vaga.

## O que o projeto faz

- **Editor de mapas:** cadastre uma foto do estacionamento e marque as vagas desenhando polígonos ao redor de cada uma.
- **Monitor de vagas:** carregue uma foto da mesma câmera, visualize as vagas marcadas sobre a imagem e veja se cada vaga está livre ou ocupada.

> ⚠️ **Atenção:** a classificação por IA (saber se a vaga está livre ou ocupada automaticamente) ainda não foi integrada. Por enquanto, o sistema mostra todas as vagas como **livres**, independentemente da imagem. Isso será ajustado em próximas etapas.

---

## 📋 Antes de começar (pré-requisitos)

Instale estes programas **antes** de clonar o projeto:

| Programa | Para que serve | Onde baixar |
|----------|---------------|-------------|
| **Node.js** (com NPM) | Rodar o backend e o frontend | https://nodejs.org/ (escolha a versão LTS) |
| **Git LFS** | Baixar os modelos de IA (arquivos grandes) | https://git-lfs.com/ |
| **Python 3** | Rodar scripts de treino e inferência de IA (pasta `treino/`) | https://www.python.org/ |

> ⚠️ **Instale o Git LFS antes de clonar.** Se clonar sem ele, os arquivos grandes não baixarão corretamente. Após instalar, feche e reabra o terminal para que o comando `git lfs` funcione.

---

## 🚀 Como rodar o projeto (passo a passo)

### 1. Baixar o projeto

Abra um terminal (PowerShell no Windows, ou o terminal integrado do VS Code com `Ctrl + \``) e rode:

```powershell
git clone https://github.com/EnzoRZequim/PI---Monitor-de-Vagas.git
cd PI---Monitor-de-Vagas
```

### 2. Baixar os modelos de IA (Git LFS)

Como os modelos de IA são arquivos grandes, eles não vêm direto no clone. Após clonar, rode:

```powershell
git lfs pull
```

Isso vai baixar os arquivos de modelo (`.pt` e `.onnx`) para a pasta raiz e para `data/models/`.

### 3. Rodar o backend

Abra um terminal na **raiz do projeto** (onde está o arquivo `package.json`) e rode:

```powershell
npm install
npm run dev
```

O backend ficará disponível em:

- API: `http://localhost:3000`
- Status: `http://localhost:3000/saude`

Deixe esse terminal aberto.

### 4. Rodar o frontend

Abra **outro terminal**, entre na pasta `frontend/` e rode:

```powershell
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em: `http://localhost:5173`

> O frontend precisa do backend rodando para funcionar. Então sempre inicie o backend primeiro (passo 3) e depois o frontend (passo 4).

### 5. Usar o sistema

1. Abra o navegador em `http://localhost:5173`
2. Na aba **Editor de mapas**, selecione o mapa `teste2` (já vem com 32 vagas marcadas)
3. Na aba **Monitor de vagas**, selecione o mapa `teste2` e a imagem `estacionamento 2`
4. Clique em **Analisar** para ver as vagas (por enquanto, todas aparecerão como livres)

---

## ⚠️ Sobre o modelo de IA

O projeto usa Git LFS para gerenciar arquivos grandes (modelos `.pt` e `.onnx`).

- Se você só quer **testar o mapa e a interface**, não precisa do modelo de IA. O sistema funciona sem ele (apenas mostra todas as vagas como livres).
- Se você for **integrar ou treinar o classificador de IA**, será necessário o Python 3 com o pacote `ultralytics` instalado.

### Scripts de treino e IA (`treino/`)

Os scripts de treinamento, validação e preparação de dados ficam em `treino/`:

- `treino/Classificador/` — preparação e treino do classificador de vagas
- `treino/Mapeador/` — treino de segmentação, exportação ONNX e validação
- `treino/ia_mapa/` — serviço SAM (Segment Anything Model) para detecção de vagas

Cada subpasta pode ter seu próprio `.venv` e `requirements.txt`. Para rodar:

```powershell
# Exemplo: dentro de treino/ia_mapa/
cd treino\ia_mapa
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Os modelos treinados (`.pt`, `.onnx`, `.pth`) são versionados com **Git LFS** e ficam em `data/models/` e `ia_mapa/`.

---

## 🗺️ Arquivos de teste já incluídos

O repositório já vem com arquivos prontos para você testar sem precisar cadastrar nada:

- **Mapa:** `teste2` — 32 vagas já mapeadas
- **Imagem:** `estacionamento 2` — foto de referência do estacionamento

Basta selecionar esses arquivos na interface para começar a usar.

---

## 📚 Documentação detalhada

Para arquitetura, estrutura de pastas, rotas da API detalhada, uso da interface e próximos passos, consulte:

👉 [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md)
