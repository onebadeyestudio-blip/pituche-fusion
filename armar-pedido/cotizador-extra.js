/* Cotizador Pituche — inyecta miniatura de referencia + medidas.
   ADITIVO: no modifica _next/ ni el catálogo React; solo aumenta el DOM ya pintado.
   Los datos (fotos y medidas) salen del propio sitio de Pituche; nada inventado.
   Robusto ante los re-render de React gracias a checks de existencia + MutationObserver. */
(function () {
  "use strict";

  var BASE = "https://pituche.com/wp-content/uploads/";

  /* Familias del Paso 1 -> foto real de la categoría (imagen del propio sitio)
     + medida corta SOLO donde el sitio publica una capacidad/medida real. */
  var FAMILIES = {
    "Vasos":             { img: BASE + "2023/04/acordion-1-vasos-min.jpg",        measure: "4–20 oz · 118–591 ml" },
    "Platos y charolas": { img: BASE + "2023/04/acordion-1-platos-min.jpg" },
    "Cubiertos":         { img: BASE + "2023/04/acordion-1-cubiertos-min.jpg" },
    "Contenedores":      { img: BASE + "2023/04/acordion-1-contenedores-min.jpg" },
    "Envases":           { img: BASE + "2023/04/acordion-1-envases-min.jpg" },
    "Pastelería":   { img: BASE + "2023/04/acordion-2-pasteleria-min.jpg" },
    "Bolsas de papel":   { img: BASE + "2023/04/acordion-2-bolsa-papel-min.jpg" },
    "Aluminio":          { img: BASE + "2023/04/acordion-2-aluminio-min.jpg" },
    "Ensaladeras":       { img: BASE + "2023/04/acordion-2-ensaladeras-min.jpg" },
    "Complementos":      { img: BASE + "2023/04/acordion-2-complementos-min.jpg" }
  };

  /* Capacidad exacta por presentación de vaso (guía de tamaños del sitio). */
  var CUP = {
    "#04": "4 oz · 118 ml",  "#06": "6 oz · 177 ml",  "#08": "8 oz · 237 ml",
    "#10": "10 oz · 296 ml", "#12": "12 oz · 355 ml", "#16": "16 oz · 473 ml",
    "#20": "20 oz · 591 ml"
  };

  /* Medida por producto (solo donde el sitio publica una medida concreta). */
  var PRODUCT = {
    "Vaso de papel para bebida caliente blanco": "4–20 oz · #04 a #20",
    "Papel encerado 30 × 30": "30 × 30 cm",
    "Cuchara grande Bio": "Tamaño grande",
    "Fajilla para vaso": "Medida estándar"
  };

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  /* Paso 1: cada botón de familia recibe miniatura + (si aplica) medida. */
  function enhanceFamilies() {
    var buttons = document.querySelectorAll(".family-choices button");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var b = btn.querySelector("b");
      if (!b) continue;
      var data = FAMILIES[b.textContent.trim()];
      if (!data) continue;

      btn.classList.add("cot-fam");

      if (data.img && !btn.querySelector(".cot-thumb")) {
        var img = el("img", "cot-thumb");
        img.src = data.img;
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
        img.loading = "lazy";
        (function (button) {
          img.addEventListener("error", function () {
            this.remove();
            button.classList.remove("cot-has-thumb");
          });
        })(btn);
        btn.classList.add("cot-has-thumb");
        btn.appendChild(img);
      }

      if (data.measure && !btn.querySelector(".cot-measure")) {
        var m = el("small", "cot-measure");
        m.textContent = "📏 " + data.measure;
        btn.appendChild(m);
      }
    }
  }

  /* Paso 2: al producto elegido se le agrega su medida real. */
  function enhanceSelected() {
    var box = document.querySelector(".selected-product-summary");
    if (!box || box.querySelector(".cot-measure-inline")) return;
    var nameEl = box.querySelector("b");
    if (!nameEl) return;

    var name = nameEl.textContent.trim();
    var measure = null;

    // Vaso con presentación concreta -> capacidad exacta desde la guía.
    var spans = box.querySelectorAll("span");
    for (var i = 0; i < spans.length; i++) {
      var t = spans[i].textContent || "";
      if (t.indexOf("Presentaci") !== -1) {
        var mm = t.match(/#\d{2}/);
        if (mm && CUP[mm[0]]) measure = CUP[mm[0]];
        break;
      }
    }
    if (!measure && PRODUCT[name]) measure = PRODUCT[name];
    if (!measure && name.indexOf("Vaso") === 0) measure = "4–20 oz según presentación";
    if (!measure) return;

    var target = box.lastElementChild || box; // columna de texto (segundo div)
    var s = el("span", "cot-measure-inline");
    s.textContent = "📏 " + measure;
    target.appendChild(s);
  }

  /* Enlace discreto a la guía de tamaños, dentro del cotizador. */
  function addGuideLink() {
    var intro = document.querySelector(".builder-intro");
    if (!intro || intro.querySelector(".cot-guide-link")) return;
    var a = el("a", "cot-guide-link");
    a.href = "../guia-de-tamanos/";
    a.textContent = "📐 Ver guía de tamaños →";
    intro.appendChild(a); // después de los pasos, como ayuda discreta
  }

  var observer = null;

  function run() {
    if (!document.querySelector(".builder")) return;
    if (observer) observer.disconnect();
    try {
      addGuideLink();
      enhanceFamilies();
      enhanceSelected();
    } finally {
      if (observer) observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function start() {
    run();
    observer = new MutationObserver(function () { run(); });
    observer.observe(document.body, { childList: true, subtree: true });
    // red de seguridad por si el montaje de React tarda en aparecer
    var n = 0;
    var iv = setInterval(function () {
      run();
      if (++n > 24) clearInterval(iv);
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
