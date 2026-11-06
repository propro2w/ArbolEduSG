/* ==========================================================
   utilidades.js · Funciones de apoyo y Audio Web
   ========================================================== */

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let _temporizadorToast = null;
function mostrarToast(mensaje) {
  const t = document.getElementById('toast');
  t.textContent = mensaje;
  t.classList.add('visible');
  clearTimeout(_temporizadorToast);
  _temporizadorToast = setTimeout(() => t.classList.remove('visible'), 3200);
}

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mezclar(arreglo) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = aleatorioEntre(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function reproducirSonido(tipo) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const ahora = audioCtx.currentTime;

    if (tipo === 'insertar') {
      osc.frequency.setValueAtTime(350, ahora);
      osc.frequency.exponentialRampToValueAtTime(700, ahora + 0.15);
      gain.gain.setValueAtTime(0.08, ahora);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.15);
      osc.start(ahora);
      osc.stop(ahora + 0.15);
    } else if (tipo === 'eliminar') {
      osc.frequency.setValueAtTime(500, ahora);
      osc.frequency.exponentialRampToValueAtTime(200, ahora + 0.2);
      gain.gain.setValueAtTime(0.08, ahora);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.2);
      osc.start(ahora);
      osc.stop(ahora + 0.2);
    } else if (tipo === 'paso') {
      osc.frequency.setValueAtTime(440, ahora);
      gain.gain.setValueAtTime(0.04, ahora);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.08);
      osc.start(ahora);
      osc.stop(ahora + 0.08);
    }
  } catch (e) {}
}

document.addEventListener('click', (e) => {
  const boton = e.target.closest('.btn');
  if (!boton || boton.disabled) return;
  const caja = boton.getBoundingClientRect();
  const onda = document.createElement('span');
  onda.className = 'ripple';
  onda.style.left = `${e.clientX - caja.left}px`;
  onda.style.top = `${e.clientY - caja.top}px`;
  boton.appendChild(onda);
  onda.addEventListener('animationend', () => onda.remove());
});