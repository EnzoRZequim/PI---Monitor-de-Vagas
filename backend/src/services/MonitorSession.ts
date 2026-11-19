import { separarVagas } from './SeparadorVaga';
import { buscarMapa } from './MapaStorage';
import { Fatiador } from './Fatiador';
import { MotionDetector } from './MotionDetector';
import type { Mapa } from '../types/Mapa';
import type { OcupacaoMapa, EstadoVaga } from '../types/Ocupacao';
import path from 'path';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { OCCUPANCY_DIR, TEMP_DIR } from '../config/paths';



export type SessionStatus = 'IDLE' | 'OBSERVING' | 'ANALYZING' | 'WAITING' | 'STOPPED' | 'COMPLETED' | 'ERROR';



export interface MonitorConfig {
  sessionId: string;
  mapaId: string;
  videoPath: string;
  videoUrl?: string;
  useMask: boolean;
  useMotionOptimization: boolean;
  intervalSeconds: number;
  onResult: (resultado: MonitorResult) => void;
  onStatus: (status: SessionStatus, info?: any) => void;
  onError: (erro: string) => void;
}



export interface VagaRegion {
  id: string;
  nome: string;
  x: number;
  y: number;
  w: number;
  h: number;
}



export interface MonitorResult {
  sessionId: string;
  frame: number;
  totalFrames: number;
  timestamp: string;
  ocupacao: OcupacaoMapa;
  motionDetected: boolean;
  motionInfo: { changedPixels: number; totalPixels: number; ratio: number } | null;
}



type ResultadoProcessamento = 'analisado' | 'ignorado' | 'erro';



export class MonitorSession {
  private config: MonitorConfig;
  private mapa: Mapa | null = null;
  private detector: MotionDetector;
  private frames: string[] = [];
  private currentFrameIndex = 0;
  private timer: NodeJS.Timeout | null = null;
  private status: SessionStatus = 'IDLE';
  private lastAnalysisTime = 0;
  private motionStartTime: number | null = null;
  private stopped = false;
  private capturaAoVivo: { parar: () => void } | null = null;
  private outputDirAoVivo = '';



  constructor(config: MonitorConfig) {
    this.config = config;
    this.detector = new MotionDetector();
  }



  async start(): Promise<void> {
    try {
      this.status = 'IDLE';
      this.config.onStatus('IDLE', { message: 'Carregando mapa...' });



      this.mapa = await buscarMapa(this.config.mapaId);
      if (!this.mapa) {
        throw new Error('Mapa não encontrado.');
      }



      if (this.config.videoUrl) {
        await this.iniciarMonitoramentoAoVivo();
        return;
      }



      this.config.onStatus('IDLE', { message: 'Extraindo frames do vídeo...' });
      const outputDir = path.join(TEMP_DIR, `frames_${this.config.sessionId}`);
      this.frames = await Fatiador.extractFrames({
        inputPath: this.config.videoPath,
        outputDir: outputDir,
        intervalSeconds: this.config.intervalSeconds,
      });



      if (this.frames.length === 0) {
        throw new Error('Nenhum frame extraído do vídeo.');
      }



      this.currentFrameIndex = 0;
      this.lastAnalysisTime = Date.now();
      this.stopped = false;



      this.config.onStatus('IDLE', { message: 'Iniciando monitoramento...' });
      await this.processNextFrame();
    } catch (err: any) {
      this.status = 'ERROR';
      this.config.onError(err.message || 'Erro ao iniciar monitoramento.');
      this.config.onStatus('ERROR', { error: err.message });
    }
  }



  stop(): void {
    this.stopped = true;
    this.status = 'STOPPED';



    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }



    if (this.capturaAoVivo) {
      this.capturaAoVivo.parar();
      this.capturaAoVivo = null;
    }



