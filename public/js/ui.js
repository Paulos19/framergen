// Media Studio Suite - UI Utilities, Toast Notifications & Responsive Drawer

export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold backdrop-blur-xl transition-all duration-300 transform translate-y-2 opacity-0 ${
    type === 'success'
      ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-900/10'
      : type === 'error'
      ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-900/10'
      : 'bg-white/95 border-slate-200/80 text-slate-900 shadow-slate-900/10'
  }`;

  const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'info';
  const iconColor = type === 'success' ? 'text-emerald-600' : type === 'error' ? 'text-rose-600' : 'text-blue-600';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0 ${iconColor}"></i>
    <span class="flex-1">${message}</span>
    <button class="text-slate-400 hover:text-slate-700" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) {
    window.lucide.createIcons({ root: toast });
  }

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Active styling classes per tab
const TAB_ACTIVE_CLASSES = {
  extractor: ['bg-gradient-to-r', 'from-amber-500', 'via-orange-500', 'to-rose-500', 'text-white', 'shadow-lg', 'shadow-orange-500/30'],
  bg: ['bg-gradient-to-r', 'from-purple-600', 'via-fuchsia-600', 'to-rose-600', 'text-white', 'shadow-lg', 'shadow-purple-600/30'],
  scanner: ['bg-gradient-to-r', 'from-emerald-600', 'via-teal-600', 'to-lime-600', 'text-white', 'shadow-lg', 'shadow-emerald-600/30'],
};

const ALL_ACTIVE_CLASSES = [
  'bg-gradient-to-r', 'from-amber-500', 'via-orange-500', 'to-rose-500',
  'from-purple-600', 'via-fuchsia-600',
  'from-emerald-600', 'via-teal-600', 'to-lime-600',
  'text-white', 'shadow-lg', 'shadow-orange-500/30', 'shadow-purple-600/30', 'shadow-emerald-600/30'
];

// Fluid Tab Switching (Both Desktop Bar & Mobile Drawer)
export function switchTab(tabId) {
  const tabs = ['extractor', 'bg', 'scanner'];
  
  tabs.forEach((t) => {
    const section = document.getElementById(`tab-${t}`);
    const desktopBtn = document.getElementById(`tab-btn-${t}`);
    const mobileBtn = document.getElementById(`mobile-tab-btn-${t}`);

    if (t === tabId) {
      section?.classList.remove('hidden');
      section?.classList.add('block');

      // Desktop button active style
      if (desktopBtn) {
        desktopBtn.classList.remove(...ALL_ACTIVE_CLASSES, 'text-slate-700', 'bg-transparent', 'hover:bg-slate-100');
        desktopBtn.classList.add('active', ...TAB_ACTIVE_CLASSES[t]);
      }

      // Mobile button active style
      if (mobileBtn) {
        mobileBtn.classList.remove(...ALL_ACTIVE_CLASSES, 'text-slate-700', 'bg-slate-100');
        mobileBtn.classList.add('active', ...TAB_ACTIVE_CLASSES[t]);
      }
    } else {
      section?.classList.add('hidden');
      section?.classList.remove('block');

      // Desktop button inactive style
      if (desktopBtn) {
        desktopBtn.classList.remove('active', ...ALL_ACTIVE_CLASSES);
        desktopBtn.classList.add('text-slate-700', 'bg-transparent');
      }

      // Mobile button inactive style
      if (mobileBtn) {
        mobileBtn.classList.remove('active', ...ALL_ACTIVE_CLASSES);
        mobileBtn.classList.add('text-slate-700', 'bg-slate-100/80');
      }
    }
  });

  window.currentTab = tabId;
  closeStudioDrawer();
}

export function openStudioDrawer() {
  const drawer = document.getElementById('studio-mobile-drawer');
  const overlay = document.getElementById('studio-mobile-overlay');
  if (!drawer || !overlay) return;

  overlay.classList.remove('opacity-0', 'pointer-events-none');
  overlay.classList.add('opacity-100', 'pointer-events-auto');
  drawer.classList.remove('translate-x-full');
  drawer.classList.add('translate-x-0');
  document.body.style.overflow = 'hidden';
}

export function closeStudioDrawer() {
  const drawer = document.getElementById('studio-mobile-drawer');
  const overlay = document.getElementById('studio-mobile-overlay');
  if (!drawer || !overlay) return;

  overlay.classList.add('opacity-0', 'pointer-events-none');
  overlay.classList.remove('opacity-100', 'pointer-events-auto');
  drawer.classList.add('translate-x-full');
  drawer.classList.remove('translate-x-0');
  document.body.style.overflow = '';
}

export function initTabs() {
  // Desktop Tab Buttons
  document.getElementById('tab-btn-extractor')?.addEventListener('click', () => switchTab('extractor'));
  document.getElementById('tab-btn-bg')?.addEventListener('click', () => switchTab('bg'));
  document.getElementById('tab-btn-scanner')?.addEventListener('click', () => switchTab('scanner'));

  // Mobile Drawer Tab Buttons
  document.getElementById('mobile-tab-btn-extractor')?.addEventListener('click', () => switchTab('extractor'));
  document.getElementById('mobile-tab-btn-bg')?.addEventListener('click', () => switchTab('bg'));
  document.getElementById('mobile-tab-btn-scanner')?.addEventListener('click', () => switchTab('scanner'));

  // Mobile Drawer Open / Close
  document.getElementById('studio-mobile-menu-btn')?.addEventListener('click', openStudioDrawer);
  document.getElementById('studio-mobile-close-btn')?.addEventListener('click', closeStudioDrawer);
  document.getElementById('studio-mobile-overlay')?.addEventListener('click', closeStudioDrawer);
}

window.switchTab = switchTab;
window.openStudioDrawer = openStudioDrawer;
window.closeStudioDrawer = closeStudioDrawer;

// Fullscreen Image Lightbox
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
