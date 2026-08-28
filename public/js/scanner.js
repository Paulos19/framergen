// Media Studio Suite - Digitalizador de Imagens para PDF (Scanner)

import { showToast, openImageModal } from './ui.js';

let scannerPages = []; // Array de { id, file, url, dataUrl, jobId, frameName, name, filter, rotate }
let globalFilter = 'original';
let sortableInstance = null;

export function initScanner() {
  const dropzone = document.getElementById('scanner-dropzone');
  const fileInput = document.getElementById('scanner-file-input');
  const generatePdfBtn = document.getElementById('btn-generate-pdf');
  const clearAllBtn = document.getElementById('btn-scanner-clear-all');
  const filterBtns = document.querySelectorAll('.scan-filter-btn');

  // Drag & Drop
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-emerald-500', 'bg-emerald-500/5');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-emerald-500', 'bg-emerald-500/5');
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-emerald-500', 'bg-emerald-500/5');
    if (e.dataTransfer.files?.length) {
      handleFilesUpload(Array.from(e.dataTransfer.files));
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleFilesUpload(Array.from(e.target.files));
    }
  });

  // Filtro Global
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active', 'bg-emerald-600', 'text-white'));
      filterBtns.forEach((b) => b.classList.add('bg-surface-card', 'text-slate-300'));
      btn.classList.add('active', 'bg-emerald-600', 'text-white');
      btn.classList.remove('bg-surface-card', 'text-slate-300');

      globalFilter = btn.dataset.filter;
      // Aplica o filtro a todas as páginas existentes
      scannerPages.forEach((p) => (p.filter = globalFilter));
      renderPagesGrid();
      showToast(`Filtro global '${globalFilter}' aplicado a todas as páginas`, 'info');
    });
  });

  // Limpar Todas as Páginas
  clearAllBtn?.addEventListener('click', () => {
    scannerPages = [];
    renderPagesGrid();
    showToast('Todas as páginas foram removidas do scanner.', 'info');
  });

  // Gerar e Baixar PDF
  generatePdfBtn?.addEventListener('click', generatePdfDocument);

  // Inicializa SortableJS no Grid
  const grid = document.getElementById('sortable-pages-grid');
  if (grid && window.Sortable) {
    sortableInstance = new Sortable(grid, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: () => {
        // Reordena o array scannerPages conforme o novo DOM
        const newOrder = [];
        grid.querySelectorAll('[data-page-id]').forEach((el) => {
          const pageId = el.dataset.pageId;
          const page = scannerPages.find((p) => p.id === pageId);
          if (page) newOrder.push(page);
        });
        scannerPages = newOrder;
        updatePageNumbers();
      },
    });
  }
}

function handleFilesUpload(files) {
  const imageFiles = files.filter((f) => f.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    showToast('Nenhuma imagem válida encontrada.', 'error');
    return;
  }

  const newItems = imageFiles.map((file) => ({
    file,
    url: URL.createObjectURL(file),
    name: file.name,
  }));

  addPagesToScanner(newItems);
  showToast(`${newItems.length} página(s) adicionada(s) ao scanner.`, 'success');
}

/**
 * Adiciona páginas ao scanner (usado interna e externamente pelo Extrator e Removedor de Fundo)
 */
