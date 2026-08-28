// Media Studio Suite - UI Utilities & Toast Notifications

export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 ${
    type === 'success'
      ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/50'
      : type === 'error'
      ? 'bg-red-950/90 border-red-500/30 text-red-200 shadow-red-950/50'
      : 'bg-surface-card/90 border-brand-500/30 text-slate-200 shadow-black/50'
  }`;

  const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'info';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
    <span class="flex-1">${message}</span>
    <button class="text-slate-400 hover:text-white" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) {
    window.lucide.createIcons({ root: toast });
  }

  // Animação de entrada
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Troca de Abas
export function switchTab(tabId) {
  const tabs = ['extractor', 'bg', 'scanner'];
  tabs.forEach((t) => {
    const section = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tabId) {
      section?.classList.remove('hidden');
      section?.classList.add('block');
      btn?.classList.add('active', 'text-white', 'bg-brand-600', 'shadow-md', 'shadow-brand-600/30');
      btn?.classList.remove('text-slate-400');
    } else {
      section?.classList.add('hidden');
      section?.classList.remove('block');
      btn?.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow-md', 'shadow-brand-600/30');
      btn?.classList.add('text-slate-400');
    }
  });
  window.currentTab = tabId;
}

export function initTabs() {
  document.getElementById('tab-btn-extractor')?.addEventListener('click', () => switchTab('extractor'));
  document.getElementById('tab-btn-bg')?.addEventListener('click', () => switchTab('bg'));
  document.getElementById('tab-btn-scanner')?.addEventListener('click', () => switchTab('scanner'));
}

window.switchTab = switchTab;

// Modal de Imagem Fullscreen
export function openImageModal(src) {
  const modal = document.getElementById('image-modal');
  const img = document.getElementById('modal-img');
  if (modal && img) {
    img.src = src;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

export function closeImageModal() {
  const modal = document.getElementById('image-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function initModal() {
  document.getElementById('btn-close-modal')?.addEventListener('click', closeImageModal);
  const modal = document.getElementById('image-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeImageModal();
  });
}

window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
