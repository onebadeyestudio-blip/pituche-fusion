/* Mapa REAL de Google Maps embebido (pedido Bernardo 1-sep-2026, checklist
   clients/pituche/FEEDBACK_BERNARDO_WEB.md punto 5). El bloque ".location-map"
   solo mostraba un pin ilustrativo con la leyenda "Mapa ilustrativo en esta
   demo" — sin mapa real. Se reemplaza por un iframe embed público de Google
   Maps (sin API key) sobre la MISMA dirección que ya usa el link "Abrir en
   Google Maps" de esta página: Pituche, Av. Lázaro Cárdenas 2305 Local F-26,
   Abastos, Guadalajara (coords verificadas: 20.6552761,-103.3783667).

   ADITIVO: esta página SÍ hidrata con React (ver fotos-reales.js, mismo
   hallazgo) — no se edita el HTML servido a mano, se muta el DOM después de
   pintar. Mismo patrón de red de seguridad por si React re-pinta. */
(function () {
  "use strict";

  var MAPS_EMBED_SRC =
    "https://www.google.com/maps?q=Pituche,+Av.+L%C3%A1zaro+C%C3%A1rdenas+2305+Local+F-26,+Guadalajara,+Jalisco&output=embed";

  function build() {
    var box = document.querySelector(".location-map");
    if (!box || box.querySelector("iframe")) return;

    box.classList.add("location-map--real");
    box.innerHTML =
      '<iframe src="' +
      MAPS_EMBED_SRC +
      '" title="Ubicación real de Pituche, Mercado de Abastos, Guadalajara" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
  // Red de seguridad: si React re-pinta tras hidratar, nos aseguramos de
  // que el mapa siga ahí (mismo patrón que fotos-reales.js).
  var n = 0;
  var iv = setInterval(function () {
    build();
    if (++n > 10) clearInterval(iv);
  }, 400);
})();
