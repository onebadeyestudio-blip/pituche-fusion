/* PEDIDO Bernardo 1-sep-2026 (clients/pituche/FEEDBACK_BERNARDO_WEB.md, puntos 1 y 3):
   1) La caja "Plasma tu marca" era un rectángulo plano con texto "TU LOGO" y la leyenda
      "Vista ilustrativa" — sin foto, se lee como un dibujo/mockup vacío. El papá del cliente
      dijo textual que odia "puras imágenes de inteligencia artificial, de vete a la playa y
      sale un vaso" (OS.md, junta 3-ago) y la cotización promete por escrito "cero IA" — así
      que el arreglo usa una FOTO REAL de producto ya aprobada y ya deployada en el sitio
      (personaliza/img/base_vaso.png, la misma que usa el estudio de personalización en vivo),
      nunca una generada por IA.
   2) "Personalizar" debe ser la ESTRELLA del home, no un bloque casi al fondo de la página.
      Se mueve la sección justo después de la franja de beneficios (arriba del todo), sin
      tocar su contenido ni su copy.

   Por qué es un script aditivo y no una edición del HTML servido: index.html (home) hidrata
   con React (trae su propio payload RSC embebido en un <script> de la página) — editar el
   texto servido sin editar también ese payload puede provocar un mismatch de hidratación.
   Mismo patrón ya usado en ubicacion/fotos-reales.js y armar-pedido/cliente-gate.js: se corre
   DESPUÉS de que React ya pintó, y solo se muta el DOM con JS plano. Cero cambio de contenido,
   cero texto nuevo, cero producto que Pituche no venda. */
(function () {
  function run() {
    var band = document.querySelector(".brand-band");
    var cup = document.querySelector(".brand-cup");

    if (cup && !cup.querySelector("img")) {
      var img = document.createElement("img");
      img.src = "/personaliza/img/base_vaso.png";
      img.alt = "Vaso Pituche real, listo para imprimir tu logo";
      img.loading = "lazy";

      var badge = document.createElement("span");
      badge.className = "brand-cup-badge";
      badge.innerHTML = "TU<br>LOGO";

      var caption = cup.querySelector("small");
      if (caption) {
        caption.textContent = "Vista previa · producto real";
      }

      var oldSpan = cup.querySelector("span");
      cup.insertBefore(img, cup.firstChild);
      if (oldSpan) {
        cup.replaceChild(badge, oldSpan);
      } else {
        cup.appendChild(badge);
      }
      cup.classList.add("brand-cup--photo");
    }

    var benefitStrip = document.querySelector(".benefit-strip");
    if (band && benefitStrip && benefitStrip.nextElementSibling !== band) {
      benefitStrip.parentNode.insertBefore(band, benefitStrip.nextSibling);
      band.classList.add("brand-band--promoted");
    }
  }

  if (document.readyState === "complete") {
    run();
  } else {
    window.addEventListener("load", run);
  }
  // Red de seguridad: mismo patrón que ubicacion/fotos-reales.js y
  // ubicacion/mapa-real.js — si el evento "load" ya disparó antes de que
  // este script (defer) alcanzara a engancharse, o si React re-pinta la
  // sección tras hidratar, reintenta unas cuantas veces en vez de depender
  // de un solo evento.
  var n = 0;
  var iv = setInterval(function () {
    run();
    if (++n > 10) clearInterval(iv);
  }, 400);
})();
