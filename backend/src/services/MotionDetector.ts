import sharp from 'sharp';

export interface MotionDetectionResult {
  motionDetected: boolean;
  changedPixels: number;
  totalPixels: number;
  ratio: number;
}

const DIFF_THRESHOLD = 30; // diferença de intensidade para considerar pixel alterado
const MOTION_RATIO_THRESHOLD = 0.02; // 2% dos pixels da ROI alterados

export class MotionDetector {
  private previousFrame: Buffer | null = null;

  /**
   * Compara o frame atual com o anterior e detecta movimento.
   *
   * @param frameBuffer buffer da imagem atual (JPEG/PNG)
   * @param useMask se true, compara apenas dentro das regiões de interesse (vagas)
   * @param maskRegions regiões de interesse (x, y, w, h em pixels). Obrigatório se useMask=true
   */
  async detect(
    frameBuffer: Buffer,
    useMask: boolean,
    maskRegions?: { x: number; y: number; w: number; h: number }[]
  ): Promise<MotionDetectionResult> {
    if (!this.previousFrame) {
      this.previousFrame = frameBuffer;
      return { motionDetected: false, changedPixels: 0, totalPixels: 0, ratio: 0 };
    }

    const prevFrame = this.previousFrame as Buffer;

    if (useMask && maskRegions && maskRegions.length > 0) {
      return this.detectInRegions(frameBuffer, prevFrame, maskRegions);
    }

    return this.detectFullFrame(frameBuffer, prevFrame);
  }

  private async detectFullFrame(
    frameBuffer: Buffer,
    prevFrame: Buffer
  ): Promise<MotionDetectionResult> {
    const metadata = await sharp(frameBuffer).metadata();
    const width = metadata.width ?? 640;
    const height = metadata.height ?? 640;
    const totalPixels = width * height;

    const curr = await sharp(frameBuffer)
      .resize(width, height)
      .grayscale()
      .raw()
      .toBuffer();

    const prev = await sharp(prevFrame)
      .resize(width, height)
      .grayscale()
      .raw()
      .toBuffer();

    let changedPixels = 0;
    for (let i = 0; i < curr.length; i++) {
      const a = curr[i]!;
      const b = prev[i]!;
      if (Math.abs(a - b) > DIFF_THRESHOLD) {
        changedPixels++;
      }
    }

    const ratio = changedPixels / totalPixels;
    const motionDetected = ratio > MOTION_RATIO_THRESHOLD;

    this.previousFrame = frameBuffer;
    return { motionDetected, changedPixels, totalPixels, ratio };
  }

  private async detectInRegions(
    frameBuffer: Buffer,
    prevFrame: Buffer,
    regions: { x: number; y: number; w: number; h: number }[]
  ): Promise<MotionDetectionResult> {
    let totalChanged = 0;
    let totalRoiPixels = 0;

    for (const region of regions) {
      const curr = await sharp(frameBuffer)
        .extract({ left: region.x, top: region.y, width: region.w, height: region.h })
        .grayscale()
        .raw()
        .toBuffer();

      const prev = await sharp(prevFrame)
        .extract({ left: region.x, top: region.y, width: region.w, height: region.h })
        .grayscale()
        .raw()
        .toBuffer();

      totalRoiPixels += region.w * region.h;

      for (let i = 0; i < curr.length; i++) {
        const a = curr[i]!;
        const b = prev[i]!;
        if (Math.abs(a - b) > DIFF_THRESHOLD) {
          totalChanged++;
        }
      }
    }

    const ratio = totalRoiPixels > 0 ? totalChanged / totalRoiPixels : 0;
    const motionDetected = ratio > MOTION_RATIO_THRESHOLD;

    this.previousFrame = frameBuffer;
    return { motionDetected, changedPixels: totalChanged, totalPixels: totalRoiPixels, ratio };
  }

  reset(): void {
    this.previousFrame = null;
  }
}
