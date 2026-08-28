// Media Studio Suite - Extrator de Frames 24fps & Player Interativo

import { showToast, openImageModal, switchTab } from './ui.js';
import { loadFrameInBgRemover } from './bgRemover.js';
import { addPagesToScanner } from './scanner.js';

let selectedVideoFile = null;
let currentJobId = null;
let currentFormat = 'png';
let currentFps = 24;
let extractedFrames = [];
let selectedFrameIndices = new Set();

// Player State
let playerIndex = 0;
let isPlaying = false;
let playInterval = null;
let playerSpeed = 1.0;

export function initExtractor() {
  const dropzone = document.getElementById('video-dropzone');
  const fileInput = document.getElementById('video-file-input');
  const fpsSlider = document.getElementById('fps-slider');
  const fpsLabel = document.getElementById('fps-label');
  const startBtn = document.getElementById('btn-start-extract');
  const testBtn = document.getElementById('btn-generate-test-video');
  const preset8sBtn = document.getElementById('preset-8s-btn');
  const formatBtns = document.querySelectorAll('.format-btn');

  // Drag & Drop
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-brand-500', 'bg-brand-500/5');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-brand-500', 'bg-brand-500/5');
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-brand-500', 'bg-brand-500/5');
    if (e.dataTransfer.files?.length) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleVideoSelect(e.target.files[0]);
    }
  });

  // FPS Slider
  fpsSlider?.addEventListener('input', (e) => {
    currentFps = parseInt(e.target.value, 10);
    fpsLabel.textContent = `${currentFps} FPS ${currentFps === 24 ? '(Padrão 8s)' : ''}`;
  });

  // Formato de Saída
  formatBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      formatBtns.forEach((b) => b.classList.remove('active', 'bg-brand-600', 'text-white', 'border-brand-500'));
      formatBtns.forEach((b) => b.classList.add('bg-surface-card', 'text-slate-400', 'border-surface-border'));
      btn.classList.add('active', 'bg-brand-600', 'text-white', 'border-brand-500');
      btn.classList.remove('bg-surface-card', 'text-slate-400', 'border-surface-border');
      currentFormat = btn.dataset.format;
    });
  });

  // Preset 8s
  preset8sBtn?.addEventListener('click', () => {
    fpsSlider.value = '24';
    currentFps = 24;
    fpsLabel.textContent = '24 FPS (Padrão 8s)';
    document.querySelector('[data-format="png"]')?.click();
    showToast('Preset de 8 segundos ativado: 24 FPS / PNG', 'info');
  });

  // Gerar Vídeo de Teste 8s
  testBtn?.addEventListener('click', async () => {
    try {
      testBtn.disabled = true;
      testBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Gerando Vídeo...</span>`;
      lucide.createIcons({ root: testBtn });

      const res = await fetch('/api/extract/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fps: currentFps, format: currentFormat, duration: 8 }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      currentJobId = data.jobId;
      showToast('Vídeo sintético de 8s gerado! Extraindo 192 frames...', 'success');
      startProgressPolling(data.jobId);
    } catch (err) {
      showToast(`Erro ao testar vídeo: ${err.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.innerHTML = `<i data-lucide="play-circle" class="w-4 h-4"></i><span>Testar com Vídeo 8s (192 frames)</span>`;
      lucide.createIcons({ root: testBtn });
    }
  });

  // Iniciar Extração
  startBtn?.addEventListener('click', async () => {
    if (!selectedVideoFile) return;

    const formData = new FormData();
    formData.append('video', selectedVideoFile);
    formData.append('fps', currentFps);
    formData.append('format', currentFormat);

    try {
      startBtn.disabled = true;
      startBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Enviando...</span>`;
      lucide.createIcons({ root: startBtn });

      const res = await fetch('/api/extract/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      currentJobId = data.jobId;
      showToast('Upload concluído! Extraindo frames a 24 FPS...', 'success');
      startProgressPolling(data.jobId);
    } catch (err) {
      showToast(`Erro no upload: ${err.message}`, 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = `<i data-lucide="scissors" class="w-4 h-4"></i><span>Iniciar Extração</span>`;
      lucide.createIcons({ root: startBtn });
    }
  });

  // Player Controls
  initPlayer();

  // Ações em Lote dos Frames
  document.getElementById('btn-select-all')?.addEventListener('click', selectAllFrames);
  document.getElementById('btn-deselect-all')?.addEventListener('click', deselectAllFrames);
  document.getElementById('btn-download-all-zip')?.addEventListener('click', downloadAllZip);
  document.getElementById('btn-download-selected-zip')?.addEventListener('click', downloadSelectedZip);
  document.getElementById('btn-send-selected-to-scanner')?.addEventListener('click', sendSelectedToScanner);
}

function handleVideoSelect(file) {
  if (!file.type.startsWith('video/')) {
    showToast('Por favor, selecione um arquivo de vídeo válido.', 'error');
    return;
  }
  selectedVideoFile = file;
  const startBtn = document.getElementById('btn-start-extract');
  if (startBtn) startBtn.disabled = false;

  const dropzone = document.getElementById('video-dropzone');
  if (dropzone) {
    dropzone.innerHTML = `
      <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
        <i data-lucide="check" class="w-8 h-8"></i>
      </div>
      <h3 class="text-base font-semibold text-white mb-1">${file.name}</h3>
      <p class="text-xs text-slate-400 font-mono mb-2">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
      <span class="text-xs text-brand-400 hover:underline cursor-pointer">Trocar de vídeo</span>
    `;
    lucide.createIcons({ root: dropzone });
  }

  showToast(`Vídeo selecionado: ${file.name}`, 'info');
}

// Polling de Progresso da Extração
function startProgressPolling(jobId) {
  const progressCard = document.getElementById('extract-progress-card');
  const resultsSection = document.getElementById('extract-results-section');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const progressSpeed = document.getElementById('progress-speed');
  const progressFrames = document.getElementById('progress-frame-count');
  const progressElapsed = document.getElementById('progress-elapsed');

  progressCard?.classList.remove('hidden');
  resultsSection?.classList.add('hidden');

  const startTime = Date.now();

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/extract/status/${jobId}`);
      if (!res.ok) throw new Error('Falha ao consultar status');

      const data = await res.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      progressBar.style.width = `${data.progress}%`;
      progressPercent.textContent = `${data.progress}%`;
      progressSpeed.textContent = `${data.fpsSpeed || '--'} fps`;
      progressFrames.textContent = `Frames gerados: ${data.currentFrame || data.totalFrames} / ~${data.totalExpected}`;
      progressElapsed.textContent = `Tempo: ${elapsed}s`;

      if (data.status === 'completed') {
        clearInterval(interval);
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';

        showToast(`Extração concluída! ${data.totalFrames} frames gerados em ${data.durationSeconds}s.`, 'success');

        extractedFrames = data.files.map((filename) => ({
          filename,
          url: `/api/extract/frame/${jobId}/${filename}`,
          jobId,
        }));

        setTimeout(() => {
          progressCard?.classList.add('hidden');
          resultsSection?.classList.remove('hidden');
          setupPlayerWithFrames(extractedFrames);
          renderGallery(extractedFrames);
        }, 600);
      } else if (data.status === 'failed') {
        clearInterval(interval);
        showToast(`Erro na extração: ${data.error}`, 'error');
        progressCard?.classList.add('hidden');
      }
    } catch (e) {
      console.error(e);
    }
  }, 400);
}