    this.detector.reset();
    this.config.onStatus('STOPPED', { message: 'Monitoramento parado pelo usuário.' });
  }



  private async iniciarMonitoramentoAoVivo(): Promise<void> {
    this.outputDirAoVivo = path.join(TEMP_DIR, `frames_${this.config.sessionId}`);



    await mkdir(this.outputDirAoVivo, { recursive: true });



    this.config.onStatus('OBSERVING', {
      message: 'Conectando ao vídeo em tempo real...',
    });



    this.capturaAoVivo = Fatiador.iniciarCapturaAoVivo({
      url: this.config.videoUrl!,
      outputDir: this.outputDirAoVivo,
      intervalSeconds: this.config.intervalSeconds,
    });



    this.currentFrameIndex = 0;
    this.lastAnalysisTime = 0;
    this.stopped = false;



    await this.aguardarPrimeiroFrame();



    this.config.onStatus('OBSERVING', {
      message: 'Monitoramento ao vivo iniciado.',
    });



    void this.monitorarFramesAoVivo();
  }



  private async aguardarPrimeiroFrame(): Promise<void> {
    const tempoMaximo = 30000;
    const inicio = Date.now();



    while (!this.stopped && Date.now() - inicio < tempoMaximo) {
      const arquivos = await readdir(this.outputDirAoVivo);
      const frames = arquivos.filter(
        (arquivo) => arquivo.startsWith('frame-') && arquivo.endsWith('.jpg')
      );



      if (frames.length > 0) {
        console.log('[MONITOR] primeiro frame detectado:', frames[0]);
        return;
      }



      await new Promise<void>((resolve) => setTimeout(resolve, 500));
    }



    if (!this.stopped) {
      throw new Error('Não foi possível receber frames do vídeo em tempo real.');
    }
  }



  private async monitorarFramesAoVivo(): Promise<void> {
    while (!this.stopped) {
      const arquivos = await readdir(this.outputDirAoVivo);



      const frames = arquivos
        .filter(
          (arquivo) => arquivo.startsWith('frame-') && arquivo.endsWith('.jpg')
        )
        .sort();



      this.frames = frames.map((arquivo) =>
        path.join(this.outputDirAoVivo, arquivo)
      );



      const novosFrames = this.frames.slice(this.currentFrameIndex);



      if (novosFrames.length > 0) {
        console.log('[MONITOR] novos frames detectados:', novosFrames.length);
      }



      for (const framePath of novosFrames) {
        if (this.stopped) return;



        await this.processarFrame(framePath, this.currentFrameIndex);
        this.currentFrameIndex++;
      }



      await new Promise<void>((resolve) => setTimeout(resolve, 500));
    }
  }



  private getVagaRegions(): VagaRegion[] {
    if (!this.mapa) return [];
    const regions: VagaRegion[] = [];
    const largura = this.mapa.Largura || 640;
    const altura = this.mapa.Altura || 640;



    for (const vaga of this.mapa.Vagas) {
      const xs = vaga.Pontos.map((p) => p.X * largura);
      const ys = vaga.Pontos.map((p) => p.Y * altura);
      const x = Math.max(0, Math.floor(Math.min(...xs)));
      const y = Math.max(0, Math.floor(Math.min(...ys)));
      const w = Math.max(1, Math.min(largura - x, Math.ceil(Math.max(...xs) - Math.min(...xs))));
      const h = Math.max(1, Math.min(altura - y, Math.ceil(Math.max(...ys) - Math.min(...ys))));



      regions.push({
        id: vaga.ID,
        nome: vaga.Nome,
        x,
        y,
        w,
        h,
      });
    }
    return regions;
  }



  private async processNextFrame(): Promise<void> {
    if (this.stopped || this.currentFrameIndex >= this.frames.length) {
      this.status = 'COMPLETED';
      this.config.onStatus('COMPLETED', { message: 'Vídeo processado completamente.' });
      return;
    }



    const framePath = this.frames[this.currentFrameIndex];



    if (!framePath) {
      this.currentFrameIndex++;
      this.timer = setTimeout(() => this.processNextFrame(), 500);
      return;
    }



    const resultado = await this.processarFrame(
      framePath,
      this.currentFrameIndex
    );



    if (this.stopped) return;



    this.currentFrameIndex++;



    if (resultado === 'analisado') {
      this.timer = setTimeout(
        () => this.processNextFrame(),
        this.config.intervalSeconds * 1000
      );
      return;
    }



    if (resultado === 'erro') {
      this.timer = setTimeout(() => this.processNextFrame(), 1000);
      return;
    }



    this.timer = setTimeout(() => this.processNextFrame(), 500);
  }



  private async processarFrame(
    framePath: string,
    indice: number
  ): Promise<ResultadoProcessamento> {
    const fs = await import('fs/promises');
    const frameBuffer = await fs.readFile(framePath);
    const agora = Date.now();



    const regions = this.getVagaRegions();



    // Detecção de movimento (se otimização ligada)
    let motionDetected = false;
    let motionInfo: { changedPixels: number; totalPixels: number; ratio: number } | null = null;



    if (this.config.useMotionOptimization) {
      const result = await this.detector.detect(
        frameBuffer,
        this.config.useMask,
        regions.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }))
      );
      motionDetected = result.motionDetected;
      motionInfo = { changedPixels: result.changedPixels, totalPixels: result.totalPixels, ratio: result.ratio };
    }



    // Máquina de estados
    let deveAnalisar = false;



    if (!this.config.useMotionOptimization) {
      // Sem otimização: analisar sempre a cada intervalo
      const passouIntervalo = agora - this.lastAnalysisTime >= this.config.intervalSeconds * 1000;
      if (passouIntervalo) {
        deveAnalisar = true;
      }
    } else {
      // Com otimização:
      if (motionDetected) {
        if (this.motionStartTime === null) {
          this.motionStartTime = agora;
          this.status = 'OBSERVING';
          this.config.onStatus('OBSERVING', {
            message: 'Movimento detectado nas vagas, aguardando confirmação de 5s...',
            motionRatio: motionInfo?.ratio ?? 0,
          });
        }



        const tempoMovimento = agora - this.motionStartTime;
        if (tempoMovimento >= 5000) {
          deveAnalisar = true;
          this.motionStartTime = null;
        }
      } else {
        // Movimento cessou (ou nunca começou)
        if (this.motionStartTime !== null) {
          // Houve movimento e parou: analisar imediatamente para capturar estado pós-ação
          deveAnalisar = true;
          this.motionStartTime = null;
          this.status = 'IDLE';
          this.config.onStatus('IDLE', {
            message: 'Movimento cessou, analisando estado atual das vagas...',
            motionRatio: motionInfo?.ratio ?? 0,
          });
        }
      }
    }



    if (!deveAnalisar) {
      return 'ignorado';
    }



    this.status = 'ANALYZING';
    this.lastAnalysisTime = agora;



    this.config.onStatus('ANALYZING', {
      message: 'Analisando vagas com IA...',
      frame: indice + 1,
      totalFrames: this.frames.length,
    });



    try {
      const ocupacao = await separarVagas(frameBuffer, this.mapa!);



      // Salvar resultado em arquivo
      await this.salvarResultado(ocupacao);



      const resultado: MonitorResult = {
        sessionId: this.config.sessionId,
        frame: indice + 1,
        totalFrames: this.frames.length,
        timestamp: new Date().toISOString(),
        ocupacao,
        motionDetected,
        motionInfo,
      };



      this.config.onResult(resultado);



      this.status = 'WAITING';
      this.config.onStatus('WAITING', {
        message: `Aguardando próximo frame (${this.config.intervalSeconds}s)...`,
        nextFrameIn: this.config.intervalSeconds,
      });



      return 'analisado';
    } catch (err: any) {
      this.config.onError(err.message || 'Erro na análise de ocupação.');
      return 'erro';
    }
  }



  private async salvarResultado(ocupacao: OcupacaoMapa): Promise<void> {
    await mkdir(OCCUPANCY_DIR, { recursive: true });
    const nomeArquivo = `ocupacao_${this.config.sessionId}_${Date.now()}.json`;
    await writeFile(
      path.join(OCCUPANCY_DIR, nomeArquivo),
      JSON.stringify(ocupacao, null, 2),
      'utf-8'
    );
  }
}