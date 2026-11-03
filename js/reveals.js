import { animate } from './vendor/motion-mini/animate.js';

const compact = window.matchMedia('(max-width: 1180px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const running = new Map();
let observer;

function show(element) {
  observer?.unobserve(element);
  element.classList.remove('motion-pending');
  running.get(element)?.cancel();
  running.delete(element);
}

function showSection(section) {
  section.querySelectorAll('.animate-box').forEach(show);
}

document.addEventListener('portfolio:reveal', event => showSection(event.detail.section));

function respectPreferences() {
  if (compact.matches || reducedMotion.matches) {
    observer?.disconnect();
    document.querySelectorAll('.animate-box').forEach(show);
  }
}

function startReveals() {
  if (compact.matches || reducedMotion.matches || !window.IntersectionObserver || !Element.prototype.animate) return;

  observer = new IntersectionObserver(entries => {
    let revealIndex = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      observer.unobserve(element);
      if (element.closest('.section-open-immediately') || compact.matches || reducedMotion.matches) {
        show(element);
        return;
      }

      // Stagger each visible batch gently, with a cap for long skills lists.
      const effect = element.dataset.animateEffect;
      let offset = 'translateY(12px)';
      if (effect === 'fadeInLeft') offset = 'translateX(-12px)';
      if (effect === 'fadeInRight') offset = 'translateX(12px)';
      if (effect === 'fadeInTop') offset = 'translateY(-12px)';
      if (effect === 'fadeIn') offset = 'none';

      try {
        const animation = animate(element, {
          opacity: [0, 1],
          transform: [offset, 'none']
        }, { duration: 0.6, delay: Math.min(revealIndex++ * 0.08, 0.24), ease: [0.25, 0.1, 0.25, 1] });
        running.set(element, animation);
        animation.then(() => {
          if (running.get(element) === animation) show(element);
        });
      } catch {
        show(element);
      }
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });

  document.querySelectorAll('.animate-box').forEach(element => {
    // Nested headings move with their parent; visible content never flashes away.
    if (element.parentElement.closest('.animate-box') ||
        element.closest('.section-open-immediately') ||
        element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add('motion-pending');
    observer.observe(element);
  });
}

compact.addEventListener('change', respectPreferences);
reducedMotion.addEventListener('change', respectPreferences);
startReveals();