// Configuração do Player Interativo
function initPlayer() {
  const scrubber = document.getElementById('player-scrubber');
  const toggleBtn = document.getElementById('btn-player-toggle');
  const prevBtn = document.getElementById('btn-player-prev');
  const nextBtn = document.getElementById('btn-player-next');
  const speedBtns = document.querySelectorAll('.speed-btn');

  const sendBgBtn = document.getElementById('btn-send-current-frame-bg');
  const sendScannerBtn = document.getElementById('btn-send-current-frame-scanner');

  scrubber?.addEventListener('input', (e) => {
    pausePlayer();
    playerIndex = parseInt(e.target.value, 10);
    updatePlayerView();
  });

  toggleBtn?.addEventListener('click', togglePlayer);
  prevBtn?.addEventListener('click', () => {
    pausePlayer();
    playerIndex = (playerIndex - 1 + extractedFrames.length) % extractedFrames.length;
    updatePlayerView();
  });
  nextBtn?.addEventListener('click', () => {
    pausePlayer();
    playerIndex = (playerIndex + 1) % extractedFrames.length;
    updatePlayerView();
  });

  speedBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedBtns.forEach((b) => b.classList.remove('active', 'bg-brand-600', 'text-white'));
      speedBtns.forEach((b) => b.classList.add('bg-slate-800', 'text-slate-300'));
      btn.classList.add('active', 'bg-brand-600', 'text-white');
      btn.classList.remove('bg-slate-800', 'text-slate-300');
      playerSpeed = parseFloat(btn.dataset.speed) || 1.0;
      if (isPlaying) {
        pausePlayer();
        startPlayer();
      }
    });
  });

  // Ações do Frame Atual
  sendBgBtn?.addEventListener('click', () => {
    if (!extractedFrames.length) return;
    const current = extractedFrames[playerIndex];
    loadFrameInBgRemover(current.jobId, current.filename, current.url);
    switchTab('bg');
    showToast(`Frame ${current.filename} enviado para o Removedor de Fundo!`, 'info');
  });

  sendScannerBtn?.addEventListener('click', () => {
    if (!extractedFrames.length) return;
    const current = extractedFrames[playerIndex];
    addPagesToScanner([{ url: current.url, jobId: current.jobId, frameName: current.filename, name: current.filename }]);
    switchTab('scanner');
    showToast(`Frame ${current.filename} adicionado ao Scanner PDF!`, 'success');
  });
}

