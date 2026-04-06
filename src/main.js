import { ParticleSystem } from './particles.js';
import { getLang, toggleLang, t } from './i18n.js';

let data = [];
let particles;
let silhouetteCanvas;
let lastTime = 0;

const canvas = document.getElementById('canvas');
const infoCard = document.getElementById('info-card');
const infoName = document.getElementById('info-name');
const infoNameAlt = document.getElementById('info-name-alt');
const infoAge = document.getElementById('info-age');
const infoBorn = document.getElementById('info-born');
const loading = document.getElementById('loading');
const loadingFill = document.getElementById('loading-fill');
const infoModal = document.getElementById('info-modal');
const modalBody = document.getElementById('modal-body');
const filterPanel = document.getElementById('filter-panel');
const searchPanel = document.getElementById('search-panel');
const searchInput = document.getElementById('search-input');
const searchCount = document.getElementById('search-count');
const rangeMin = document.getElementById('range-min');
const rangeMax = document.getElementById('range-max');
const rangeMinLabel = document.getElementById('range-min-label');
const rangeMaxLabel = document.getElementById('range-max-label');
const rangeFill = document.getElementById('range-fill');
const filterCount = document.getElementById('filter-count');

let ageValues = [];

function parseAgeToYears(ageStr) {
  if (!ageStr) return -1;
  const s = String(ageStr).toLowerCase().trim();
  if (s === 'less than a day') return 0;
  const num = parseInt(s);
  if (isNaN(num)) return -1;
  if (s.includes('day')) return 0;
  if (s.includes('month')) return 0;
  return num;
}

function createSilhouetteCanvas() {
  silhouetteCanvas = document.createElement('canvas');
  silhouetteCanvas.width = 40;
  silhouetteCanvas.height = 60;
}

function drawSilhouette(ctx, x, y, scale, alpha, sex) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff';

  if (sex === 'f') {
    // Female silhouette

    // Head
    ctx.beginPath();
    ctx.arc(0, -24, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.beginPath();
    ctx.moveTo(-7, -26);
    ctx.quadraticCurveTo(-10, -20, -9, -14);
    ctx.lineTo(-7, -14);
    ctx.quadraticCurveTo(-8, -20, -5, -25);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -26);
    ctx.quadraticCurveTo(10, -20, 9, -14);
    ctx.lineTo(7, -14);
    ctx.quadraticCurveTo(8, -20, 5, -25);
    ctx.closePath();
    ctx.fill();

    // Torso (narrower at waist)
    ctx.beginPath();
    ctx.moveTo(-7, -15);
    ctx.quadraticCurveTo(-9, -10, -8, -4);
    ctx.quadraticCurveTo(-6, 0, -5, 2);
    ctx.lineTo(5, 2);
    ctx.quadraticCurveTo(6, 0, 8, -4);
    ctx.quadraticCurveTo(9, -10, 7, -15);
    ctx.closePath();
    ctx.fill();

    // Skirt / lower body
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.quadraticCurveTo(-12, 14, -11, 25);
    ctx.lineTo(11, 25);
    ctx.quadraticCurveTo(12, 14, 5, 2);
    ctx.closePath();
    ctx.fill();

    // Left arm
    ctx.beginPath();
    ctx.moveTo(-7, -14);
    ctx.quadraticCurveTo(-14, -4, -12, 6);
    ctx.lineTo(-9, 6);
    ctx.quadraticCurveTo(-11, -3, -5, -12);
    ctx.closePath();
    ctx.fill();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(7, -14);
    ctx.quadraticCurveTo(14, -4, 12, 6);
    ctx.lineTo(9, 6);
    ctx.quadraticCurveTo(11, -3, 5, -12);
    ctx.closePath();
    ctx.fill();
  } else {
    // Male silhouette

    // Head
    ctx.beginPath();
    ctx.arc(0, -22, 7, 0, Math.PI * 2);
    ctx.fill();

    // Torso (slimmer)
    ctx.beginPath();
    ctx.moveTo(-8, -13);
    ctx.quadraticCurveTo(-9, -5, -7, 2);
    ctx.lineTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.lineTo(7, 2);
    ctx.quadraticCurveTo(9, -5, 8, -13);
    ctx.closePath();
    ctx.fill();

    // Left arm
    ctx.beginPath();
    ctx.moveTo(-8, -13);
    ctx.quadraticCurveTo(-14, -2, -12, 8);
    ctx.lineTo(-9, 8);
    ctx.quadraticCurveTo(-11, -1, -6, -11);
    ctx.closePath();
    ctx.fill();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(8, -13);
    ctx.quadraticCurveTo(14, -2, 12, 8);
    ctx.lineTo(9, 8);
    ctx.quadraticCurveTo(13, -1, 8, -11);
    ctx.closePath();
    ctx.fill();

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-5, 6);
    ctx.quadraticCurveTo(-6, 16, -7, 25);
    ctx.lineTo(-3, 25);
    ctx.quadraticCurveTo(-2, 16, -2, 6);
    ctx.closePath();
    ctx.fill();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(5, 6);
    ctx.quadraticCurveTo(6, 16, 7, 25);
    ctx.lineTo(3, 25);
    ctx.quadraticCurveTo(2, 16, 2, 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

async function loadData() {
  loadingFill.style.width = '30%';

  const resp = await fetch('./data.json');
  loadingFill.style.width = '70%';

  data = await resp.json();
  loadingFill.style.width = '100%';

  return data;
}

function initParticles() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth * dpr;
  const h = window.innerHeight * dpr;

  canvas.width = w;
  canvas.height = h;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  particles = new ParticleSystem(canvas);
  particles.init(data.length, w, h);
}

