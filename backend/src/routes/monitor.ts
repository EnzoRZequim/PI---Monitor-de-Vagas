import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { MonitorSession } from '../services/MonitorSession';
import { buscarMapa } from '../services/MapaStorage';
import { TEMP_DIR, VIDEOS_DIR } from '../config/paths';
import { mkdir, writeFile } from 'fs/promises';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import type { MonitorResult, SessionStatus } from '../services/MonitorSession';

const router = Router();

// Armazena sessões ativas em memória (chave: sessionId)
const sessions = new Map<string, MonitorSession>();
// Armazena WebSockets por sessionId (chave: sessionId -> Set<WebSocket>)
const wsClients = new Map<string, Set<WebSocket>>();

// Configuração do multer para salvar vídeo em disco
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await mkdir(TEMP_DIR, { recursive: true });
      await mkdir(VIDEOS_DIR, { recursive: true });
      cb(null, VIDEOS_DIR);
    },
    filename: (req, file, cb) => {
      const nome = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      cb(null, nome);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

type WsCallbackInfo = {
  message?: string;
  frame?: number;
  totalFrames?: number;
  motionRatio?: number;
  nextFrameIn?: number;
  error?: string;
};

function enviarParaClientes(sessionId: string, payload: string): void {
  const clientes = wsClients.get(sessionId);
  if (!clientes) return;
  clientes.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

/**
 * Inicia uma sessão de monitoramento de vídeo.
 * Corpo: multipart/form-data com campos:
 *  - mapaId (string)
 *  - useMask ('true'|'false')
 *  - useMotionOptimization ('true'|'false')
 *  - intervalSeconds (número, padrão 5)
 *  - vídeo (arquivo)
 */
router.post('/', upload.single('video'), async (req, res) => {
  console.log('[MONITOR] POST /monitorar recebido');
  console.log('[MONITOR] corpo:', req.body);
  console.log('[MONITOR] arquivo:', req.file ? { nome: req.file.originalname, caminho: req.file.path, tamanho: req.file.size } : 'nenhum');

  const { mapaId, useMask, useMotionOptimization, intervalSeconds } = req.body;
  const videoFile = req.file;

  if (!mapaId || typeof mapaId !== 'string') {
    console.log('[MONITOR] erro: mapaId ausente ou inválido');
    return res.status(400).json({ erro: 'mapaId é obrigatório.' });
  }
  if (!videoFile) {
    console.log('[MONITOR] erro: arquivo de vídeo ausente');
    return res.status(400).json({ erro: 'Envie um arquivo de vídeo no campo vídeo.' });
  }

  const mapa = await buscarMapa(mapaId);
  if (!mapa) {
    console.log('[MONITOR] erro: mapa não encontrado:', mapaId);
    return res.status(404).json({ erro: 'Mapa não encontrado.' });
  }

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const config = {
    sessionId,
    mapaId,
    videoPath: videoFile.path,
    useMask: useMask === 'true',
    useMotionOptimization: useMotionOptimization === 'true',
    intervalSeconds: parseInt(intervalSeconds as string, 10) || 5,
    onResult: (resultado: MonitorResult) => {
      enviarParaClientes(sessionId, JSON.stringify({ tipo: 'resultado', dados: resultado }));
    },
    onStatus: (status: SessionStatus, info?: WsCallbackInfo) => {
      enviarParaClientes(sessionId, JSON.stringify({ tipo: 'status', status, info }));
    },
    onError: (erro: string) => {
      enviarParaClientes(sessionId, JSON.stringify({ tipo: 'erro', mensagem: erro }));
    },
  };

  const sessao = new MonitorSession(config);
  sessions.set(sessionId, sessao);
  wsClients.set(sessionId, new Set());

  try {
    console.log('[MONITOR] iniciando sessão:', sessionId);
    await sessao.start();
    console.log('[MONITOR] sessão iniciada com sucesso:', sessionId);
    return res.json({
      success: true,
      data: {
        sessionId,
        status: 'iniciado',
        mensagem: 'Monitoramento iniciado. Conecte via WebSocket para receber resultados em tempo real.',
      },
    });
  } catch (err: any) {
    console.error('[MONITOR] erro ao iniciar sessão:', err.message);
    sessions.delete(sessionId);
    wsClients.delete(sessionId);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao iniciar monitoramento.',
    });
  }
});

/**
 * Para uma sessão de monitoramento.
 */
router.post('/:sessionId/parar', (req, res) => {
  const { sessionId } = req.params;
  const sessao = sessions.get(sessionId);
  if (!sessao) {
    return res.status(404).json({ erro: 'Sessão não encontrada.' });
  }
  sessao.stop();
  return res.json({ sessionId, status: 'parado' });
});

/**
 * Retorna o status atual de uma sessão.
 */
router.get('/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  const sessao = sessions.get(sessionId);
  if (!sessao) {
    return res.status(404).json({ erro: 'Sessão não encontrada.' });
  }
  return res.json({ sessionId, status: 'ativo' });
});

export { router as monitorRouter, sessions, wsClients };

/**
 * Anexa o servidor WebSocket ao servidor HTTP existente.
 * Deve ser chamado após criar o servidor HTTP no server.ts.
 */
export function anexarWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: '/ws/monitor' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      ws.close(1008, 'sessionId é obrigatório');
      return;
    }

    let clientes = wsClients.get(sessionId);
    if (!clientes) {
      clientes = new Set();
      wsClients.set(sessionId, clientes);
    }
    clientes.add(ws);

    ws.on('close', () => {
      clientes?.delete(ws);
    });

    ws.on('error', () => {
      clientes?.delete(ws);
    });
  });
}
