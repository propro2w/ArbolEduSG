/* ==========================================================
   utilidades.js · Funciones de apoyo (no tienen que ver con el árbol)
   ========================================================== */

/** Espera `ms` milisegundos (se usa con await). */
const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Escapa texto para insertarlo de forma segura dentro de HTML/SVG. */
function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Muestra un aviso breve en la parte inferior de la pantalla. */
let _temporizadorToast = null;
function mostrarToast(mensaje) {
  const t = document.getElementById('toast');
  t.textContent = mensaje;
  t.classList.add('visible');
  clearTimeout(_temporizadorToast);
  _temporizadorToast = setTimeout(() => t.classList.remove('visible'), 3200);
}

/** Número entero aleatorio entre min y max (ambos incluidos). */
function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Mezcla un arreglo (Fisher-Yates) y devuelve una copia. */
function mezclar(arreglo) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = aleatorioEntre(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Efecto de onda (micro-animación) al presionar cualquier botón .btn. */
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
