// FramerTool - Interactive 3D Tilt & Lighting Effect for Cards (img2threejs / 3D tactile feel)

export function init3DTiltCards() {
  const cards = document.querySelectorAll('.card-3d-tilt');

  cards.forEach((card) => {
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Ângulo de inclinação (máximo 12 graus)
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;

      // Atualiza o brilho de reflexo dinâmico
      const shine = card.querySelector('.card-shine');
      if (shine) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      const shine = card.querySelector('.card-shine');
      if (shine) {
        shine.style.background = 'transparent';
      }
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
}
