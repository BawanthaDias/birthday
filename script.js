/* =====================================================================
   PIHU'S 26th BIRTHDAY SURPRISE — SCRIPT
   Sections: config → helpers → background fx → scene manager →
             per-scene animations → gallery → interactions → music
===================================================================== */

/* ---------------------------------------------------------------
   0. CONFIGURATION — change name, age, signature, music, photos here
------------------------------------------------------------------ */
const birthdayConfig = {
  name: "Pihu",
  age: 26,
  signature: "Someone who thinks you're incredibly special",
  music: "assets/music.mp3",
  photos: [
    { src: "assets/photo1.jpg", caption: "That beautiful smile ❤️" },
    { src: "assets/photo2.jpg", caption: "Little moments, big memories ✨" },
    { src: "assets/photo3.jpg", caption: "Always glowing 🌸" },
    { src: "assets/photo4.jpg", caption: "One of my favorite memories 💕" },
    { src: "assets/photo5.jpg", caption: "Simply Pihu ✨" }
  ]
};

/* Placeholder gradients used only while assets/photoN.jpg do not exist.
   Once you add real photos, the code below automatically prefers them
   (see buildGallery) and these gradients are simply never shown. */
const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#ff8fb3,#c9a9ff)",
  "linear-gradient(135deg,#ffd782,#ff6fa0)",
  "linear-gradient(135deg,#c9a9ff,#7a5cff)",
  "linear-gradient(135deg,#ff6fa0,#ffb0c4)",
  "linear-gradient(135deg,#ffb46b,#ff6fa0)"
];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 700px)').matches;

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ---------------------------------------------------------------
   1. SMALL HELPERS
------------------------------------------------------------------ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const fxLayer = $('#fxLayer');

function spawnParticle(className, styles = {}, life = 3000) {
  const el = document.createElement('span');
  el.className = className;
  Object.assign(el.style, styles);
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), life);
}

function randomBetween(min, max) { return Math.random() * (max - min) + min; }

/* Gentle ambient hearts + petals drifting in the background.
   Frequency is reduced on mobile and disabled under reduced motion. */
function startAmbientParticles() {
  if (prefersReducedMotion) return;
  const intervalMs = isMobile ? 2200 : 1100;
  setInterval(() => {
    const left = randomBetween(0, 100);
    const drift = randomBetween(-40, 40) + 'px';
    const duration = randomBetween(9, 16);
    if (Math.random() > 0.5) {
      spawnParticle('fx-heart', {
        left: left + 'vw',
        bottom: '-5vh',
        '--drift': drift,
        animationDuration: duration + 's',
        fontSize: randomBetween(0.8, 1.4) + 'rem'
      }, duration * 1000 + 200);
      const heartEl = fxLayer.lastChild;
      heartEl.textContent = '❤';
    } else {
      spawnParticle('fx-petal', {
        left: left + 'vw',
        top: '-5vh',
        '--drift': drift,
        animationDuration: duration + 's',
        fontSize: randomBetween(0.7, 1.2) + 'rem'
      }, duration * 1000 + 200);
      const petalEl = fxLayer.lastChild;
      petalEl.textContent = '❀';
    }
  }, intervalMs);
}

/* Desktop-only cursor sparkle trail */
function startCursorTrail() {
  if (prefersReducedMotion || isMobile) return;
  let lastSpawn = 0;
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSpawn < 45) return;
    lastSpawn = now;
    spawnParticle('fx-trail', {
      left: e.clientX + 'px',
      top: e.clientY + 'px'
    }, 750);
  });
}

/* ---------------------------------------------------------------
   2. THREE.JS STARFIELD BACKGROUND
------------------------------------------------------------------ */
// Generates a soft circular glow sprite on a canvas so THREE.Points render
// as round glowing dots instead of the default flat squares.
function makeStarTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.25)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeStarLayer(count, options) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = randomBetween(-140, 140);
    positions[i * 3 + 1] = randomBetween(-90, 90);
    positions[i * 3 + 2] = randomBetween(-120, 20);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: options.color,
    size: options.size,
    map: options.texture,
    transparent: true,
    opacity: options.opacity,
    alphaTest: 0.01,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

