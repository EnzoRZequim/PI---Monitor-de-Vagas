# Vaga Livre: editor e monitor (web)

Ferramenta web (React + TypeScript + Vite) para quem administra os mapas. **Não é o app do usuário**: o app fica em [`../Frontend`](../Frontend/README.md).

- **Editor de mapas:** cadastra a foto de um estacionamento e desenha (ou sugere com IA) os polígonos de cada vaga.
- **Monitor de vagas:** analisa uma foto e mostra cada vaga como livre ou ocupada.
- **Monitor de vídeo:** analisa os quadros de um vídeo.

## Rodar

O backend precisa estar rodando em `http://localhost:3000` (veja o [README da raiz](../README.md)).

```powershell
npm install
npm run dev     # http://localhost:5173
```

O Vite repassa `/mapas`, `/imagens` e `/monitorar` para o backend (`vite.config.ts`).
