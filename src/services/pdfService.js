import { PDFDocument } from 'pdf-lib';
import { applyScannerFilter, getImageDimensions } from './scannerService.js';

const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612.00, 792.00],
};

const MARGIN_SIZES = {
  none: 0,
  compact: 20,
  normal: 40,
};

/**
 * Cria um arquivo PDF a partir de uma lista de imagens com opções de layout e filtros
 * 
 * @param {Array<{ buffer: Buffer, filter?: string, rotate?: number }>} imageItems 
 * @param {Object} options 
 * @returns {Promise<Uint8Array>}
 */
export async function createPdfFromImages(imageItems, options = {}) {
  const {
    pageSize = 'a4',        // 'a4' | 'letter' | 'fit'
    orientation = 'auto',   // 'portrait' | 'landscape' | 'auto'
    margin = 'compact',     // 'none' | 'compact' | 'normal'
    title = 'Documento Digitalizado',
    author = 'Media Studio Suite',
  } = options;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  pdfDoc.setProducer('Media Studio Suite (Node.js & pdf-lib)');
  pdfDoc.setCreationDate(new Date());

  const marginPt = MARGIN_SIZES[margin] ?? 20;

  for (const item of imageItems) {
    // 1. Processa a imagem aplicando o filtro e a rotação
    const processedBuffer = await applyScannerFilter(item.buffer, {
      filter: item.filter || 'original',
      rotate: item.rotate || 0,
      format: 'jpeg',
    });

    const dimensions = await getImageDimensions(processedBuffer);
    const imgWidth = dimensions.width;
    const imgHeight = dimensions.height;

    // 2. Incorpora a imagem no documento PDF
    const embeddedImage = await pdfDoc.embedJpg(processedBuffer);

    let pageWidth, pageHeight;

    if (pageSize === 'fit') {
      // Página ajustada exatamente ao tamanho da imagem + margem
      pageWidth = imgWidth + marginPt * 2;
      pageHeight = imgHeight + marginPt * 2;
    } else {
      const baseDimensions = PAGE_SIZES[pageSize.toLowerCase()] || PAGE_SIZES.a4;
      let [dimW, dimH] = baseDimensions;

      let isLandscape = false;
      if (orientation === 'landscape') {
        isLandscape = true;
      } else if (orientation === 'portrait') {
        isLandscape = false;
      } else {
        // 'auto': se a imagem for mais larga que alta, vira a página para paisagem
        isLandscape = imgWidth > imgHeight;
      }

      pageWidth = isLandscape ? Math.max(dimW, dimH) : Math.min(dimW, dimH);
      pageHeight = isLandscape ? Math.min(dimW, dimH) : Math.max(dimW, dimH);
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // 3. Calcula o tamanho e a posição da imagem com preservação de proporção (contain)
    const availableWidth = Math.max(10, pageWidth - marginPt * 2);
    const availableHeight = Math.max(10, pageHeight - marginPt * 2);

    const scale = Math.min(
      availableWidth / imgWidth,
      availableHeight / imgHeight
    );

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const xPos = marginPt + (availableWidth - drawWidth) / 2;
    const yPos = marginPt + (availableHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x: xPos,
      y: yPos,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}