function setupPlayerWithFrames(frames) {
  if (!frames.length) return;
  playerIndex = 0;
  const scrubber = document.getElementById('player-scrubber');
  if (scrubber) {
    scrubber.max = String(frames.length - 1);
    scrubber.value = '0';
  }
  updatePlayerView();
}

function updatePlayerView() {
  if (!extractedFrames.length) return;
  const frame = extractedFrames[playerIndex];
  const img = document.getElementById('player-frame-img');
  const indicator = document.getElementById('player-frame-indicator');
  const scrubber = document.getElementById('player-scrubber');

  if (img) img.src = frame.url;
  if (indicator) {
    const padIndex = String(playerIndex + 1).padStart(3, '0');
    const padTotal = String(extractedFrames.length).padStart(3, '0');
    indicator.textContent = `Frame: ${padIndex} / ${padTotal} (${frame.filename})`;
  }
  if (scrubber) scrubber.value = String(playerIndex);
}

function togglePlayer() {
  if (isPlaying) pausePlayer();
  else startPlayer();
}

function startPlayer() {
  if (!extractedFrames.length) return;
  isPlaying = true;
  const playText = document.getElementById('player-play-text');
  const playIcon = document.getElementById('player-play-icon');

  if (playText) playText.textContent = 'Pausar Animação';
  if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
  lucide.createIcons();

  const frameIntervalMs = (1000 / 24) / playerSpeed;

  playInterval = setInterval(() => {
    playerIndex = (playerIndex + 1) % extractedFrames.length;
    updatePlayerView();
  }, frameIntervalMs);
}

function pausePlayer() {
  isPlaying = false;
  clearInterval(playInterval);
  const playText = document.getElementById('player-play-text');
  const playIcon = document.getElementById('player-play-icon');

  if (playText) playText.textContent = 'Reproduzir Animação';
  if (playIcon) playIcon.setAttribute('data-lucide', 'play');
  lucide.createIcons();
}