let overlayCtx;
let overlayCanvas;

function initOverlay() {
  overlayCanvas = document.createElement('canvas');
  overlayCanvas.id = 'overlay';
  overlayCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;';
  document.body.appendChild(overlayCanvas);

  const dpr = window.devicePixelRatio || 1;
  overlayCanvas.width = window.innerWidth * dpr;
  overlayCanvas.height = window.innerHeight * dpr;
  overlayCtx = overlayCanvas.getContext('2d');
  overlayCtx.scale(dpr, dpr);
}

let mouseX = -1000, mouseY = -1000;
let currentHovered = -1;
let hoverAnim = 0;

canvas.addEventListener('mousemove', (e) => {
  const dpr = window.devicePixelRatio || 1;
  mouseX = e.clientX * dpr;
  mouseY = e.clientY * dpr;
});

canvas.addEventListener('mouseleave', () => {
  mouseX = -1000;
  mouseY = -1000;
  currentHovered = -1;
  particles?.setHovered(-1);
  infoCard.classList.add('hidden');
  fadeOutAudio();
});

// Mobile: touch-and-drag to explore names
let touching = false;
canvas.addEventListener('touchstart', (e) => {
  touching = true;
  const touch = e.touches[0];
  const dpr = window.devicePixelRatio || 1;
  mouseX = touch.clientX * dpr;
  mouseY = touch.clientY * dpr;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!touching) return;
  e.preventDefault();
  const touch = e.touches[0];
  const dpr = window.devicePixelRatio || 1;
  mouseX = touch.clientX * dpr;
  mouseY = touch.clientY * dpr;
}, { passive: false });

canvas.addEventListener('touchend', () => {
  touching = false;
  mouseX = -1000;
  mouseY = -1000;
  currentHovered = -1;
  particles?.setHovered(-1);
  infoCard.classList.add('hidden');
});

function updateHover(e_clientX, e_clientY) {
  if (!particles) return;

  const idx = particles.getIndexAt(mouseX, mouseY);

  if (idx !== currentHovered) {
    currentHovered = idx;
    particles.setHovered(idx);
    hoverAnim = 0;

    if (idx >= 0 && idx < data.length) {
      fadeInAudio();
      const d = data[idx];
      const lang = getLang();

      if (lang === 'ar') {
        infoName.textContent = d.a;
        infoNameAlt.textContent = d.n;
        infoName.style.fontFamily = "'Noto Kufi Arabic', sans-serif";
        infoNameAlt.style.fontFamily = "'Inter', sans-serif";
      } else {
        infoName.textContent = d.n;
        infoNameAlt.textContent = d.a;
        infoName.style.fontFamily = "'Inter', sans-serif";
        infoNameAlt.style.fontFamily = "'Noto Kufi Arabic', sans-serif";
      }
      infoNameAlt.dir = lang === 'ar' ? 'ltr' : 'rtl';

      infoAge.textContent = `${t('age')}: ${d.g}`;
      infoBorn.textContent = `${t('born')}: ${d.b}`;

      const dpr = window.devicePixelRatio || 1;
      const px = mouseX / dpr;
      const py = mouseY / dpr;

      const cardW = 280;
      const cardH = 120;
      let cardX, cardY;

      if (isMobile) {
        // On mobile, position card above the tap and centered horizontally
        cardX = px - cardW / 2;
        cardY = py - cardH - 60;
      } else {
        cardX = px + 20;
        cardY = py - 20;
        if (cardX + cardW > window.innerWidth) cardX = px - cardW;
      }

      // Clamp to screen edges
      if (cardX + cardW > window.innerWidth - 10) cardX = window.innerWidth - cardW - 10;
      if (cardX < 10) cardX = 10;
      if (cardY + cardH > window.innerHeight - 10) cardY = py - cardH - 20;
      if (cardY < 10) cardY = py + 40;

      infoCard.style.left = cardX + 'px';
      infoCard.style.top = cardY + 'px';
      infoCard.classList.remove('hidden');
    } else {
      infoCard.classList.add('hidden');
      fadeOutAudio();
    }
  }
}