export function addPagesToScanner(items) {
  items.forEach((item) => {
    const id = `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    scannerPages.push({
      id,
      file: item.file || null,
      url: item.url || item.dataUrl,
      dataUrl: item.dataUrl || null,
      jobId: item.jobId || null,
      frameName: item.frameName || null,
      name: item.name || 'Página',
      filter: globalFilter,
      rotate: 0,
    });
  });

  renderPagesGrid();
}

function renderPagesGrid() {
  const grid = document.getElementById('sortable-pages-grid');
  const emptyState = document.getElementById('scanner-empty-state');
  const pageCountBadge = document.getElementById('scanner-page-count');
  const generatePdfBtn = document.getElementById('btn-generate-pdf');

  if (pageCountBadge) pageCountBadge.textContent = `${scannerPages.length} página${scannerPages.length === 1 ? '' : 's'}`;
  if (generatePdfBtn) generatePdfBtn.disabled = scannerPages.length === 0;

  if (!grid) return;

  if (scannerPages.length === 0) {
    grid.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  grid.innerHTML = '';

  scannerPages.forEach((page, index) => {
    const card = document.createElement('div');
    card.className = 'group relative rounded-xl overflow-hidden glass-card border border-surface-border hover:border-emerald-500 transition-all flex flex-col bg-black/40';
    card.dataset.pageId = page.id;

    card.innerHTML = `
      <!-- Thumbnail com Rotação CSS -->
      <div class="relative aspect-[3/4] w-full overflow-hidden bg-slate-900 flex items-center justify-center p-2 cursor-grab active:cursor-grabbing">
        <img src="${page.url}" alt="${page.name}" style="transform: rotate(${page.rotate}deg);" class="max-h-full max-w-full object-contain transition-transform duration-200" />
        
        <!-- Número da Página -->
        <span class="page-number-badge absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
          #${String(index + 1).padStart(2, '0')}
        </span>

        <!-- Botão Remover Página -->
        <button data-action="remove" class="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover Página">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <!-- Barra de Controle Inferior -->
      <div class="p-2 border-t border-surface-border flex items-center justify-between text-xs bg-surface-card">
        <span class="font-mono text-[10px] text-slate-400 truncate max-w-[80px]" title="${page.name}">${page.name}</span>
        
        <div class="flex items-center gap-1">
          <!-- Girar 90° -->
          <button data-action="rotate" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200" title="Girar 90°">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
          </button>
          <!-- Ver Ampliado -->
          <button data-action="view" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200" title="Ver Ampliado">
            <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  lucide.createIcons({ root: grid });

  // Event Listeners dos Cards
  grid.querySelectorAll('[data-page-id]').forEach((cardEl) => {
    const pageId = cardEl.dataset.pageId;
    const page = scannerPages.find((p) => p.id === pageId);
    if (!page) return;

    cardEl.querySelector('[data-action="rotate"]')?.addEventListener('click', () => {
      page.rotate = (page.rotate + 90) % 360;
      const img = cardEl.querySelector('img');
      if (img) img.style.transform = `rotate(${page.rotate}deg)`;
    });

    cardEl.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      scannerPages = scannerPages.filter((p) => p.id !== pageId);
      renderPagesGrid();
    });

    cardEl.querySelector('[data-action="view"]')?.addEventListener('click', () => {
      openImageModal(page.url);
    });
  });
}

function updatePageNumbers() {
  const badges = document.querySelectorAll('.page-number-badge');
  badges.forEach((badge, idx) => {
    badge.textContent = `#${String(idx + 1).padStart(2, '0')}`;
  });
}

async function generatePdfDocument() {
  if (scannerPages.length === 0) {
    showToast('Adicione ao menos 1 página para gerar o PDF.', 'error');
    return;
  }

  const btn = document.getElementById('btn-generate-pdf');
  const title = document.getElementById('pdf-doc-title')?.value.trim() || 'Documento_Digitalizado';
  const pageSize = document.getElementById('pdf-page-size')?.value || 'a4';
  const orientation = document.getElementById('pdf-orientation')?.value || 'auto';
  const margin = document.getElementById('pdf-margins')?.value || 'compact';

  try {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Gerando PDF (${scannerPages.length} páginas)...</span>`;
    lucide.createIcons({ root: btn });

    const formData = new FormData();
    formData.append('title', title);
    formData.append('pageSize', pageSize);
    formData.append('orientation', orientation);
    formData.append('margin', margin);

    const pagesConfig = [];

    for (let i = 0; i < scannerPages.length; i++) {
      const page = scannerPages[i];
      pagesConfig.push({
        filter: page.filter || globalFilter,
        rotate: page.rotate || 0,
      });

      // Se temos o File nativo
      if (page.file) {
        formData.append('images', page.file);
      } 
      // Ou se é base64 / frame url, buscamos o blob para envio multipart
      else if (page.url) {
        const response = await fetch(page.url);
        const blob = await response.blob();
        formData.append('images', blob, page.name || `page_${i + 1}.png`);
      }
    }

    formData.append('pagesConfig', JSON.stringify(pagesConfig));

    const res = await fetch('/api/scanner/generate-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha na geração do PDF');
    }

    const pdfBlob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast('PDF gerado e baixado com sucesso!', 'success');
  } catch (err) {
    showToast(`Erro ao gerar PDF: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="file-down" class="w-4 h-4"></i><span>Gerar e Baixar PDF</span>`;
    lucide.createIcons({ root: btn });
  }
}
