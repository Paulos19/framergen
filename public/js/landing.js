// FramerTool - Landing Page Orchestrator

import { HeroScrollTelling } from './heroScroll.js';
import { LogoThreeScene } from './logoThree.js';
import { init3DTiltCards } from './card3d.js';
import { initPipeline3DModels } from './cardModelsThree.js';
import { initFluidEngine } from './fluidContainer.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌊 [FramerTool Landing Page] Initializing 3D Fluid Container, Droplets, Pins & Models...');

  // 1. Initialize 240-frame scroll engine
  const scrollEngine = new HeroScrollTelling();

  // 2. Initialize 3D Three.js Logo in the floating navbar
  const logo3D = new LogoThreeScene();

  // 3. Initialize Interactive 3D Aquatic Fluid Container & Droplets
  const fluidEngine = initFluidEngine();

  // 4. Initialize Interactive 3D Pipeline Models (Clapper, Scissors, Paper, Dice) + Top Paperclip Pins
  initPipeline3DModels();

  // 5. Initialize Interactive 3D Tilt Cards
  init3DTiltCards();

  // 6. Navbar scroll effect
  const navbar = document.getElementById('floating-navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('bg-white/85', 'shadow-2xl', 'backdrop-blur-xl', 'border-white/60');
      navbar.classList.remove('bg-white/95');
    } else {
      navbar.classList.remove('bg-white/85', 'shadow-2xl');
      navbar.classList.add('bg-white/95');
    }
  }, { passive: true });

  // 7. Smooth scroll on SCROLL indicator click
  document.getElementById('hero-scroll-indicator')?.addEventListener('click', () => {
    window.scrollTo({
      top: window.innerHeight * 1.2,
      behavior: 'smooth',
    });
  });
});