function renderOverlay(dt) {
  if (!overlayCtx) return;

  const dpr = window.devicePixelRatio || 1;
  overlayCtx.clearRect(0, 0, overlayCanvas.width / dpr, overlayCanvas.height / dpr);

  if (currentHovered >= 0) {
    hoverAnim = Math.min(1, hoverAnim + dt * 3);
    const px = mouseX / dpr;
    const py = mouseY / dpr;

    if (particles) {
      const idx = currentHovered;
      const phase = particles.phases[idx];
      const drift = Math.sin(particles.time * 0.3 + phase) * 2.0;
      const driftY = Math.cos(particles.time * 0.2 + phase * 1.3) * 1.5;
      const bx = (particles.basePositions[idx * 2] + drift) / dpr;
      const by = (particles.basePositions[idx * 2 + 1] + driftY) / dpr;

      const sex = (currentHovered < data.length) ? data[currentHovered].s : 'm';
      drawSilhouette(overlayCtx, bx, by, hoverAnim * 1.2, hoverAnim * 0.9, sex);
    }
  }
}

function animate(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  const dpr = window.devicePixelRatio || 1;
  updateHover(mouseX / dpr, mouseY / dpr);

  particles.render(dt);
  renderOverlay(dt);

  requestAnimationFrame(animate);
}

function handleResize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth * dpr;
  const h = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  particles.resize(w, h);

  if (overlayCanvas) {
    overlayCanvas.width = w;
    overlayCanvas.height = h;
    overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.scale(dpr, dpr);
  }
}

document.getElementById('lang-toggle').addEventListener('click', () => {
  toggleLang();
  updateFilterLabels();
  updateSearchLabels();
  if (currentHovered >= 0 && currentHovered < data.length) {
    const d = data[currentHovered];
    const lang = getLang();
    if (lang === 'ar') {
      infoName.textContent = d.a;
      infoNameAlt.textContent = d.n;
    } else {
      infoName.textContent = d.n;
      infoNameAlt.textContent = d.a;
    }
    infoAge.textContent = `${t('age')}: ${d.g}`;
    infoBorn.textContent = `${t('born')}: ${d.b}`;
  }
});

// Info modal
document.getElementById('info-btn').addEventListener('click', () => {
  modalBody.innerHTML = t('infoBody');
  infoModal.classList.remove('hidden');
});

infoModal.querySelector('.modal-close').addEventListener('click', () => {
  infoModal.classList.add('hidden');
});

infoModal.addEventListener('click', (e) => {
  if (e.target === infoModal) infoModal.classList.add('hidden');
});

// Audio — plays while hovering, fades out when mouse leaves
// Strategy: start audio at volume 0 on first user gesture, keep it playing,
// then just control volume. This avoids play() calls outside user gestures.
const bgAudio = document.getElementById('bg-audio');
const muteBtn = document.getElementById('mute-btn');
const iconUnmuted = document.getElementById('icon-unmuted');
const iconMuted = document.getElementById('icon-muted');
const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
let isMuted = isMobile;
let audioUnlocked = false;
let fadeInterval = null;
const TARGET_VOLUME = 0.10;
let targetVol = 0; // what we're fading towards

bgAudio.volume = 0;

if (isMobile) {
  iconUnmuted.style.display = 'none';
  iconMuted.style.display = 'block';
}

// Audio is unlocked by the "Enter" button click in main()

function startFade() {
  if (fadeInterval) return;
  fadeInterval = setInterval(() => {
    const diff = targetVol - bgAudio.volume;
    if (Math.abs(diff) < 0.003) {
      bgAudio.volume = targetVol;
      clearInterval(fadeInterval);
      fadeInterval = null;
    } else {
      bgAudio.volume = Math.min(1, Math.max(0, bgAudio.volume + (diff > 0 ? 0.008 : -0.005)));
    }
  }, 30);
}

function fadeInAudio() {
  if (isMuted || !audioUnlocked) return;
  targetVol = TARGET_VOLUME;
  startFade();
}

function fadeOutAudio() {
  targetVol = 0;
  if (!audioUnlocked) return;
  startFade();
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  iconUnmuted.style.display = isMuted ? 'none' : 'block';
  iconMuted.style.display = isMuted ? 'block' : 'none';

  if (!audioUnlocked) {
    // First interaction — unlock audio (user gesture required)
    bgAudio.volume = isMuted ? 0 : TARGET_VOLUME;
    bgAudio.muted = isMuted;
    bgAudio.play().then(() => {
      audioUnlocked = true;
    }).catch(() => {});
    return;
  }

  if (isMuted) {
    bgAudio.muted = true;
  } else {
    bgAudio.muted = false;
    // On mobile, play continuously at target volume; on desktop, only on hover
    if (isMobile) {
      targetVol = TARGET_VOLUME;
      bgAudio.volume = TARGET_VOLUME;
    } else if (currentHovered >= 0) {
      fadeInAudio();
    }
  }
});

