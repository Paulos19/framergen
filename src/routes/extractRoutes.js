import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { randomUUID } from 'crypto';
import {
  getVideoMetadata,
  createTestVideo,
  extractVideoFrames,
  extractionJobs,
} from '../services/ffmpegService.js';
import { DIRS } from '../utils/fileCleanup.js';

const router = express.Router();

// Configuração do Multer para upload de vídeos (máximo 500MB)
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.ensureDir(DIRS.uploads);
    cb(null, DIRS.uploads);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    cb(null, `video_${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`Formato de vídeo não suportado (${ext}). Envie MP4, MOV, WEBM, MKV ou AVI.`));
    }
  },
});

/**
 * POST /api/extract/upload
 * Faz upload de um vídeo e inicia o processo de extração a 24 FPS
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de vídeo foi enviado.' });
    }

    const videoPath = req.file.path;
    const fps = parseFloat(req.body.fps) || 24;
    const format = (req.body.format || 'png').toLowerCase();
    const quality = parseInt(req.body.quality, 10) || 2;
    const maxFrames = parseInt(req.body.maxFrames, 10) || null;

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Obtém metadados iniciais
    const meta = await getVideoMetadata(videoPath);

    // Inicia extração em background
    extractVideoFrames({
      jobId,
      videoPath,
      fps,
      format,
      quality,
      maxFrames,
    }).catch((err) => {
      console.error(`[Extract Error] Falha no job ${jobId}:`, err);
    });

    res.json({
      success: true,
      jobId,
      originalName: req.file.originalname,
      fps,
      format,
      meta,
      statusUrl: `/api/extract/status/${jobId}`,
    });
  } catch (error) {
    console.error('Erro na rota /api/extract/upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/extract/test
 * Gera um vídeo de teste de 8 segundos (24 FPS / 192 frames) e inicia a extração
 */
router.post('/test', async (req, res) => {
  try {
    const fps = parseFloat(req.body.fps) || 24;
    const duration = parseFloat(req.body.duration) || 8;
    const format = (req.body.format || 'png').toLowerCase();

    const jobId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const testVideoPath = path.join(DIRS.uploads, `${jobId}_8s_test.mp4`);

    console.log(`[Test] Gerando vídeo de teste de ${duration}s @ ${fps}fps...`);
    await createTestVideo(testVideoPath, duration, fps);

    // Inicia extração
    extractVideoFrames({
      jobId,
      videoPath: testVideoPath,
      fps,
      format,
      quality: 2,
    }).catch((err) => {
      console.error(`[Extract Test Error] Job ${jobId}:`, err);
    });

    res.json({
      success: true,
      jobId,
      originalName: 'test_video_8s.mp4',
      fps,
      format,
      duration,
      estimatedFrames: Math.round(duration * fps),
      statusUrl: `/api/extract/status/${jobId}`,
    });
  } catch (error) {
    console.error('Erro na rota /api/extract/test:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/extract/status/:jobId
 * Retorna o progresso atual, velocidade e frames gerados
 */
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = extractionJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job não encontrado ou expirado.' });
  }

  // Prepara URLs dos frames para o frontend
  const frameUrls = (job.files || []).map((f) => `/api/extract/frame/${jobId}/${f}`);

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentFrame: job.currentFrame,
    totalExpected: job.totalExpected,
    fpsSpeed: job.fpsSpeed,
    totalFrames: job.totalFrames || job.files.length,
    durationSeconds: job.durationSeconds,
    format: job.format,
    fps: job.fps,
    meta: job.meta,
    files: job.files,
    frameUrls,
    error: job.error,
  });
});

/**
 * GET /api/extract/frame/:jobId/:frameName
 * Serve um frame específico com cache HTTP inteligente
 */
router.get('/frame/:jobId/:frameName', async (req, res) => {
  try {
    const { jobId, frameName } = req.params;
    const sanitizedName = path.basename(frameName);
    const framePath = path.join(DIRS.frames, jobId, sanitizedName);

    if (!(await fs.pathExists(framePath))) {
      return res.status(404).send('Frame não encontrado.');
    }

    const ext = path.extname(sanitizedName).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    });

    res.sendFile(framePath);
  } catch (error) {
    res.status(500).send('Erro ao carregar frame.');
  }
});

export default router;
