# App Vaga Livre (Expo)

Passo a passo completo (baixar, backend, celular) no [README da raiz](../README.md).

```powershell
npm install
npx expo start      # tecla "w" abre no navegador
```

Comandos úteis:

```powershell
npx tsc --noEmit            # checa os tipos
npx expo lint               # lint
npx expo install <pacote>   # adicionar biblioteca (não use npm install)
```

- Telas em `src/app/`, componentes em `src/components/`, dados e API em `src/dados/`.
- Todo visual usa os tokens de `src/theme.ts` (espelho do Figma). Veja `AGENTS.md`.