function initStarfield() {
  const canvas = $('#bg-canvas');
  if (!window.THREE || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 60;

  const starTexture = makeStarTexture();
  const starCount = isMobile ? 500 : 1400;

  // Two layers give a subtle sense of depth: a dim lavender field and a
  // sparser, brighter gold layer that reads as "highlight" stars.
  const stars = makeStarLayer(starCount, { color: 0xd9c6ff, size: 2.2, opacity: 0.6, texture: starTexture });
  const highlightStars = makeStarLayer(Math.round(starCount * 0.15), { color: 0xffd782, size: 3, opacity: 0.85, texture: starTexture });

  scene.add(stars);
  scene.add(highlightStars);

  let mouseX = 0, mouseY = 0;
  if (!isMobile) {
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 4;
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    const spinY = prefersReducedMotion ? 0 : 0.0006;
    const spinX = prefersReducedMotion ? 0 : 0.0002;
    stars.rotation.y += spinY;
    stars.rotation.x += spinX;
    highlightStars.rotation.y += spinY * 0.7;
    highlightStars.rotation.x += spinX * 0.7;
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ---------------------------------------------------------------
   3. SCENE MANAGER
------------------------------------------------------------------ */
const scenes = $$('.scene');
let currentSceneIndex = 0;
const sceneAnimators = {}; // sceneNumber -> function to run once on entry
const playedScenes = new Set();

function buildProgressDots() {
  const dotsHost = $('#progressDots');
  scenes.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dotsHost.appendChild(dot);
  });
}

function updateProgressDots(index) {
  $$('.progress-dots .dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index);
    dot.classList.toggle('is-done', i < index);
  });
}

function goToScene(index) {
  if (index < 0 || index >= scenes.length) return;

  const current = scenes[currentSceneIndex];
  const next = scenes[index];

  const finishTransition = () => {
    current.classList.remove('active');
    next.classList.add('active');
    currentSceneIndex = index;
    updateProgressDots(index);
    next.scrollTop = 0;

    const sceneNumber = Number(next.dataset.scene);
    if (!playedScenes.has(sceneNumber) && sceneAnimators[sceneNumber]) {
      playedScenes.add(sceneNumber);
      sceneAnimators[sceneNumber]();
    }
  };

  if (window.gsap && !prefersReducedMotion) {
    gsap.to(current, {
      opacity: 0,
      scale: 0.97,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(current, { opacity: '', scale: '' });
        finishTransition();
        gsap.fromTo(next, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out' });
      }
    });
  } else {
    finishTransition();
  }
}

/* Wire up every [data-next] button to advance the story */
function bindNextButtons() {
  $$('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => goToScene(currentSceneIndex + 1));
  });
}

/* ---------------------------------------------------------------
   4. SCENE 1 — INTRO
------------------------------------------------------------------ */
function playIntroEntrance() {
  if (!window.gsap) return;
  gsap.to('.scene--intro .eyebrow', { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power2.out' });
  gsap.to('.scene--intro .intro-line', { opacity: 1, y: 0, duration: 0.9, delay: 0.45, ease: 'power2.out' });
  gsap.fromTo('.scene--intro .btn', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.9, ease: 'power2.out' });
}

function handleOpenSurprise() {
  const btn = $('#openSurpriseBtn');
  btn.addEventListener('click', () => {
    // hearts explode outward from the button
    const rect = btn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < (prefersReducedMotion ? 6 : 22); i++) {
      const angle = (i / 22) * Math.PI * 2;
      const distance = randomBetween(80, 220);
      const el = document.createElement('span');
      el.className = 'fx-heart';
      el.textContent = '❤';
      el.style.left = originX + 'px';
      el.style.top = originY + 'px';
      el.style.setProperty('--drift', Math.cos(angle) * distance + 'px');
      el.style.animation = 'none';
      fxLayer.appendChild(el);
      if (window.gsap) {
        gsap.to(el, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 60,
          opacity: 0,
          scale: 1.4,
          duration: 1.1,
          ease: 'power2.out',
          onComplete: () => el.remove()
        });
      } else {
        setTimeout(() => el.remove(), 1200);
      }
    }

    // subtle full-page zoom, then background shifts warmer
    if (window.gsap) {
      gsap.to('#storyRoot', {
        scale: 1.03,
        duration: 0.4,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
      });
    }
    document.body.style.transition = 'background 1.2s ease';
    document.documentElement.style.setProperty('--deep-purple', '#3a1650');

    // start music on first user interaction (autoplay-safe)
    startMusic();

    setTimeout(() => goToScene(1), 550);
  });
}

