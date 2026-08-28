// FramerTool - Landing Page Orchestrator

import { HeroScrollTelling } from './heroScroll.js';
import { LogoThreeScene } from './logoThree.js';
import { init3DTiltCards } from './card3d.js';
import { initPipeline3DModels } from './cardModelsThree.js';
import { initFluidEngine } from './fluidContainer.js';
import { NatureScrollTelling } from './natureScroll.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌊 [FramerTool Landing Page] Initializing 3D Fluid, Models & Dual Scrolltelling (Hero + Nature)...');

  // 1. Initialize Hero 240-frame scroll engine
  const heroScroll = new HeroScrollTelling();

  // 2. Initialize 3D Three.js Logo in the floating navbar
  const logo3D = new LogoThreeScene();

  // 3. Initialize Interactive 3D Aquatic Fluid Container & Droplets
  const fluidEngine = initFluidEngine();

  // 4. Initialize Interactive 3D Pipeline Models (Clapper, Scissors, Paper, Dice) + Top Paperclip Pins
  initPipeline3DModels();

  // 5. Initialize Interactive 3D Tilt Cards
  init3DTiltCards();

  // 6. Initialize Nature Ambient Scrolltelling (frames2) with floating modules, mascot & grounded footer
  const natureScroll = new NatureScrollTelling();

  // 7. Navbar scroll effect
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

  // 8. Smooth scroll on SCROLL indicator click
  document.getElementById('hero-scroll-indicator')?.addEventListener('click', () => {
    window.scrollTo({
      top: window.innerHeight * 1.2,
      behavior: 'smooth',
    });
  });

  // 9. Mobile Drawer Toggle
  const mobileMenuBtn = document.getElementById('lp-mobile-menu-btn');
  const mobileCloseBtn = document.getElementById('lp-mobile-close-btn');
  const mobileDrawer = document.getElementById('lp-mobile-drawer');
  const mobileOverlay = document.getElementById('lp-mobile-overlay');
  const drawerLinks = document.querySelectorAll('.lp-drawer-link');

  const openDrawer = () => {
    if (!mobileDrawer || !mobileOverlay) return;
    mobileOverlay.classList.remove('opacity-0', 'pointer-events-none');
    mobileOverlay.classList.add('opacity-100', 'pointer-events-auto');
    mobileDrawer.classList.remove('translate-x-full');
    mobileDrawer.classList.add('translate-x-0');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    if (!mobileDrawer || !mobileOverlay) return;
    mobileOverlay.classList.add('opacity-0', 'pointer-events-none');
    mobileOverlay.classList.remove('opacity-100', 'pointer-events-auto');
    mobileDrawer.classList.add('translate-x-full');
    mobileDrawer.classList.remove('translate-x-0');
    document.body.style.overflow = '';
  };

  mobileMenuBtn?.addEventListener('click', openDrawer);
  mobileCloseBtn?.addEventListener('click', closeDrawer);
  mobileOverlay?.addEventListener('click', closeDrawer);
  drawerLinks.forEach((link) => link.addEventListener('click', closeDrawer));
});
