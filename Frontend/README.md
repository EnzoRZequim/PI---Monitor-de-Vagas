# App Vaga Livre (Expo)

Interface do usuário do Vaga Livre, em React Native (Expo SDK 57) com Expo Router. Roda no celular (Expo Go) e no navegador.

> Instruções completas de como baixar o projeto (branch, Git LFS, backend) estão no [README da raiz](../README.md).

## Rodar

```powershell
npm install
npx expo start      # tecla "w" abre no navegador; ou escaneie o QR code com o Expo Go
```

O app funciona **sem backend**, com ocupação simulada. Para ver a IA, suba o backend com `MONITOR_DEMO=true` (veja o README da raiz). No celular, copie `.env.example` para `.env` e coloque o IP do computador em `EXPO_PUBLIC_API_URL`.

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
