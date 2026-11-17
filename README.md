# APP Vaga Livre 🅿️

**Sua vaga, sem voltas.**

Sistema de estacionamento inteligente que identifica vagas livres e ocupadas a partir de imagens de câmeras, sem sensores físicos em cada vaga. Uma IA classifica cada vaga (livre ou ocupada) e o app mostra o resultado ao motorista.

## Estrutura do repositório

| Pasta | O que é |
|-------|---------|
| `Frontend/` | **App Vaga Livre** (Expo / React Native, celular e web). É a interface do usuário. |
| `backend/` | API em Node.js + TypeScript que guarda os mapas e roda a IA de classificação das vagas. |
| `frontend-admin/` | Ferramenta web (React + Vite) para cadastrar mapas, desenhar as vagas e testar a IA. |
| `data/` | Mapas, imagens, vídeo de teste e modelos de IA. |
| `treino/` | Scripts em Python para treinar os modelos. |
| `docs/` | Documentação detalhada ([`docs/estrutura_projeto.md`](docs/estrutura_projeto.md)). |

> ⚠️ **Use a branch `feat/integracao-ia`.** O app Expo (`Frontend/`) **não existe na `master`**: quem clona a `master` recebe só o editor web e não encontra o app. Quando esta branch for mesclada na `master`, passe a usar a `master`.

