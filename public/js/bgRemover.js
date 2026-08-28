// Media Studio Suite - Removedor de Fundo IA & Split Viewer

import { showToast, switchTab } from './ui.js';
import { addPagesToScanner } from './scanner.js';

let currentBgImageFile = null;
let currentFrameReference = null; // { jobId, frameName, url }
let currentOriginalUrl = null;
let currentOutputDataUrl = null;
let selectedBgColor = 'transparent';

export function initBgRemover() {
  const dropzone = document.getElementById('bg-dropzone');
  const fileInput = document.getElementById('bg-file-input');
  const processBtn = document.getElementById('btn-process-bg');
  const transpBtn = document.getElementById('bg-type-transp');
  const solidBtn = document.getElementById('bg-type-solid');
  const solidPalette = document.getElementById('solid-color-palette');
  const customColorPicker = document.getElementById('bg-custom-color-picker');
  const downloadPngBtn = document.getElementById('btn-download-transparent-png');
  const sendToScannerBtn = document.getElementById('btn-send-bg-to-scanner');

  // Drag & Drop
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-purple-500', 'bg-purple-500/5');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-purple-500', 'bg-purple-500/5');
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-purple-500', 'bg-purple-500/5');
    if (e.dataTransfer.files?.length) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleImageSelect(e.target.files[0]);
    }
  });

  // Alternância de Fundo Transparente / Sólido
  transpBtn?.addEventListener('click', () => {
    transpBtn.classList.add('active', 'bg-purple-600', 'text-white', 'border-purple-500');
    transpBtn.classList.remove('bg-surface-card', 'text-slate-400', 'border-surface-border');
    solidBtn?.classList.remove('active', 'bg-purple-600', 'text-white', 'border-purple-500');
    solidBtn?.classList.add('bg-surface-card', 'text-slate-400', 'border-surface-border');
    solidPalette?.classList.add('hidden');
    selectedBgColor = 'transparent';
    applyBackgroundToViewer();
  });

  solidBtn?.addEventListener('click', () => {
    solidBtn.classList.add('active', 'bg-purple-600', 'text-white', 'border-purple-500');
    solidBtn.classList.remove('bg-surface-card', 'text-slate-400', 'border-surface-border');
    transpBtn?.classList.remove('active', 'bg-purple-600', 'text-white', 'border-purple-500');
    transpBtn?.classList.add('bg-surface-card', 'text-slate-400', 'border-surface-border');
    solidPalette?.classList.remove('hidden');
    selectedBgColor = customColorPicker?.value || '#ffffff';
    applyBackgroundToViewer();
  });

  // Cores Pré-definidas
  document.querySelectorAll('.color-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedBgColor = btn.dataset.color;
      if (customColorPicker) customColorPicker.value = selectedBgColor;
      applyBackgroundToViewer();
    });
  });

  customColorPicker?.addEventListener('input', (e) => {
    selectedBgColor = e.target.value;
    applyBackgroundToViewer();
  });

  // Iniciar Processamento IA
  processBtn?.addEventListener('click', runBackgroundRemoval);

  // Ações do Resultado
  downloadPngBtn?.addEventListener('click', downloadResultImage);
  sendToScannerBtn?.addEventListener('click', () => {
    if (!currentOutputDataUrl) return;
    addPagesToScanner([{ dataUrl: currentOutputDataUrl, name: 'recorte_sem_fundo.png' }]);
    switchTab('scanner');
    showToast('Imagem sem fundo adicionada ao Scanner PDF!', 'success');
  });

  // Inicia Slider de Comparação
  initSplitSlider();
}

function handleImageSelect(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Envie um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
    return;
  }

  currentBgImageFile = file;
  currentFrameReference = null;
  currentOriginalUrl = URL.createObjectURL(file);

  const dropzone = document.getElementById('bg-dropzone');
  const processBtn = document.getElementById('btn-process-bg');
  if (processBtn) processBtn.disabled = false;

  if (dropzone) {
    dropzone.innerHTML = `
      <div class="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
        <i data-lucide="check" class="w-8 h-8"></i>
      </div>
      <h3 class="text-base font-semibold text-white mb-1">${file.name}</h3>
      <p class="text-xs text-slate-400 font-mono mb-2">${(file.size / 1024).toFixed(1)} KB</p>
      <span class="text-xs text-purple-400 hover:underline cursor-pointer">Trocar de imagem</span>
    `;
    lucide.createIcons({ root: dropzone });
  }

  showToast(`Imagem carregada: ${file.name}`, 'info');
}

