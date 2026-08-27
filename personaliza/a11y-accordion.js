/* Accesibilidad de teclado para los acordeones de Personaliza (pasos + FAQ).
   Los <details>/<summary> ya togglean con teclado en navegadores modernos; esto
   lo hace explícito y a prueba de cualquier interferencia de estilos globales.
   Enter y Espacio abren/cierran; preventDefault evita doble toggle y el scroll
   del Espacio. El clic sigue siendo el nativo. Funciona abriendo el .html directo. */
(function () {
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      var d = e.currentTarget.closest('details');
      if (d) { e.preventDefault(); d.open = !d.open; }
    }
  }
  function bind(sel) {
    document.querySelectorAll(sel).forEach(function (sum) {
      sum.addEventListener('keydown', onKey);
    });
  }
  function init() {
    bind('details.steps-fold > summary');
    bind('.custom-faq details > summary');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