👉 **Quer só rodar?** O passo a passo curto está em [`Frontend/README.md`](Frontend/README.md#passo-a-passo-para-rodar).

---

## 📋 Pré-requisitos

| Programa | Para que serve | Onde baixar |
|----------|---------------|-------------|
| **Git** | Baixar o projeto | https://git-scm.com/ |
| **Node.js** (LTS, com NPM) | Rodar o app, o backend e o editor web | https://nodejs.org/ |
| **Git LFS** | Baixar os modelos de IA (só se for rodar o backend) | https://git-lfs.com/ |
| **Expo Go** (opcional) | Abrir o app no celular | Play Store / App Store |

Python 3 só é necessário para **treinar** modelos (pasta `treino/`), não para rodar o projeto.

---

## 🚀 Opção 1: só o app (mais rápido)

Não precisa de backend nem de Git LFS. Os números de vagas vêm de uma **simulação** dentro do app.

```powershell
# Pula o download dos modelos de IA (arquivos grandes, não usados pelo app)
$env:GIT_LFS_SKIP_SMUDGE = "1"
git clone -b feat/integracao-ia https://github.com/EnzoRZequim/PI---Monitor-de-Vagas.git
cd PI---Monitor-de-Vagas\Frontend
npm install
npx expo start
```

Aperte `w` para abrir no navegador, ou escaneie o QR code com o Expo Go (celular na mesma rede Wi-Fi do computador).

Para ver a tela do mapa de vagas, abra **Nossos parceiros › IMT › IMT - São Caetano › Bloco A**.

---

## 🤖 Opção 2: app + IA de verdade

Aqui o app mostra a ocupação calculada pela IA do backend. Use **3 terminais** (PowerShell), todos a partir da raiz do projeto.

### 1. Baixar o projeto e o modelo da IA

Instale o **Git LFS antes de clonar** (depois feche e reabra o terminal). Para baixar só o que o servidor precisa:

```powershell
git lfs install
$env:GIT_LFS_SKIP_SMUDGE = "1"
git clone -b feat/integracao-ia https://github.com/EnzoRZequim/PI---Monitor-de-Vagas.git
cd PI---Monitor-de-Vagas
git lfs pull --include="data/models/classificador_vagas.onnx"
```

Se preferir baixar tudo de uma vez (sem o `GIT_LFS_SKIP_SMUDGE`), o clone **demora e usa cerca de 400 MB**: a maior parte é do serviço SAM de `treino/`, que não é necessário para rodar.

> Sem o arquivo `data/models/classificador_vagas.onnx` de verdade (e não um ponteiro de 132 bytes) o backend **não sobe**: ele carrega o classificador ao iniciar.

### 2. Terminal 1: backend com a demonstração ligada

```powershell
cd backend
npm install
$env:MONITOR_DEMO = "true"
npm run dev
```

Espere aparecer `[DEMO] Teste: foto analisada.` e `[DEMO] Video: 3 frames, repetindo em loop.` Para conferir: `http://localhost:3000/saude` deve responder `{"status":"ok"}`.

Com `MONITOR_DEMO=true` o backend:
- analisa **uma vez** a foto do mapa `Teste` (32 vagas);
- analisa **em loop**, a cada 5 s, os frames do vídeo `data/videos/TesteVideo.mp4` do mapa `Video` (42 vagas).

Sem essa variável o backend sobe normal, mas não há ocupação para o app ler, e ele usa a simulação.

### 3. Terminal 2: app Expo

```powershell
cd Frontend
npm install
npx expo start
```

- **Navegador** (tecla `w`): funciona direto, a API padrão é `http://localhost:3000`.
- **Celular (Expo Go)**: o `localhost` do celular é o próprio aparelho. Copie `Frontend/.env.example` para `Frontend/.env` e coloque o IP do computador na mesma rede Wi-Fi (veja com `ipconfig`):

  ```
  EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
  ```

  Depois reinicie o `npx expo start`. Se não conectar, o firewall do Windows pode estar bloqueando a porta 3000.

### 4. Como saber que está usando a IA

Abra **Nossos parceiros › IMT › IMT - São Caetano**:

| Bloco | Mapa no backend | Esperado |
|-------|-----------------|----------|
| **Bloco A** | `Teste` (foto) | `16/32`, número **fixo** |
| **Bloco B** | `Video` (vídeo) | `27/42`, `27/42`, `22/42`, repetindo a cada 5 s |

Os blocos C a F e os demais parceiros continuam com **dados simulados** (100/100, 50/100...), pois só existem os mapas `Teste` e `Video`. Se o Bloco A mostrar `1/32` e variar, o app não alcançou o backend. Se o backend cair, os blocos voltam sozinhos para a simulação depois de duas buscas seguidas sem resposta (cerca de 10 s).

### 5. Comparar com o editor web (opcional)

```powershell
cd frontend-admin
npm install
npm run dev
```

Abra `http://localhost:5173` (o backend precisa estar rodando):
1. **Editor de mapas** › `teste2` (é o mapa `Teste`) ou `TesteVideo` (é o `Video`): a foto com as vagas desenhadas.
2. **Monitor de vagas** › escolha `teste2` e a imagem `estacionamento 2` (ou `TesteVideo` e `Video.jpg`) e clique em **Analisar**. O resultado deve bater com o app (16 de 32 no `Teste`, 27 de 42 no `Video`).

Os arquivos `estacionamento 2.jpg`, `Teste.jpg` e `Video.jpg` estão em `data/images/`.

---

## 🛠️ Problemas comuns

| Problema | Causa e solução |
|----------|-----------------|
| Não existe a pasta `Frontend/` | Você clonou a `master`. Use `git clone -b feat/integracao-ia ...` ou, num clone existente, `git fetch` e `git switch feat/integracao-ia`. |
| `fatal: Remote branch feat/integracao-ia not found` | A branch ainda não foi enviada ao GitHub. Peça para quem fez o trabalho dar `git push -u origin feat/integracao-ia`. |
| O clone demora muito ou trava | O Git LFS está baixando todos os modelos (~400 MB). Use `GIT_LFS_SKIP_SMUDGE=1` (veja as opções acima). |
| `npm install` no `Frontend/` mostra `uuid@7.0.3` deprecated e vulnerabilidades | É esperado (vem das ferramentas internas do Expo). **Não rode `npm audit fix --force`**: ele rebaixa o Expo e quebra o projeto. |
| `npm install` mostra `ERESOLVE` | Rode `npx expo install --fix`. Para adicionar bibliotecas use `npx expo install <pacote>`, não `npm install <pacote>`. |
| O backend fecha ao iniciar | Falta o modelo `data/models/classificador_vagas.onnx` real (rode `git lfs pull`), ou a porta 3000 está em uso por outro programa. |
| O app mostra tudo simulado | O backend está desligado, sem `MONITOR_DEMO=true`, ou (no celular) falta o `EXPO_PUBLIC_API_URL`. |
| `npm run dev:all` não funciona | Esse atalho não existe mais. Rode cada parte no seu terminal, como acima. |

---

## 🧠 Sobre a IA

O backend recorta cada vaga da imagem (usando os pontos do mapa) e classifica o recorte com um modelo MobileNet V3 Small (ONNX): `data/models/classificador_vagas.onnx`. A resposta traz, para cada vaga, `Ocupada` e `Sobreposicao` (a confiança).

- As coordenadas das vagas são **normalizadas (0 a 1)** e valem para a imagem em que o mapa foi desenhado. Uma imagem com proporção diferente desloca as vagas e o resultado fica errado. Por isso a demonstração encaixa os frames do vídeo no quadro 4:3 da `Video.jpg` (que tem faixas pretas).
- O app lê o resultado em `GET /mapas/:ID/ocupacao`, a cada 5 s, enquanto a tela está aberta.

### Scripts de treino e IA (`treino/`)

- `treino/Classificador/`: preparação e treino do classificador de vagas
- `treino/Mapeador/`: treino de segmentação, exportação ONNX e validação
- `treino/ia_mapa/`: serviço SAM (Segment Anything Model) para detecção de vagas (usado pelo botão "Criar vagas com IA" do editor)

Cada subpasta pode ter seu próprio `.venv` e `requirements.txt`:

```powershell
cd treino\ia_mapa
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Os modelos (`.pt`, `.pth`, `.onnx`) são versionados com **Git LFS**.

---

## 🗺️ Dados de teste incluídos

- **Mapa `Teste`** (nome `teste2`): 32 vagas, imagem `estacionamento 2.jpg`.
- **Mapa `Video`** (nome `TesteVideo`): 42 vagas, imagem `Video.jpg`, vídeo `data/videos/TesteVideo.mp4`.

Os IDs e nomes das vagas desses mapas estão copiados em `Frontend/src/dados/mapasBackend.ts`. Se um mapa mudar em `data/maps/`, atualize esse arquivo.

---

## 📚 Documentação

- [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md): pastas, API e uso das interfaces.
- [`Frontend/README.md`](Frontend/README.md): detalhes do app.
- O dataset [PKLot no Roboflow](https://public.roboflow.com/object-detection/pklot) foi a base de treino (licença CC BY 4.0; cite o trabalho original em publicações).
