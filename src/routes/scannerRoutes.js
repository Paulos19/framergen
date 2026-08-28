import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { applyScannerFilter } from '../services/scannerService.js';
import { createPdfFromImages } from '../services/pdfService.js';
import { DIRS } from '../utils/fileCleanup.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB por arquivo
});

/**
 * POST /api/scanner/preview
 * Aplica um filtro de scanner em uma imagem individual e retorna a prévia em JPEG/DataURL
 */
router.post('/preview', upload.single('image'), async (req, res) => {
  try {
    let imageBuffer = null;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.jobId && req.body.frameName) {
      const framePath = path.join(DIRS.frames, req.body.jobId, path.basename(req.body.frameName));
      if (await fs.pathExists(framePath)) {
        imageBuffer = await fs.readFile(framePath);
      }
    } else if (req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        imageBuffer = Buffer.from(matches[2], 'base64');
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada para pré-visualização.' });
    }

    const filter = req.body.filter || 'original';
    const rotate = parseInt(req.body.rotate, 10) || 0;
    const brightness = parseFloat(req.body.brightness) || 1.0;
    const contrast = parseFloat(req.body.contrast) || 1.0;

    const processed = await applyScannerFilter(imageBuffer, {
      filter,
      rotate,
      brightness,
      contrast,
      format: 'jpeg',
    });

    res.json({
      success: true,
      filter,
      rotate,
      sizeBytes: processed.length,
      dataUrl: `data:image/jpeg;base64,${processed.toString('base64')}`,
    });
  } catch (error) {
    console.error('[Scanner Preview Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scanner/generate-pdf
 * Recebe múltiplas imagens (via upload multipart, array de frames ou JSON base64) e gera o PDF final
 */
router.post('/generate-pdf', upload.array('images', 100), async (req, res) => {
  try {
    const imageItems = [];

    // Parse das configurações de página enviadas no body
    let pagesConfig = [];
    if (req.body.pagesConfig) {
      try {
        pagesConfig = typeof req.body.pagesConfig === 'string'
          ? JSON.parse(req.body.pagesConfig)
          : req.body.pagesConfig;
      } catch (e) {
        pagesConfig = [];
      }
    }

    // 1. Processa arquivos enviados por multipart
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const config = pagesConfig[i] || {};
        imageItems.push({
          buffer: file.buffer,
          filter: config.filter || req.body.filter || 'original',
          rotate: config.rotate || 0,
        });
      }
    }

    // 2. Ou processa referências a frames de vídeo salvos no servidor
    if (req.body.frames && Array.isArray(req.body.frames)) {
      for (const item of req.body.frames) {
        const framePath = path.join(DIRS.frames, item.jobId, path.basename(item.frameName));
        if (await fs.pathExists(framePath)) {
          const buf = await fs.readFile(framePath);
          imageItems.push({
            buffer: buf,
            filter: item.filter || 'original',
            rotate: item.rotate || 0,
          });
        }
      }
    }

    // 3. Ou processa payload JSON com imagens em base64
    if (req.body.imagesBase64 && Array.isArray(req.body.imagesBase64)) {
      for (const item of req.body.imagesBase64) {
        const raw = typeof item === 'string' ? item : item.dataUrl;
        const matches = raw.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          imageItems.push({
            buffer: Buffer.from(matches[2], 'base64'),
            filter: item.filter || 'original',
            rotate: item.rotate || 0,
          });
        }
      }
    }

    if (imageItems.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem válida para criar o PDF.' });
    }

    console.log(`[PDF Generator] Gerando PDF com ${imageItems.length} páginas...`);

    const pdfBytes = await createPdfFromImages(imageItems, {
      pageSize: req.body.pageSize || 'a4',
      orientation: req.body.orientation || 'auto',
      margin: req.body.margin || 'compact',
      title: req.body.title || 'Digitalização Media Studio',
    });

    const pdfFilename = `${req.body.title ? req.body.title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'digitalizacao'}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFilename}"`,
      'Content-Length': pdfBytes.length,
    });

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('[Generate PDF Error]:', error);
    res.status(500).json({ error: `Erro ao gerar PDF: ${error.message}` });
  }
});

export default router;
