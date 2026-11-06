/* ==========================================================
   main.js · Arranque de la aplicación y navegación por pestañas
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const simulador = new Simulador();
  const teoria = new Teoria();
  const quiz = new Quiz();

  const tabs = [...document.querySelectorAll('.tab')];
  const modulos = [...document.querySelectorAll('.modulo')];

  function irA(idModulo) {
    tabs.forEach((t) => {
      const activa = t.dataset.modulo === idModulo;
      t.classList.toggle('activa', activa);
      t.setAttribute('aria-selected', String(activa));
    });
    modulos.forEach((m) => m.classList.toggle('activo', m.id === idModulo));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabs.forEach((t) => t.addEventListener('click', () => irA(t.dataset.modulo)));

  // Modo Oscuro Global
  const btnOscuro = document.getElementById('btn-modo-oscuro');
  const temaGuardado = localStorage.getItem('tema-arboledu');

  if (temaGuardado === 'oscuro') {
    document.body.classList.add('modo-oscuro');
    btnOscuro.textContent = '☀️ Modo Claro';
  }

  btnOscuro.addEventListener('click', () => {
    const esOscuro = document.body.classList.toggle('modo-oscuro');
    btnOscuro.textContent = esOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    localStorage.setItem('tema-arboledu', esOscuro ? 'oscuro' : 'claro');
  });

  window.ArbolEdu = { simulador, teoria, quiz };
});