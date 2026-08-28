import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import extractRoutes from './src/routes/extractRoutes.js';
import bgRoutes from './src/routes/bgRoutes.js';
import scannerRoutes from './src/routes/scannerRoutes.js';
import zipRoutes from './src/routes/zipRoutes.js';
import { startCleanupScheduler, ensureStorageDirectories } from './src/utils/fileCleanup.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa pastas de armazenamento e agendador de limpeza
await ensureStorageDirectories();
startCleanupScheduler();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/extract', extractRoutes);
app.use('/api/bg', bgRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/download', zipRoutes);

// Endpoint de Healthcheck (ideal para VPS / Easypanel)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Media Studio Suite',
    version: '1.0.0',
  });
});

// Tratamento central de erros do Multer e da aplicação
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo excede o limite máximo permitido.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }

  console.error('[Server Error]:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🚀 MEDIA STUDIO SUITE - Servidor Online');
  console.log(`🌐 Acesso Local:     http://localhost:${PORT}`);
  console.log(`📡 Rede / Docker:    http://0.0.0.0:${PORT}`);
  console.log('✨ Módulos Ativos:   [24fps Extractor] [AI BG Remover] [PDF Scanner]');
  console.log('====================================================');
});
