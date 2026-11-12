This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## ⚠️ DESIGN SYSTEM: REGRA OBRIGATÓRIA (ler antes de qualquer mudança visual)

Antes de adicionar, remover, substituir ou atualizar **qualquer** parte do frontend que envolva design (cor, fonte, tamanho, espaçamento, borda, sombra, ícone, layout ou componente), siga **estritamente** o design system do projeto. É proibido inventar variáveis de cor, fontes, tamanhos ou qualquer outro valor visual.

**Fonte da verdade:** o arquivo do Figma "App Vagas" (https://www.figma.com/design/8a7dvYEBYsIPYbjX0H1ssu/App-Vagas):
- página **Design System**: paleta e tipografia.
- página **Componentes**: todos os componentes e variantes.
- página **MVP - Alta Fidelidade**: telas de celular de 393px.

No código, o espelho do Figma é `src/theme.ts`.

### Regras
1. **Só tokens do `src/theme.ts`.** Use `paleta`, `cores`, `gradientes`, `ocupacao`, `fontes`, `tamanhoFonte`, `tipografia`, `espaco`, `raio` e `sombras`. Nunca escreva hex, `rgb()`/`rgba()`, nome de fonte, tamanho de fonte ou raio direto em componente ou tela.
2. **Não crie tokens que não existem no Figma.** Um token novo só entra se o valor existir no Figma. Use o mesmo nome do Figma (ex.: `Foundation/Blue/blue-500` → `paleta.blue[500]`, `Fonts/H4` → `tipografia.h4`) e comente de onde ele veio. Se o design pedir algo que o Figma não tem, **pare e pergunte** ao time antes de inventar.
3. **Fontes:** só as famílias e os pesos carregados em `src/app/_layout.tsx` e listados em `fontes`. Para usar um peso novo, ele precisa existir no Figma e ser adicionado nos dois lugares.
4. **Espaçamentos:** use `espaco[n]` quando o valor do Figma for múltiplo de 4. Valores fora da escala (ex.: 10, 22, 28, 36, 38) só podem ser copiados de um frame do Figma, numa constante com comentário citando a tela ou o componente de origem.
5. **Reuse componentes de `src/components/`** antes de criar outro. Eles ficam em pastas por função (nome no Figma entre parênteses). Um componente novo vai na pasta que corresponde à função dele, e o import usa o caminho completo (`@/components/<pasta>/<Nome>`):
   - `base/`: `CaixaGradiente` (borda em degradê), `ListaRolavel` (lista com barra de rolagem do Figma), `Logo` (Logo/Vaga Livre: `variante` "simbolo" ou "horizontal"), `DialogoConfirmacao`.
   - `botoes/`: `Botao` (v1 Primary/Secondary), `BotaoIcone` (Icon/v1), `BotaoCircular` (Circular/v1), `LinkAcao` ("+ adicionar ...").
   - `campos/`: `CampoTexto` / `CampoBusca` / `CampoSelecao` (Input / Search / Select), `Interruptor` (activate).
   - `cartoes/`: `CartaoLocal` (Bar/v1), `CartaoDetalhes` (Locais/homepage), `CartaoLocalParceiro` (Locais/Parceiro), `CartaoBloco` (Locais › Bloco edit), `CartaoDado` (Dashboard/v1), `IndicadorOcupacao` (badge).
   - `navegacao/`: `BarraNavegacao` (Navbar), `Cabecalho` (topo no desktop), `NavegacaoParceiro`.
   - `graficos/`: `GraficoLinha` e `GraficoBarras` (BarLineChart da tela Dados), em `react-native-svg`, com as cores do token `grafico`.
   - `mapa/`: `MapaVagas` (planta 2D das vagas com zoom e arrasto, frame "Bloco A (mapa)") e `LegendaMapa`, com as cores do token `mapa`.
   - `telas/`: layouts e telas compartilhadas, como `TelaParceiro`, `TelaLista`, `TelaMapa`, `FormularioLocal` e `LocalNaoEncontrado`.
6. **Ícones:** Feather (`@expo/vector-icons`), com o nome equivalente ao ícone do Figma (Rotate ccw → `rotate-ccw`, Trash → `trash-2` etc.).
7. **Celular x desktop:** o Figma só tem telas de celular. Estilos de celular ficam em ramos `useTelaPequena()` / StyleSheet `celular`. Não altere o layout de desktop sem pedido explícito.
8. **Copie do Figma, não do olho.** Pegue tamanhos, gaps, paddings, cores e textos exatos do nó do Figma (Figma MCP `get_design_context`/`get_screenshot`, ou o painel Dev Mode). Não copie erros de digitação do protótipo ("Endereco", "inicio").
9. **Antes de concluir:** compare a tela renderizada em 393px com o frame do Figma e rode `npx tsc --noEmit` e `npx expo lint`.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
