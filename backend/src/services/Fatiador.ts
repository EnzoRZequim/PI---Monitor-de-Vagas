import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { mkdir, readdir } from 'fs/promises';
import { TEMP_DIR } from '../config/paths';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';


// Configura o caminho do binário ffmpeg (fornecido pelo @ffmpeg-installer/ffmpeg)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);


export interface FrameExtractOptions {
  inputPath: string;
  outputDir: string;
  intervalSeconds?: number;
}


export interface CapturaAoVivoOptions {
  url: string;
  outputDir: string;
  intervalSeconds?: number;
}


export interface CapturaAoVivo {
  parar: () => void;
}


export class Fatiador {
  /**
   * Extrai frames de um vídeo usando ffmpeg.
   * Por padrão extrai 1 frame a cada `intervalSeconds` (padrão: 5s).
   * Retorna a lista de caminhos dos frames extraídos, ordenados.
   */
  static async extractFrames(opts: FrameExtractOptions): Promise<string[]> {
    await mkdir(opts.outputDir, { recursive: true });
    const interval = opts.intervalSeconds ?? 5;


    return new Promise<string[]>((resolve, reject) => {
      const command = ffmpeg(opts.inputPath);
      command
        .noAudio()
        .outputOptions('-vf', `fps=1/${interval}`)
        .outputOptions('-q:v', '2')
        .output(path.join(opts.outputDir, 'frame-%04d.jpg'))
        .on('end', async () => {
          try {
            const files = await readdir(opts.outputDir);
            const frames = files
              .filter((f) => f.startsWith('frame-') && f.endsWith('.jpg'))
              .sort()
              .map((f) => path.join(opts.outputDir, f));
            resolve(frames);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', reject)
        .run();
    });
  }


  /**
   * Inicia a captura contínua de frames a partir de uma URL ao vivo.
   * O FFmpeg gera um frame a cada `intervalSeconds`, mas não espera o fim do vídeo.
   */
  static iniciarCapturaAoVivo(opts: CapturaAoVivoOptions): CapturaAoVivo {
    const interval = opts.intervalSeconds ?? 5;


    const command = ffmpeg(opts.url);

    command
      .inputOptions(['-rtsp_transport', 'tcp'])
      .noAudio()
      .outputOptions('-vf', `fps=1/${interval}`)
      .outputOptions('-q:v', '2')
      .output(path.join(opts.outputDir, 'frame-%04d.jpg'))
      .on('start', (linhaComando) => {
        console.log('[FATIADOR] iniciando captura ao vivo:', linhaComando);
      })
      .on('stderr', (linha) => {
        console.log('[FATIADOR][FFMPEG]', linha);
      })
      .on('error', (erro) => {
        console.error('[FATIADOR] erro na captura ao vivo:', erro.message);
      })
      .run();


    return {
      parar: () => {
        try {
          command.kill('SIGKILL');
        } catch {
          // Ignora se o processo já foi encerrado.
        }
      },
    };
  }
}