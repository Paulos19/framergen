import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { DIRS } from '../utils/fileCleanup.js';

// Armazena o progresso dos jobs de extração
export const extractionJobs = new Map();

/**
 * Obtém informações detalhadas do vídeo usando ffprobe
 */
export function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration,size,bit_rate:stream=width,height,r_frame_rate,avg_frame_rate,codec_name,nb_frames',
      '-of', 'json',
      videoPath,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout);
          const format = parsed.format || {};
          const videoStream = (parsed.streams || []).find((s) => s.width && s.height) || {};

          let fps = 24;
          if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
            if (den && den > 0) fps = Math.round((num / den) * 100) / 100;
          }

          const duration = parseFloat(format.duration) || 0;
          const width = parseInt(videoStream.width, 10) || 0;
          const height = parseInt(videoStream.height, 10) || 0;
          const sizeBytes = parseInt(format.size, 10) || 0;

          resolve({
            duration,
            width,
            height,
            fps,
            codec: videoStream.codec_name || 'unknown',
            sizeBytes,
            estimatedFrames24fps: Math.round(duration * 24),
          });
        } catch (e) {
          resolve({ duration: 0, width: 0, height: 0, fps: 24, estimatedFrames24fps: 0 });
        }
      } else {
        // Fallback básico
        resolve({ duration: 8, width: 1920, height: 1080, fps: 24, estimatedFrames24fps: 192 });
      }
    });

    ffprobe.on('error', () => {
      resolve({ duration: 8, width: 1920, height: 1080, fps: 24, estimatedFrames24fps: 192 });
    });
  });
}

/**
 * Cria um vídeo de teste sintético de 8 segundos (24 FPS, 192 frames)
 */
export async function createTestVideo(outputPath, duration = 8, fps = 24) {
  await fs.ensureDir(path.dirname(outputPath));

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `testsrc=duration=${duration}:size=1920x1080:rate=${fps}`,
      '-vf', `drawtext=text='MEDIA STUDIO 24 FPS - Frame %{frame_num}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)/2`,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      outputPath,
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', (d) => (stderr += d.toString()));

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        // Fallback simples sem drawtext caso o ffmpeg não tenha libfreetype
        const fallback = spawn('ffmpeg', [
          '-y',
          '-f', 'lavfi',
          '-i', `testsrc=duration=${duration}:size=1920x1080:rate=${fps}`,
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          outputPath,
        ]);
        fallback.on('close', (fCode) => {
          if (fCode === 0) resolve(outputPath);
          else reject(new Error(`Falha ao gerar vídeo de teste (${stderr})`));
        });
      }
    });

    ffmpeg.on('error', reject);
  });
}

/**
 * Extrai os frames do vídeo a 24 FPS (ou taxa configurada) com alta performance
 */
export async function extractVideoFrames({
  jobId,
  videoPath,
  fps = 24,
  format = 'png',
  quality = 2,
  maxFrames = null,
}) {
  const targetDir = path.join(DIRS.frames, jobId);
  await fs.ensureDir(targetDir);

  const meta = await getVideoMetadata(videoPath);
  const totalExpected = meta.duration > 0 ? Math.round(meta.duration * fps) : (fps * 8);

  const jobState = {
    id: jobId,
    status: 'processing',
    progress: 0,
    currentFrame: 0,
    totalExpected,
    fpsSpeed: 0,
    startTime: Date.now(),
    endTime: null,
    targetDir,
    format,
    fps,
    meta,
    files: [],
    error: null,
  };
  extractionJobs.set(jobId, jobState);

  const outputPattern = path.join(targetDir, `frame_%04d.${format}`);
  const ffmpegArgs = [
    '-y',
    '-threads', '0',
    '-i', videoPath,
    '-vf', `fps=${fps}`,
  ];

  if (maxFrames && maxFrames > 0) {
    ffmpegArgs.push('-vframes', String(maxFrames));
  }

  if (format === 'png') {
    ffmpegArgs.push('-compression_level', '1'); // Ultra rápido sem perda visual
  } else if (format === 'jpg' || format === 'jpeg') {
    ffmpegArgs.push('-q:v', String(quality));
  } else if (format === 'webp') {
    ffmpegArgs.push('-quality', '90');
  }

  ffmpegArgs.push(outputPattern);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderr = '';

    ffmpeg.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;

      const frameMatch = text.match(/frame=\s*(\d+)/);
      const fpsMatch = text.match(/fps=\s*([\d.]+)/);

      if (frameMatch) {
        const currentFrame = parseInt(frameMatch[1], 10);
        jobState.currentFrame = currentFrame;
        jobState.fpsSpeed = fpsMatch ? parseFloat(fpsMatch[1]) : 0;
        
        if (totalExpected > 0) {
          jobState.progress = Math.min(99, Math.round((currentFrame / totalExpected) * 100));
        }
      }
    });

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        const dirents = await fs.readdir(targetDir);
        const frameFiles = dirents
          .filter((f) => f.startsWith('frame_') && f.endsWith(`.${format}`))
          .sort();

        jobState.status = 'completed';
        jobState.progress = 100;
        jobState.endTime = Date.now();
        jobState.files = frameFiles;
        jobState.totalFrames = frameFiles.length;
        jobState.durationSeconds = ((jobState.endTime - jobState.startTime) / 1000).toFixed(2);

        resolve(jobState);
      } else {
        jobState.status = 'failed';
        jobState.error = `FFmpeg falhou com código ${code}: ${stderr.slice(-300)}`;
        reject(new Error(jobState.error));
      }
    });

    ffmpeg.on('error', (err) => {
      jobState.status = 'failed';
      jobState.error = err.message;
      reject(err);
    });
  });
}