// Galeria de Miniaturas
function renderGallery(frames) {
  const grid = document.getElementById('frames-grid');
  const countBadge = document.getElementById('gallery-count-badge');
  if (countBadge) countBadge.textContent = `${frames.length} frames`;
  if (!grid) return;

  grid.innerHTML = '';
  selectedFrameIndices.clear();
  updateSelectionSummary();

  frames.forEach((frame, index) => {
    const card = document.createElement('div');
    card.className = 'group relative rounded-xl overflow-hidden glass-card border border-surface-border hover:border-brand-500 transition-all aspect-video flex items-center justify-center bg-black/40';

    card.innerHTML = `
      <img src="${frame.url}" alt="${frame.filename}" loading="lazy" class="w-full h-full object-cover" />
      
      <!-- Checkbox de Seleção -->
      <label class="absolute top-1.5 left-1.5 z-10 cursor-pointer">
        <input type="checkbox" data-index="${index}" class="frame-checkbox w-4 h-4 accent-brand-500 rounded bg-slate-900/80 border-slate-700" />
      </label>

      <!-- Badge do Número do Frame -->
      <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-300">
        #${String(index + 1).padStart(3, '0')}
      </span>

      <!-- Ações Rápidas no Hover -->
      <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
        <button data-action="view" data-index="${index}" class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white" title="Ver Ampliado">
          <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
        </button>
        <button data-action="bg" data-index="${index}" class="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white" title="Remover Fundo">
          <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
        </button>
        <button data-action="scanner" data-index="${index}" class="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white" title="Adicionar ao PDF">
          <i data-lucide="file-plus" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    grid.appendChild(card);
  });

  lucide.createIcons({ root: grid });

  // Event Listeners dos Cards
  grid.querySelectorAll('.frame-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (e.target.checked) selectedFrameIndices.add(idx);
      else selectedFrameIndices.delete(idx);
      updateSelectionSummary();
    });
  });

  grid.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const idx = parseInt(btn.dataset.index, 10);
      const frame = extractedFrames[idx];

      if (action === 'view') {
        openImageModal(frame.url);
      } else if (action === 'bg') {
        loadFrameInBgRemover(frame.jobId, frame.filename, frame.url);
        switchTab('bg');
        showToast(`Frame #${idx + 1} enviado para o Removedor de Fundo!`, 'info');
      } else if (action === 'scanner') {
        addPagesToScanner([{ url: frame.url, jobId: frame.jobId, frameName: frame.filename, name: frame.filename }]);
        switchTab('scanner');
        showToast(`Frame #${idx + 1} adicionado ao Scanner PDF!`, 'success');
      }
    });
  });
}

function selectAllFrames() {
  document.querySelectorAll('.frame-checkbox').forEach((cb) => (cb.checked = true));
  selectedFrameIndices = new Set(extractedFrames.map((_, i) => i));
  updateSelectionSummary();
}

function deselectAllFrames() {
  document.querySelectorAll('.frame-checkbox').forEach((cb) => (cb.checked = false));
  selectedFrameIndices.clear();
  updateSelectionSummary();
}

function updateSelectionSummary() {
  const summary = document.getElementById('selection-summary');
  if (summary) {
    summary.textContent = `${selectedFrameIndices.size} de ${extractedFrames.length} selecionados`;
  }
}

function downloadAllZip() {
  if (!currentJobId) return;
  showToast('Iniciando download do pacote .ZIP com todos os frames...', 'info');
  window.location.href = `/api/download/zip/${currentJobId}`;
}

async function downloadSelectedZip() {
  if (!currentJobId || selectedFrameIndices.size === 0) {
    showToast('Nenhum frame selecionado para download.', 'error');
    return;
  }

  const selectedNames = Array.from(selectedFrameIndices).map((i) => extractedFrames[i].filename);

  try {
    showToast('Compactando frames selecionados...', 'info');
    const res = await fetch('/api/download/zip-selected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: currentJobId, frames: selectedNames }),
    });

    if (!res.ok) throw new Error('Falha ao gerar ZIP');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frames_selecionados_${selectedNames.length}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Download concluído!', 'success');
  } catch (err) {
    showToast(`Erro ao baixar selecionados: ${err.message}`, 'error');
  }
}

function sendSelectedToScanner() {
  if (selectedFrameIndices.size === 0) {
    showToast('Selecione ao menos 1 frame para enviar ao Scanner PDF.', 'error');
    return;
  }

  const items = Array.from(selectedFrameIndices).map((i) => ({
    url: extractedFrames[i].url,
    jobId: extractedFrames[i].jobId,
    frameName: extractedFrames[i].filename,
    name: extractedFrames[i].filename,
  }));

  addPagesToScanner(items);
  switchTab('scanner');
  showToast(`${items.length} frames adicionados ao Scanner PDF!`, 'success');
}