export function loadFrameInBgRemover(jobId, frameName, url) {
  currentBgImageFile = null;
  currentFrameReference = { jobId, frameName, url };
  currentOriginalUrl = url;

  const dropzone = document.getElementById('bg-dropzone');
  const processBtn = document.getElementById('btn-process-bg');
  if (processBtn) processBtn.disabled = false;

  if (dropzone) {
    dropzone.innerHTML = `
      <div class="relative w-20 h-14 rounded-xl overflow-hidden mb-3 border border-purple-500">
        <img src="${url}" alt="${frameName}" class="w-full h-full object-cover" />
      </div>
      <h3 class="text-base font-semibold text-white mb-1">${frameName}</h3>
      <p class="text-xs text-purple-300 font-mono mb-2">Frame importado do Extrator 24fps</p>
      <span class="text-xs text-purple-400 hover:underline cursor-pointer">Trocar por outra imagem</span>
    `;
  }
}

async function runBackgroundRemoval() {
  const loadingCard = document.getElementById('bg-loading-card');
  const resultSection = document.getElementById('bg-result-section');
  const processBtn = document.getElementById('btn-process-bg');
  const refine = document.getElementById('bg-refine-checkbox')?.checked ?? true;

  try {
    loadingCard?.classList.remove('hidden');
    resultSection?.classList.add('hidden');
    if (processBtn) processBtn.disabled = true;

    const formData = new FormData();
    formData.append('refine', refine);
    formData.append('backgroundColor', 'transparent'); // Mantém o PNG puro para compositing no cliente

    if (currentBgImageFile) {
      formData.append('image', currentBgImageFile);
    } else if (currentFrameReference) {
      formData.append('jobId', currentFrameReference.jobId);
      formData.append('frameName', currentFrameReference.frameName);
    } else {
      throw new Error('Nenhuma imagem selecionada.');
    }

    const res = await fetch('/api/bg/remove', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao processar com IA');
    }

    const data = await res.json();
    currentOutputDataUrl = data.dataUrl;

    // Atualiza badges
    const elapsedBadge = document.getElementById('bg-elapsed-badge');
    const sizeBadge = document.getElementById('bg-output-filesize');
    if (elapsedBadge) elapsedBadge.textContent = `Concluído em ${data.elapsedSeconds}s`;
    if (sizeBadge) sizeBadge.textContent = `Tamanho: ${(data.size / 1024).toFixed(1)} KB`;

    // Configura o Comparador Antes/Depois
    setupSplitViewer(currentOriginalUrl, currentOutputDataUrl);

    showToast('Fundo removido com sucesso!', 'success');
    loadingCard?.classList.add('hidden');
    resultSection?.classList.remove('hidden');
  } catch (err) {
    showToast(`Erro: ${err.message}`, 'error');
    loadingCard?.classList.add('hidden');
  } finally {
    if (processBtn) processBtn.disabled = false;
  }
}

function setupSplitViewer(beforeUrl, afterDataUrl) {
  const imgBefore = document.getElementById('split-img-before');
  const imgAfter = document.getElementById('split-img-after');
  const splitLayer = document.getElementById('split-before-layer');
  const handle = document.getElementById('split-handle');

  if (imgBefore) imgBefore.src = beforeUrl;
  if (imgAfter) imgAfter.src = afterDataUrl;

  if (splitLayer) splitLayer.style.width = '50%';
  if (handle) handle.style.left = '50%';

  applyBackgroundToViewer();
}

function applyBackgroundToViewer() {
  const container = document.getElementById('split-viewer-container');
  if (!container) return;

  if (selectedBgColor === 'transparent') {
    container.classList.add('checkerboard-bg');
    container.style.backgroundColor = '';
  } else {
    container.classList.remove('checkerboard-bg');
    container.style.backgroundColor = selectedBgColor;
  }
}

function initSplitSlider() {
  const container = document.getElementById('split-viewer-container');
  const beforeLayer = document.getElementById('split-before-layer');
  const handle = document.getElementById('split-handle');

  let isDragging = false;

  const onMove = (clientX) => {
    if (!isDragging || !container) return;
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));

    const percentage = (x / rect.width) * 100;
    if (beforeLayer) beforeLayer.style.width = `${percentage}%`;
    if (handle) handle.style.left = `${percentage}%`;

    // Sincroniza largura da imagem interna para que não distorça
    const imgBefore = document.getElementById('split-img-before');
    if (imgBefore) {
      imgBefore.style.width = `${rect.width}px`;
      imgBefore.style.maxWidth = `${rect.width}px`;
    }
  };

  container?.addEventListener('mousedown', (e) => {
    isDragging = true;
    onMove(e.clientX);
  });

  window.addEventListener('mousemove', (e) => onMove(e.clientX));
  window.addEventListener('mouseup', () => (isDragging = false));

  // Touch Support
  container?.addEventListener('touchstart', (e) => {
    isDragging = true;
    onMove(e.touches[0].clientX);
  });
  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches[0]) onMove(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => (isDragging = false));
}

function downloadResultImage() {
  if (!currentOutputDataUrl) return;
  const a = document.createElement('a');
  a.href = currentOutputDataUrl;
  a.download = `imagem_sem_fundo_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('Download do PNG iniciado!', 'success');
}