/* ---------------------------------------------------------------
   5. SCENE 2 — NAME REVEAL
------------------------------------------------------------------ */
function buildNameLetters() {
  const host = $('#nameReveal');
  host.innerHTML = '';
  birthdayConfig.name.split('').forEach((char) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = char;
    host.appendChild(span);
  });
  const heart = document.createElement('span');
  heart.className = 'letter';
  heart.textContent = ' ❤️';
  host.appendChild(heart);
}

function playNameReveal() {
  if (!window.gsap) return;
  const tl = gsap.timeline();
  tl.to('#line-wait', { opacity: 1, y: 0, duration: 0.6 })
    .to('#line-wait', { opacity: 0.5, duration: 0.4 }, '+=0.6')
    .to('#line-question', { opacity: 1, y: 0, duration: 0.7 }, '-=0.1')
    .to('.name-reveal .letter', {
      opacity: 1,
      y: 0,
      rotate: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'back.out(1.7)',
      onStart: () => burstSparklesAround('#nameReveal')
    }, '+=0.9')
    .to('#line-yes', { opacity: 1, y: 0, duration: 0.7 }, '+=0.3')
    .fromTo('.scene--name .scene-next', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '+=0.2');
}

function burstSparklesAround(selector) {
  if (prefersReducedMotion) return;
  const el = $(selector);
  const rect = el.getBoundingClientRect();
  for (let i = 0; i < 14; i++) {
    spawnParticle('fx-spark', {
      left: randomBetween(rect.left, rect.right) + 'px',
      top: randomBetween(rect.top, rect.bottom) + 'px'
    }, 900);
  }
}

/* ---------------------------------------------------------------
   6. SCENE 3 — AGE REVEAL
------------------------------------------------------------------ */
function playAgeReveal() {
  $('#ageNumber').textContent = birthdayConfig.age;
  if (!window.gsap) return;
  const tl = gsap.timeline();
  tl.to('.scene--age .lead-line:first-of-type', { opacity: 1, y: 0, duration: 0.7 })
    .to('#ageNumber', {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 1,
      ease: 'power3.out',
      onComplete: fireConfetti
    }, '+=0.3')
    .to('.lead-line--gold', { opacity: 1, y: 0, duration: 0.7 }, '-=0.2')
    .fromTo('.scene--age .scene-next', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '+=0.2');

  spawnBalloons();
}

function fireConfetti(intensity = 1) {
  if (!window.confetti) return;
  confetti({
    particleCount: prefersReducedMotion ? 30 : 120 * intensity,
    spread: 90,
    origin: { y: 0.5 },
    colors: ['#ff6fa0', '#ffd782', '#c9a9ff', '#ffffff']
  });
}

function spawnBalloons() {
  if (prefersReducedMotion) return;
  const colors = ['#ff6fa0', '#ffd782', '#c9a9ff', '#ffb0c4'];
  for (let i = 0; i < (isMobile ? 4 : 8); i++) {
    const b = document.createElement('div');
    b.style.position = 'absolute';
    b.style.bottom = '-20vh';
    b.style.left = randomBetween(4, 92) + 'vw';
    b.style.width = randomBetween(30, 46) + 'px';
    b.style.height = randomBetween(40, 60) + 'px';
    b.style.borderRadius = '50% 50% 48% 48%';
    b.style.background = colors[i % colors.length];
    b.style.opacity = '0.85';
    fxLayer.appendChild(b);
    if (window.gsap) {
      gsap.to(b, {
        y: -window.innerHeight * 1.3,
        x: randomBetween(-40, 40),
        rotate: randomBetween(-8, 8),
        duration: randomBetween(9, 14),
        ease: 'none',
        onComplete: () => b.remove()
      });
    } else {
      setTimeout(() => b.remove(), 12000);
    }
  }
}

