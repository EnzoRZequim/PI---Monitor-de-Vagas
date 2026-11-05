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

export class VideoProcessor {
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
}
