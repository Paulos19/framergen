import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { DIRS } from '../utils/fileCleanup.js';

const router = express.Router();

/**
 * GET /api/download/zip/:jobId
 * Compacta todos os frames extraídos de um job e envia como download em formato .ZIP
 */
router.get('/zip/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const targetDir = path.join(DIRS.frames, jobId);

    if (!(await fs.pathExists(targetDir))) {
      return res.status(404).send('Pasta de frames não encontrada.');
    }

    const files = await fs.readdir(targetDir);
    const frameFiles = files.filter((f) => f.startsWith('frame_'));

    if (frameFiles.length === 0) {
      return res.status(404).send('Nenhum frame encontrado para compactação.');
    }

    const zipFilename = `frames_${jobId}.zip`;

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFilename}"`,
    });

    const archive = archiver('zip', {
      zlib: { level: 1 }, // Nível 1 para streaming ultra rápido sem travamento
    });

    archive.on('error', (err) => {
      console.error('[ZIP Error]:', err);
      if (!res.headersSent) {
        res.status(500).send('Erro ao compactar arquivos.');
      }
    });

    archive.pipe(res);

    for (const file of frameFiles) {
      const filePath = path.join(targetDir, file);
      archive.file(filePath, { name: file });
    }

    await archive.finalize();
  } catch (error) {
    console.error('[ZIP Route Error]:', error);
    res.status(500).send('Erro interno ao gerar arquivo ZIP.');
  }
});

/**
 * POST /api/download/zip-selected
 * Compacta apenas os frames selecionados pelo usuário
 */
router.post('/zip-selected', express.json(), async (req, res) => {
  try {
    const { jobId, frames } = req.body;

    if (!jobId || !frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'Nenhum frame selecionado para download.' });
    }

    const targetDir = path.join(DIRS.frames, jobId);
    const zipFilename = `frames_selecionados_${Date.now()}.zip`;

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFilename}"`,
    });

    const archive = archiver('zip', { zlib: { level: 1 } });
    archive.pipe(res);

    for (const frameName of frames) {
      const safeName = path.basename(frameName);
      const filePath = path.join(targetDir, safeName);
      if (await fs.pathExists(filePath)) {
        archive.file(filePath, { name: safeName });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('[ZIP Selected Error]:', error);
    res.status(500).send('Erro ao gerar ZIP de selecionados.');
  }
});

export default router;
