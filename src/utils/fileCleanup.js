import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export const DIRS = {
  uploads: path.join(rootDir, 'storage', 'uploads'),
  frames: path.join(rootDir, 'storage', 'frames'),
  bgOutput: path.join(rootDir, 'storage', 'bg-output'),
  pdfOutput: path.join(rootDir, 'storage', 'pdf-output'),
  tmp: path.join(rootDir, 'storage', 'tmp'),
};

/**
 * Garante que todas as pastas de armazenamento existam
 */
export async function ensureStorageDirectories() {
  for (const dir of Object.values(DIRS)) {
    await fs.ensureDir(dir);
  }
}

/**
 * Limpa arquivos antigos (mais de 2 horas) para evitar consumo excessivo de disco
 */
export async function cleanupOldFiles(maxAgeMs = 2 * 60 * 60 * 1000) {
  const now = Date.now();
  for (const dir of Object.values(DIRS)) {
    try {
      if (!(await fs.pathExists(dir))) continue;
      const items = await fs.readdir(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.remove(itemPath);
          console.log(`[Cleanup] Removido item expirado: ${item}`);
        }
      }
    } catch (err) {
      console.error(`[Cleanup Error] Erro ao limpar diretório ${dir}:`, err.message);
    }
  }
}

// Inicia rotina de limpeza a cada 30 minutos
export function startCleanupScheduler() {
  ensureStorageDirectories();
  setInterval(() => {
    cleanupOldFiles();
  }, 30 * 60 * 1000);
}
