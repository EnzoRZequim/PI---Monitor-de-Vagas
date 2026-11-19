# Como testar o monitoramento por URL de vídeo

Este guia explica como simular uma câmera de segurança em tempo real usando um vídeo MP4 local.

O sistema aceita uma URL RTSP no campo **URL do vídeo**. Para simular a câmera, é necessário publicar um vídeo MP4 como um stream RTSP local usando o **MediaMTX** e o **FFmpeg**.

O MediaMTX é um servidor de mídia que permite publicar e ler streams em tempo real por protocolos como RTSP, RTMP, HLS e WebRTC. [GitHub — MediaMTX](https://github.com/bluenviron/mediamtx)

## Programas necessários

Antes de começar, instale:

- [MediaMTX](https://github.com/bluenviron/mediamtx/releases)
- [FFmpeg](https://www.gyan.dev/ffmpeg/builds/)
- [VLC Media Player](https://www.videolan.org/vlc/download-windows.pt_BR.html)

O FFmpeg deve estar disponível no terminal. Para verificar, abra o Prompt de Comando ou PowerShell e execute:

```bat
ffmpeg -version
```

Se o comando for reconhecido, o FFmpeg está instalado corretamente.

## 1. Iniciar o MediaMTX

1. Baixe a versão **Windows amd64** do MediaMTX na página de releases.
2. Extraia o arquivo ZIP em uma pasta do computador.
3. Abra a pasta extraída.
4. Execute o arquivo:

```bat
mediamtx.exe
```

O terminal deve exibir uma mensagem semelhante a esta:

```text
[RTSP] started with listeners on :8554 (TCP/RTSP)
```

Isso significa que o servidor RTSP está disponível na porta `8554`.

**Importante:** mantenha este terminal aberto durante todo o teste.

## 2. Publicar o vídeo como stream

Abra um **novo terminal** do PowerShell ou Prompt de Comando.

Execute o comando abaixo, substituindo o caminho do vídeo pelo caminho do seu arquivo MP4:

```bat
ffmpeg -re -stream_loop -1 -i "E:\MAUA\VideoEstacionamento.mp4" -an -c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -f rtsp -rtsp_transport tcp rtsp://localhost:8554/camera-teste
```

No exemplo acima:

- `E:\MAUA\VideoEstacionamento.mp4` é o vídeo que será transmitido.
- `-stream_loop -1` faz o vídeo repetir infinitamente.
- `-re` faz o vídeo ser enviado em tempo real.
- `rtsp://localhost:8554/camera-teste` é a URL do stream criado.

Após executar o comando, o terminal do FFmpeg deve começar a exibir informações como:

```text
frame= 1 fps= 25 ...
frame= 2 fps= 25 ...
```

Isso indica que o vídeo está sendo publicado como stream.

**Importante:** mantenha este terminal aberto durante todo o teste.

## 3. Confirmar o stream no VLC

O VLC é usado apenas para confirmar que o stream RTSP está funcionando antes de testar no sistema.

1. Abra o VLC.
2. Clique em **Mídia**.
3. Clique em **Abrir Fluxo de Rede**.
4. Cole a URL abaixo:

```text
rtsp://localhost:8554/camera-teste
```

5. Clique em **Reproduzir**.

Se o vídeo aparecer no VLC e recomeçar automaticamente ao terminar, o stream está funcionando corretamente.

## 4. Usar no sistema

No campo **URL do vídeo**, informe:

```text
rtsp://localhost:8554/camera-teste
```

Selecione o mapa do estacionamento desejado e clique em **Iniciar monitoramento**.

O backend irá:

1. Conectar ao stream RTSP.
2. Capturar um frame a cada intervalo configurado.
3. Analisar as vagas do mapa.
4. Enviar os resultados em tempo real pelo WebSocket.

Para o teste, é recomendado usar o intervalo de **1 segundo**.

## 5. Encerrar o teste

Para encerrar:

1. No terminal do FFmpeg, pressione `Q`.
2. Feche o terminal do MediaMTX.
3. No sistema, clique em **Parar monitoramento**.

## Problemas comuns

### O VLC não reproduz o vídeo

Verifique se:

- O terminal do MediaMTX continua aberto.
- O terminal do FFmpeg continua rodando.
- A URL foi digitada exatamente assim:

```text
rtsp://localhost:8554/camera-teste
```

### O sistema fica em “Conectando ao vídeo em tempo real…”

Verifique se:

- O MediaMTX está rodando.
- O FFmpeg está publicando o vídeo.
- O VLC consegue reproduzir a URL RTSP.
- O intervalo configurado é maior ou igual a 1 segundo.

### O vídeo aparece, mas não há análise

Verifique se:

- Um mapa foi selecionado.
- O mapa possui vagas cadastradas.
- O backend está rodando.
- O terminal do backend não apresenta erros.

## Observação sobre a prévia

O navegador não reproduz streams RTSP diretamente. Por isso, ao usar uma URL RTSP, a prévia do vídeo pode não ser exibida na interface.

Isso é esperado: o monitoramento continua sendo realizado pelo backend, que captura os frames do stream e envia os resultados pelo WebSocket.