// Media Studio Suite - Central App Orchestrator

import { initTabs, initModal, showToast } from './ui.js';
import { initExtractor } from './extractor.js';
import { initBgRemover } from './bgRemover.js';
import { initScanner } from './scanner.js';
import { initStudioThree } from './studioThree.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌱 [Media Studio Suite] Inicializando módulos com 3D Nature Ambient & Procedural Icons...');

  try {
    initTabs();
    initModal();
    initExtractor();
    initBgRemover();
    initScanner();
    
    // Inicializa motor 3D procedural (Three.js img2threejs)
    initStudioThree();
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    showToast('Media Studio Suite pronto para uso!', 'info');
  } catch (err) {
    console.error('Erro ao inicializar aplicativo:', err);
  }
});