// Filter panel
document.getElementById('filter-btn').addEventListener('click', () => {
  filterPanel.classList.toggle('hidden');
});

document.getElementById('filter-close').addEventListener('click', () => {
  filterPanel.classList.add('hidden');
});

function updateRangeFill() {
  const min = parseInt(rangeMin.value);
  const max = parseInt(rangeMax.value);
  const pctMin = (min / 110) * 100;
  const pctMax = (max / 110) * 100;
  rangeFill.style.left = pctMin + '%';
  rangeFill.style.width = (pctMax - pctMin) + '%';
}

function updateFilterLabels() {
  const label = t('filterShowing');
  const showingEl = document.getElementById('filter-showing');
  if (getLang() === 'ar') {
    showingEl.innerHTML = `<strong id="filter-count">${filterCount.textContent}</strong> ${label}`;
  } else {
    showingEl.innerHTML = `${label} <strong id="filter-count">${filterCount.textContent}</strong>`;
  }
}

function applyFilter() {
  if (particles) applyFilters();
}

rangeMin.addEventListener('input', () => {
  if (parseInt(rangeMin.value) > parseInt(rangeMax.value)) {
    rangeMin.value = rangeMax.value;
  }
  applyFilter();
});

rangeMax.addEventListener('input', () => {
  if (parseInt(rangeMax.value) < parseInt(rangeMin.value)) {
    rangeMax.value = rangeMin.value;
  }
  applyFilter();
});

document.getElementById('filter-reset').addEventListener('click', () => {
  rangeMin.value = 0;
  rangeMax.value = 110;
  applyFilter();
});

// Search panel
let searchQuery = '';

document.getElementById('search-btn').addEventListener('click', () => {
  searchPanel.classList.toggle('hidden');
  if (!searchPanel.classList.contains('hidden')) {
    searchInput.focus();
  }
});

document.getElementById('search-close').addEventListener('click', () => {
  searchPanel.classList.add('hidden');
});

function updateSearchLabels() {
  const label = t('searchShowing');
  const showingEl = document.getElementById('search-showing');
  if (getLang() === 'ar') {
    showingEl.innerHTML = `<strong id="search-count">${searchCount.textContent}</strong> ${label}`;
  } else {
    showingEl.innerHTML = `${label} <strong id="search-count">${searchCount.textContent}</strong>`;
  }
}

function applyFilters() {
  const min = parseInt(rangeMin.value);
  const max = parseInt(rangeMax.value);
  const query = searchQuery.toLowerCase();
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    const age = ageValues[i];
    let vis = age >= min && age <= max;

    if (vis && query) {
      const d = data[i];
      vis = (d.n && d.n.toLowerCase().includes(query)) ||
            (d.a && d.a.includes(searchQuery));
    }

    particles.setVisible(i, vis);
    if (vis) count++;
  }

  const countStr = count.toLocaleString();
  filterCount.textContent = countStr;
  searchCount.textContent = countStr;
  rangeMinLabel.textContent = min;
  rangeMaxLabel.textContent = max >= 110 ? '110+' : max;
  updateRangeFill();
}

let searchDebounce = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = searchInput.value.trim();
    if (particles) applyFilters();
  }, 200);
});

document.getElementById('search-reset').addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  if (particles) applyFilters();
});

window.addEventListener('resize', handleResize);

async function main() {
  await loadData();

  ageValues = data.map(d => parseAgeToYears(d.g));

  // Show "Enter" button, hide loading spinner
  const loadingInner = document.getElementById('loading-inner');
  const enterBtn = document.getElementById('enter-btn');
  loadingInner.classList.add('done');
  setTimeout(() => enterBtn.classList.remove('hidden'), 400);

  // Wait for user to click Enter — this is the user gesture that unlocks audio
  enterBtn.addEventListener('click', () => {
    // Unlock audio on this click (user gesture)
    if (!isMuted) {
      bgAudio.volume = 0;
      bgAudio.play().then(() => {
        audioUnlocked = true;
      }).catch(() => {});
    }

    loading.classList.add('fade-out');
    setTimeout(() => loading.remove(), 800);

    modalBody.innerHTML = t('infoBody');
    createSilhouetteCanvas();
    initParticles();
    initOverlay();
    updateRangeFill();
    lastTime = performance.now();
    requestAnimationFrame(animate);
  });
}

main();
