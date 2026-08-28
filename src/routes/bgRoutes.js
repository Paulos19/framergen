import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { processBackgroundRemoval } from '../services/bgRemovalService.js';
import { DIRS } from '../utils/fileCleanup.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}. Envie uma imagem (PNG, JPG, WEBP).`));
    }
  },
});

/**
 * POST /api/bg/remove
 * Remove o fundo de uma imagem enviada via formulário ou a partir de um frame existente
 */
router.post('/remove', upload.single('image'), async (req, res) => {
  try {
    let imageBuffer = null;
    let mimeType = 'image/png';
    let originalName = 'image';

    // 1. Verifica se veio arquivo direto no upload
    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      originalName = path.parse(req.file.originalname).name;
    } 
    // 2. Ou se veio referência a um frame extraído anteriormente (jobId + frameName)
    else if (req.body.jobId && req.body.frameName) {
      const framePath = path.join(DIRS.frames, req.body.jobId, path.basename(req.body.frameName));
      if (await fs.pathExists(framePath)) {
        imageBuffer = await fs.readFile(framePath);
        originalName = path.parse(req.body.frameName).name;
        mimeType = 'image/png';
      } else {
        return res.status(404).json({ error: 'Frame original não encontrado no servidor.' });
      }
    } 
    // 3. Ou se veio imagem em Base64
    else if (req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
        originalName = req.body.filename || 'image_base64';
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida para remoção de fundo.' });
    }

    const refine = req.body.refine !== 'false' && req.body.refine !== false;
    const backgroundColor = req.body.backgroundColor || 'transparent';
    const model = req.body.model || 'medium';

    console.log(`[BG Remove] Processando imagem '${originalName}' (${(imageBuffer.length / 1024).toFixed(1)} KB)...`);
    const startTime = Date.now();

    const outputBuffer = await processBackgroundRemoval(imageBuffer, mimeType, {
      refine,
      backgroundColor,
      model,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[BG Remove] Concluído em ${elapsed}s: ${(outputBuffer.length / 1024).toFixed(1)} KB`);

    const outputFilename = `${originalName}_sem_fundo.png`;

    // Se o cliente pediu resposta em JSON com base64
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        filename: outputFilename,
        size: outputBuffer.length,
        elapsedSeconds: elapsed,
        dataUrl: `data:image/png;base64,${outputBuffer.toString('base64')}`,
      });
    }

    // Caso contrário, envia o binário PNG diretamente
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${outputFilename}"`,
      'X-Elapsed-Time': `${elapsed}s`,
    });

    res.send(outputBuffer);
  } catch (error) {
    console.error('[BG Remove Error]:', error);
    res.status(500).json({ error: `Falha na remoção de fundo: ${error.message}` });
  }
});

export default router;
