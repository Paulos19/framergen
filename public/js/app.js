// Media Studio Suite - Central App Orchestrator

import { initTabs, initModal, showToast } from './ui.js';
import { initExtractor } from './extractor.js';
import { initBgRemover } from './bgRemover.js';
import { initScanner } from './scanner.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('✨ [Media Studio Suite] Inicializando módulos...');

  try {
    initTabs();
    initModal();
    initExtractor();
    initBgRemover();
    initScanner();
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    showToast('Media Studio Suite pronto para uso!', 'info');
  } catch (err) {
    console.error('Erro ao inicializar aplicativo:', err);
  }
});