/* ---------------------------------------------------------------
   7. SCENE 4 — BIRTHDAY MESSAGE (sequential reveal)
------------------------------------------------------------------ */
function playMessageReveal() {
  const lines = $$('#messageLines p');
  const nextBtn = $('#messageNextBtn');

  if (!window.gsap) {
    lines.forEach((l) => { l.style.opacity = 1; l.style.transform = 'none'; });
    nextBtn.disabled = false;
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => { nextBtn.disabled = false; }
  });
  lines.forEach((line, i) => {
    tl.to(line, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, i === 0 ? '+=0.2' : '+=0.7');
  });
}

/* ---------------------------------------------------------------
   8. SCENE 5 — PHOTO MEMORY GALLERY (Swiper)
------------------------------------------------------------------ */
function buildGallerySlides() {
  const wrapper = $('#memorySwiperWrapper');
  wrapper.innerHTML = '';
  birthdayConfig.photos.forEach((photo, i) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    const photoDiv = document.createElement('div');
    photoDiv.className = 'memory-photo';
    // Prefer a real photo if it loads; otherwise fall back to a gradient
    // placeholder so the page still looks intentional with no assets.
    photoDiv.style.backgroundImage = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];
    const testImg = new Image();
    testImg.onload = () => { photoDiv.style.backgroundImage = `url('${photo.src}')`; };
    testImg.src = photo.src;

    const caption = document.createElement('div');
    caption.className = 'memory-caption';
    caption.textContent = photo.caption;

    photoDiv.appendChild(caption);
    slide.appendChild(photoDiv);
    wrapper.appendChild(slide);
  });
}

let memorySwiper = null;
function initGallery() {
  if (!window.Swiper) return;
  memorySwiper = new Swiper('.memorySwiper', {
    effect: 'cards',
    grabCursor: true,
    loop: false,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-next', prevEl: '.swiper-prev' }
  });
}

function playGalleryEntrance() {
  if (window.gsap) {
    gsap.fromTo('.scene--gallery .swiper.memorySwiper', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
  }
}

/* ---------------------------------------------------------------
   9. SCENE 6 — WISH CARDS
------------------------------------------------------------------ */
function playWishCards() {
  const cards = $$('#wishGrid .wish-card');
  if (!window.gsap) {
    cards.forEach((c) => { c.style.opacity = 1; c.style.transform = 'none'; });
    return;
  }
  gsap.to(cards, {
    opacity: 1,
    y: 0,
    rotate: 0,
    duration: 0.7,
    stagger: 0.15,
    ease: 'back.out(1.6)'
  });
}

/* ---------------------------------------------------------------
   10. SCENE 7 — INTERACTIVE HEART
------------------------------------------------------------------ */
function bindInteractiveHeart() {
  const heartBtn = $('#heartButton');
  const hint = $('#heartHint');
  const message = $('#heartMessage');
  const nextBtn = $('#heartNextBtn');
  let tapped = false;

  heartBtn.addEventListener('click', () => {
    if (tapped) return;
    tapped = true;
    heartBtn.classList.add('is-tapped');
    hint.style.opacity = '0';

    fireConfetti(1.4);

    // hundreds of hearts floating upward from the heart's position
    const rect = heartBtn.getBoundingClientRect();
    const count = prefersReducedMotion ? 12 : 60;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        spawnParticle('fx-heart', {
          left: rect.left + rect.width / 2 + randomBetween(-60, 60) + 'px',
          top: rect.top + 'px',
          bottom: 'auto',
          '--drift': randomBetween(-60, 60) + 'px',
          animationDuration: randomBetween(3, 5) + 's',
          fontSize: randomBetween(0.9, 1.8) + 'rem'
        }, 5200);
        fxLayer.lastChild.textContent = '❤';
      }, i * 25);
    }

    if (window.gsap) {
      gsap.to('body', { backgroundColor: 'rgba(255,255,255,0.02)', duration: 0.6, yoyo: true, repeat: 1 });
      gsap.to(message, { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: 'power2.out' });
      gsap.fromTo(nextBtn, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.2, onStart: () => { nextBtn.hidden = false; } });
    } else {
      message.style.opacity = 1;
      nextBtn.hidden = false;
    }
  });
}

