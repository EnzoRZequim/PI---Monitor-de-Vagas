# APP Vaga Livre 🅿️

**Sua vaga, sem voltas.** Uma IA lê imagens de câmeras de estacionamento e o app mostra as vagas livres e ocupadas.

## Pastas

- `Frontend/`: app (Expo, celular e web)
- `backend/`: API e IA de classificação das vagas
- `frontend-admin/`: editor web de mapas (opcional)

## Baixar

Pré-requisitos: [Git](https://git-scm.com/) e [Node.js LTS](https://nodejs.org/).

```powershell
git clone -b Front-end https://github.com/EnzoRZequim/PI---Monitor-de-Vagas.git
cd PI---Monitor-de-Vagas
```

> Use a branch `Front-end`: a `master` não tem o app.

## Rodar o app

```powershell
cd Frontend
npm install
npx expo start
```

Aperte `w` para abrir no navegador, ou escaneie o QR code com o Expo Go (celular na mesma rede Wi-Fi). Sem o backend, o app usa dados simulados.

## Rodar o backend (para o app mostrar a IA)

O backend precisa do arquivo do modelo de IA, que fica no **Git LFS** (o Git guarda arquivos grandes fora do repositório normal). Instale o [Git LFS](https://git-lfs.com/) uma vez e, na raiz do projeto:

```powershell
git lfs install
git lfs pull --include="data/models/classificador_vagas.onnx"
cd backend
npm install
$env:MONITOR_DEMO = "true"
npm run dev
```

Pronto quando aparecer `[DEMO] Video: 3 frames, repetindo em loop.` O `MONITOR_DEMO` liga a análise de demonstração dos mapas de teste, que o app lê.

**No celular**, o `localhost` é o próprio aparelho: em `Frontend/`, copie `.env.example` para `.env` e coloque o IP do computador (veja com `ipconfig`):

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

## Como saber que a IA está funcionando

No app: **Nossos parceiros › IMT › IMT - São Caetano**.

- **Bloco A:** `16/32`, número fixo.
- **Bloco B:** `27/42`, `27/42`, `22/42`, repetindo a cada 5 s.
- Os outros blocos são simulados.

## Problemas comuns

| Problema | Solução |
|----------|---------|
| O clone demora ou baixa ~400 MB | É o Git LFS baixando os modelos. Antes do `git clone`: `$env:GIT_LFS_SKIP_SMUDGE = "1"` (o app não precisa deles). |
| O backend fecha ao iniciar | Falta o modelo (`git lfs pull ...` acima) ou a porta 3000 está ocupada. |
| No celular só aparecem dados simulados | Falta o `.env` com o IP do computador, ou o firewall bloqueia a porta 3000. |
| `npm install` mostra vulnerabilidades | É esperado. **Não rode `npm audit fix --force`**: quebra o Expo. |

Mais detalhes (API, estrutura, treino da IA): [`docs/estrutura_projeto.md`](docs/estrutura_projeto.md).
