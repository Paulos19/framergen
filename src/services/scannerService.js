import { Jimp } from 'jimp';

/**
 * Aplica filtros de digitalização (scanner de documentos) e correções de imagem usando Jimp
 * 
 * @param {Buffer} imageBuffer 
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
export async function applyScannerFilter(imageBuffer, options = {}) {
  const {
    filter = 'original', // 'original' | 'magic-color' | 'clean-bw' | 'grayscale' | 'crisp'
    rotate = 0,          // 0, 90, 180, 270
    brightness = 1.0,    // 0.5 a 2.0
    contrast = 1.0,      // 0.5 a 2.0
    format = 'jpeg',     // 'jpeg' | 'png' | 'webp'
  } = options;

  const image = await Jimp.read(imageBuffer);

  // Rotação
  if (rotate && [90, 180, 270].includes(Number(rotate))) {
    image.rotate(Number(rotate));
  }

  // Aplica o filtro selecionado
  switch (filter) {
    case 'magic-color':
      // Realça cores e saturação para documentos coloridos
      image.color([
        { apply: 'saturate', params: [30] },
      ]);
      image.contrast(0.25);
      image.brightness(0.05);
      break;

    case 'clean-bw':
      // Documento preto e branco limpo (estilo fotocopiadora/scanner)
      image.greyscale();
      image.contrast(0.65);
      
      // Limiarização binarizada para papel branco puro e texto preto nítido
      const data = image.bitmap.data;
      const threshold = 145;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const val = avg >= threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      break;

    case 'grayscale':
      // Escala de cinza balanceada
      image.greyscale();
      image.contrast(0.15);
      break;

    case 'crisp':
      // Aumento de nitidez e clareza
      image.contrast(0.2);
      image.color([
        { apply: 'saturate', params: [10] },
      ]);
      break;

    case 'original':
    default:
      if (brightness !== 1.0) {
        image.brightness(brightness - 1.0);
      }
      if (contrast !== 1.0) {
        image.contrast(contrast - 1.0);
      }
      break;
  }

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  return image.getBuffer(mime);
}

/**
 * Obtém dimensões da imagem
 */
export async function getImageDimensions(imageBuffer) {
  const img = await Jimp.read(imageBuffer);
  return {
    width: img.bitmap.width,
    height: img.bitmap.height,
  };
}