/* ---------------------------------------------------------------
   11. SCENE 8 — FINAL CINEMATIC WISH
------------------------------------------------------------------ */
function playFinale() {
  const words = $$('#finaleWords .finale-word');
  const footer = $('#finaleFooter');

  if (!window.gsap) {
    words.forEach((w) => { w.style.display = 'block'; w.style.opacity = 1; });
    footer.style.opacity = 1;
    return;
  }

  const tl = gsap.timeline();
  words.forEach((word, i) => {
    tl.set(words, { display: 'none', opacity: 0 })
      .set(word, { display: 'block' })
      .fromTo(word, { opacity: 0, scale: 0.7, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' })
      .to(word, { opacity: i === words.length - 1 ? 1 : 0, duration: 0.5 }, '+=0.9');
  });

  tl.call(() => fireFireworks());
  tl.to(footer, { opacity: 1, duration: 1, ease: 'power2.out' }, '+=0.1');
}

function fireFireworks() {
  if (!window.confetti || prefersReducedMotion) { fireConfetti(1); return; }
  const duration = 2500;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#ffd782', '#ff6fa0', '#c9a9ff'] });
    confetti({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#ffd782', '#ff6fa0', '#c9a9ff'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  fireConfetti(1.5);
}

/* ---------------------------------------------------------------
   12. SCENE 9 — FINAL SURPRISE MODAL
------------------------------------------------------------------ */
function bindFinalSurprise() {
  const openBtn = $('#finalSurpriseBtn');
  const overlay = $('#modalOverlay');
  const closeBtn = $('#modalClose');
  $('#modalSignature').textContent = `— ${birthdayConfig.signature}`;

  openBtn.addEventListener('click', () => {
    overlay.classList.add('is-open');
    fireConfetti(1);
    spawnRosePetals();
  });
  closeBtn.addEventListener('click', () => overlay.classList.remove('is-open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('is-open'); });
}

function spawnRosePetals() {
  if (prefersReducedMotion) return;
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      spawnParticle('fx-petal', {
        left: randomBetween(0, 100) + 'vw',
        top: '-5vh',
        '--drift': randomBetween(-50, 50) + 'px',
        animationDuration: randomBetween(6, 10) + 's',
        fontSize: randomBetween(0.9, 1.5) + 'rem'
      }, 10000);
      fxLayer.lastChild.textContent = '❀';
    }, i * 90);
  }
}

/* ---------------------------------------------------------------
   13. MUSIC PLAYER
------------------------------------------------------------------ */
const bgMusic = $('#bgMusic');
const musicToggle = $('#musicToggle');
let musicStarted = false;

function startMusic() {
  if (musicStarted) return;
  musicStarted = true;
  bgMusic.volume = 0.5;
  bgMusic.play().then(() => {
    musicToggle.classList.add('is-playing');
    musicToggle.innerHTML = '<i class="fa-solid fa-music"></i>';
  }).catch(() => {
    // assets/music.mp3 missing or autoplay blocked — fail silently,
    // the visitor can still start it manually via the toggle button.
    musicStarted = false;
  });
}

musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().then(() => musicToggle.classList.add('is-playing')).catch(() => {});
  } else {
    bgMusic.pause();
    musicToggle.classList.remove('is-playing');
  }
});

/* ---------------------------------------------------------------
   14. INIT
------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  buildProgressDots();
  bindNextButtons();

  buildNameLetters();
  buildGallerySlides();
  initGallery();

  bindInteractiveHeart();
  bindFinalSurprise();
  handleOpenSurprise();

  initStarfield();
  startAmbientParticles();
  startCursorTrail();

  // Register the animation that should run the first time each scene appears
  sceneAnimators[1] = playIntroEntrance;
  sceneAnimators[2] = playNameReveal;
  sceneAnimators[3] = playAgeReveal;
  sceneAnimators[4] = playMessageReveal;
  sceneAnimators[5] = playGalleryEntrance;
  sceneAnimators[6] = playWishCards;
  sceneAnimators[8] = playFinale;

  // Play scene 1's entrance immediately since it's active on load
  playedScenes.add(1);
  playIntroEntrance();
});
