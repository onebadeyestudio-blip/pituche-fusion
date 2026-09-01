/* Fotos REALES del local de Abastos, sacadas del Google Business Profile
   publico de Pituche (google.com/maps -> "Pituche", 3.6 (46), Calz. Lazaro
   Cardenas 2305, Local F-26, Guadalajara -- el mismo listing que enlaza
   "Abrir en Google Maps" en esta pagina). Sprint 2, 2026-08-31 (Hugo).
   Origen exacto por archivo, con fecha que Google reporta para la foto:
     - img/fachada_01_local_abastos.jpg    -- foto "Todas", fecha abr 2019
     - img/interior_01_estanteria_muestras.jpg -- foto "Interior", fecha jun 2017
     - img/interior_02_mostrador.jpg       -- foto "Interior" (siguiente en el carrusel)
   Descargadas directo de *.googleusercontent.com (no son screenshot de pantalla).
   NINGUNA es render de IA ni foto generada -- son las fotos reales que Google
   muestra hoy en el listing publico.

   ADITIVO: esta pagina SI hidrata con React (trae self.__next_f.push de RSC),
   a diferencia de /personaliza. Por eso NO se edita el HTML servido a mano --
   se inserta un bloque nuevo DESPUES de que React termina de pintar, como
   hermano de las secciones existentes, para no pelearse con la reconciliacion. */
(function () {
  "use strict";

  var PHOTOS = [
    { src: "/ubicacion/img/fachada_01_local_abastos.jpg", alt: "Fachada del local de Pituche en Abastos, Local F-26", caption: "Así se ve la entrada — Local F-26" },
    { src: "/ubicacion/img/interior_01_estanteria_muestras.jpg", alt: "Estantería con productos de muestra dentro del local de Pituche", caption: "Muestras en anaquel, listas para ver" },
    { src: "/ubicacion/img/interior_02_mostrador.jpg", alt: "Mostrador y exhibidor de productos dentro del local de Pituche", caption: "El mostrador donde te atienden" }
  ];

  function build() {
    if (document.querySelector(".real-photos")) return;
    var main = document.querySelector("main");
    var locationPage = document.querySelector(".location-page");
    if (!main || !locationPage) return;

    var section = document.createElement("section");
    section.className = "real-photos";
    section.innerHTML =
      '<p class="eyebrow">VE EL PRODUCTO ANTES DE PEDIRLO</p>' +
      "<h2>Así es el local, hoy mismo.</h2>" +
      '<p class="real-photos-lead">Fotos reales del punto de venta, tomadas del listing público de Pituche en Google — no son ilustración.</p>' +
      '<div class="real-photos-grid"></div>' +
      '<small class="real-photos-source">Fuente: <a href="https://www.google.com/maps/place/Pituche/@20.6552761,-103.3783667" target="_blank" rel="noreferrer">Google Business Profile de Pituche</a> (perfil público).</small>';

    var grid = section.querySelector(".real-photos-grid");
    PHOTOS.forEach(function (p) {
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = p.src;
      img.alt = p.alt;
      img.loading = "lazy";
      var cap = document.createElement("figcaption");
      cap.textContent = p.caption;
      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);
    });

    locationPage.insertAdjacentElement("afterend", section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
  // Red de seguridad: si React re-pinta main tras hidratar, nos aseguramos
  // de que el bloque siga ahí (igual patron que cotizador-extra.js).
  var n = 0;
  var iv = setInterval(function () {
    build();
    if (++n > 10) clearInterval(iv);
  }, 400);
})();
