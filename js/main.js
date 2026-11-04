/* ==========================================================
   main.js · Arranque de la aplicación y navegación por pestañas
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const simulador = new Simulador();
  const teoria = new Teoria();
  const quiz = new Quiz();

  const tabs = [...document.querySelectorAll('.tab')];
  const modulos = [...document.querySelectorAll('.modulo')];

  /** Muestra el módulo indicado y marca su pestaña. */
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

  // Acceso directo desde la consola del navegador para depurar (opcional)
  window.ArbolEdu = { simulador, teoria, quiz };
});
