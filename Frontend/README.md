# App Vaga Livre (Expo)

Interface do usuário do Vaga Livre, em React Native (Expo SDK 57) com Expo Router. Roda no celular (Expo Go) e no navegador.

## Passo a passo para rodar

**Pré-requisitos:** [Git](https://git-scm.com/) e [Node.js LTS](https://nodejs.org/). Para o celular, o app **Expo Go**.

### A. Só o app (dados simulados)

1. Baixe a branch do app (o `Frontend/` não existe na `master`):
   ```powershell
   $env:GIT_LFS_SKIP_SMUDGE = "1"
   git clone -b feat/integracao-ia https://github.com/EnzoRZequim/PI---Monitor-de-Vagas.git
   ```
2. Entre na pasta do app e instale as dependências:
   ```powershell
   cd PI---Monitor-de-Vagas\Frontend
   npm install
   ```
3. Inicie:
   ```powershell
   npx expo start
   ```
4. Abra o app:
   - **Navegador:** aperte `w`.
   - **Celular:** escaneie o QR code com o Expo Go (celular na mesma rede Wi-Fi do computador).
5. Navegue até **Nossos parceiros › IMT › IMT - São Caetano**.

### B. App + IA do backend

Faça o passo A e, **antes** do passo 3, deixe o backend rodando em outro terminal:

1. Baixe o modelo da IA (na raiz do projeto, precisa do [Git LFS](https://git-lfs.com/)):
   ```powershell
   cd PI---Monitor-de-Vagas
   git lfs pull --include="data/models/classificador_vagas.onnx"
   ```
2. Suba o backend com a demonstração ligada:
   ```powershell
   cd backend
   npm install
   $env:MONITOR_DEMO = "true"
   npm run dev
   ```
   Aguarde `[DEMO] Teste: foto analisada.` e `[DEMO] Video: 3 frames, repetindo em loop.`
3. **Só no celular:** o `localhost` do celular é o próprio aparelho. Em `Frontend/`, copie `.env.example` para `.env` e troque pelo IP do computador (use `ipconfig`):
   ```
   EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
   ```
4. Em outro terminal, rode o app (`cd Frontend`, `npx expo start`).

**Como conferir que a IA está ligada** (IMT - São Caetano): o **Bloco A** mostra `16/32` fixo e o **Bloco B** alterna `27/42 → 27/42 → 22/42` a cada 5 s. Os demais blocos continuam simulados. Se o backend cair, os blocos voltam sozinhos para a simulação.

### Problemas comuns

| Problema | Solução |
|----------|---------|
| Não existe a pasta `Frontend/` | Você clonou a `master`. Use `git clone -b feat/integracao-ia ...`. |
| `Remote branch feat/integracao-ia not found` | A branch ainda não foi enviada ao GitHub (`git push -u origin feat/integracao-ia`). |
| `npm install` mostra `uuid@7.0.3` deprecated e vulnerabilidades | É esperado. **Não rode `npm audit fix --force`**. |
| `npm install` mostra `ERESOLVE` | Rode `npx expo install --fix`. |
| Backend não sobe | Falta o modelo real (`git lfs pull`, passo B1) ou a porta 3000 está em uso. |
| App no celular só mostra dados simulados | Falta o `.env` com o IP do computador (passo B3), ou o firewall bloqueia a porta 3000. |

Mais detalhes (editor web, treino da IA, estrutura) no [README da raiz](../README.md).

## Comandos

```powershell
npx tsc --noEmit            # checa os tipos
npx expo lint               # lint
npx expo install <pacote>   # adicionar biblioteca (não use npm install)
npx expo install --fix      # corrige versões incompatíveis
```

`npm audit fix --force` **não deve ser executado**: ele rebaixa o Expo e quebra o projeto.

## Organização

- `src/app/`: telas (cada arquivo é uma rota do Expo Router).
- `src/components/`: componentes do design system, por função (`base`, `botoes`, `campos`, `cartoes`, `navegacao`, `graficos`, `mapa`, `telas`).
- `src/dados/`: dados dos parceiros, cliente da API (`api.ts`) e a ocupação ao vivo (`ocupacaoAoVivo.ts`).
- `src/theme.ts`: cores, fontes, espaçamentos e tipografia, espelho do Figma "App Vagas". **Todo visual deve usar esses tokens** (veja `AGENTS.md`).

## Integração com a IA

Os blocos com `mapaId` em `src/dados/parceiros.ts` buscam a ocupação em `GET /mapas/:ID/ocupacao` a cada 5 s, com a tela em foco:

| Bloco | Mapa no backend |
|-------|-----------------|
| IMT - São Caetano › Bloco A | `Teste` (32 vagas) |
| IMT - São Caetano › Bloco B | `Video` (42 vagas) |

Os demais blocos usam a simulação. Se o backend ficar fora do ar por duas buscas seguidas, os blocos ligados à IA também voltam para a simulação.
