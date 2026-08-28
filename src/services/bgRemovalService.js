import removeBackground from '@imgly/background-removal-node';
import { Jimp } from 'jimp';

// Constantes para o refinamento de bordas
const ALPHA_HARD_MIN = 15;      // Abaixo disso: transparência completa
const ALPHA_SOFT_MIN = 50;      // Faixa 15-50: gradiente suave preserva cabelos/fios
const ALPHA_FEATHER_RADIUS = 1; // Raio de suavização

function pixelOffset(x, y, width) {
  return (y * width + x) * 4;
}

function getAlpha(data, x, y, width, height) {
  if (x < 0 || x >= width || y < 0 || y >= height) return 0;
  return data[pixelOffset(x, y, width) + 3];
}

/**
 * Fase 1: Gradiente suave no canal alfa
 */
function applySoftGradient(data) {
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < ALPHA_HARD_MIN) {
      data[i + 3] = 0;
    } else if (alpha < ALPHA_SOFT_MIN) {
      const ratio = (alpha - ALPHA_HARD_MIN) / (ALPHA_SOFT_MIN - ALPHA_HARD_MIN);
      data[i + 3] = Math.round(ratio * ALPHA_SOFT_MIN);
    }
  }
}

/**
 * Fase 2: Suavização de bordas por média local
 */
function smoothEdgeBorders(data, width, height) {
  const original = new Uint8ClampedArray(data);
  const r = ALPHA_FEATHER_RADIUS;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = pixelOffset(x, y, width);
      const alpha = original[offset + 3];

      if (alpha <= 5 || alpha >= 250) continue;

      let sum = 0;
      let count = 0;

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          sum += getAlpha(original, x + dx, y + dy, width, height);
          count++;
        }
      }

      const smoothed = Math.round(alpha * 0.7 + (sum / count) * 0.3);
      data[offset + 3] = smoothed;
    }
  }
}

/**
 * Fase 3: Fechamento morfológico (dilatação + erosão)
 */
function morphologicalClose(data, width, height) {
  const RADIUS = 2;
  const dilated = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = pixelOffset(x, y, width);
      if (data[offset + 3] < 128) continue;

      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

          const nOffset = pixelOffset(nx, ny, width);
          if (dilated[nOffset + 3] < 128) {
            dilated[nOffset] = data[offset];
            dilated[nOffset + 1] = data[offset + 1];
            dilated[nOffset + 2] = data[offset + 2];
            dilated[nOffset + 3] = 200;
          }
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = pixelOffset(x, y, width);
      if (dilated[offset + 3] < 128) continue;

      let minAlpha = 255;
      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const na = getAlpha(dilated, x + dx, y + dy, width, height);
          if (na < minAlpha) minAlpha = na;
        }
      }

      if (minAlpha < 128) {
        data[offset + 3] = Math.max(dilated[offset + 3] - 60, minAlpha);
      }
    }
  }
}

/**
 * Fase 4: Recuperação de sujeitos e roupas claras
 */
function recoverLightSubject(data, width, height) {
  const RADIUS = 3;
  const COLOR_TOLERANCE = 80;
  const original = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = pixelOffset(x, y, width);
      const alpha = original[offset + 3];

      if (alpha >= 200) continue;

      let solidCount = 0;
      let avgR = 0, avgG = 0, avgB = 0;

      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nOffset = pixelOffset(x + dx, y + dy, width);
          if (nOffset < 0 || nOffset >= data.length - 3) continue;

          if (original[nOffset + 3] > 200) {
            solidCount++;
            avgR += original[nOffset];
            avgG += original[nOffset + 1];
            avgB += original[nOffset + 2];
          }
        }
      }

      if (solidCount < 5) continue;

      avgR = Math.round(avgR / solidCount);
      avgG = Math.round(avgG / solidCount);
      avgB = Math.round(avgB / solidCount);

      const dr = original[offset] - avgR;
      const dg = original[offset + 1] - avgG;
      const db = original[offset + 2] - avgB;
      const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (colorDist < COLOR_TOLERANCE) {
        const similarity = 1 - (colorDist / COLOR_TOLERANCE);
        const recoveredAlpha = Math.round(100 + similarity * 155);
        data[offset + 3] = Math.max(original[offset + 3], recoveredAlpha);
      }
    }
  }
}

/**
 * Pipeline de refinamento de bordas completo
 */
export async function refineAlphaBorders(imageBuffer) {
  const jimpImage = await Jimp.read(imageBuffer);
  const width = jimpImage.bitmap.width;
  const height = jimpImage.bitmap.height;
  const data = jimpImage.bitmap.data;

  applySoftGradient(data);
  smoothEdgeBorders(data, width, height);
  morphologicalClose(data, width, height);
  recoverLightSubject(data, width, height);

  return jimpImage.getBuffer('image/png');
}

/**
 * Executa remoção de fundo com IA e opções de pós-processamento
 */
export async function processBackgroundRemoval(imageBuffer, mimeType = 'image/png', options = {}) {
  const {
    refine = true,
    backgroundColor = null, // ex: '#ffffff' ou 'transparent'
    model = 'medium',       // 'small', 'medium'
  } = options;

  // 1. Inferência com IA
  const blob = new Blob([imageBuffer], { type: mimeType });
  const resultBlob = await removeBackground(blob, {
    model,
    output: { format: 'image/png' },
  });

  let pngBuffer = Buffer.from(await resultBlob.arrayBuffer());

  // 2. Refinamento de bordas em 4 fases
  if (refine) {
    pngBuffer = await refineAlphaBorders(pngBuffer);
  }

  // 3. Adicionar fundo sólido se solicitado usando Jimp
  if (backgroundColor && backgroundColor !== 'transparent') {
    const fgImage = await Jimp.read(pngBuffer);
    const width = fgImage.bitmap.width;
    const height = fgImage.bitmap.height;

    // Converte HEX para RGBA
    let hex = backgroundColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const bgR = parseInt(hex.substring(0, 2), 16) || 255;
    const bgG = parseInt(hex.substring(2, 4), 16) || 255;
    const bgB = parseInt(hex.substring(4, 6), 16) || 255;

    const data = fgImage.bitmap.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      data[i] = Math.round(data[i] * alpha + bgR * (1 - alpha));
      data[i + 1] = Math.round(data[i + 1] * alpha + bgG * (1 - alpha));
      data[i + 2] = Math.round(data[i + 2] * alpha + bgB * (1 - alpha));
      data[i + 3] = 255; // Opaco
    }

    return fgImage.getBuffer('image/png');
  }

  return pngBuffer;
}
