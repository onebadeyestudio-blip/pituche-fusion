/* Filtro de cliente — "Arma tu pedido" (Pituche), Sprint 2, 2026-08-31.
   ADITIVO: no modifica _next/ ni el builder React; es un overlay que se pinta
   ENCIMA del DOM ya existente. Nace del pedido de Kobe (feedback de Bernardo
   viendo el sitio en vivo): calificar quién habla ANTES de que entre al flujo
   de cotización — "¿Compras por MAYOREO (5,000+ piezas personalizadas) o
   POR CAJA (recoges en Abastos)?" — dos caminos, sin mezclarlos.

   Guarda la respuesta en sessionStorage("pituche_cliente_tipo") = "mayoreo" | "por-caja".
   lead-submit.js lee ese valor y lo manda como tag al contacto de GHL. */
(function () {
  "use strict";

  var KEY = "pituche_cliente_tipo";

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function saved() {
    try { return sessionStorage.getItem(KEY) || ""; } catch (e) { return ""; }
  }
  function save(v) {
    try { sessionStorage.setItem(KEY, v); } catch (e) { /* privado / bloqueado: seguimos igual */ }
  }

  function buildOverlay() {
    var overlay = el("div", "cg-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Cómo compras en Pituche");

    var card = el("div", "cg-card");
    overlay.appendChild(card);

    var gate = el("div", "cg-gate");
    gate.appendChild(el("p", "cg-eyebrow", "ANTES DE EMPEZAR"));
    gate.appendChild(el("h2", null, "¿Cómo compras en Pituche?"));
    gate.appendChild(el("p", "cg-lead", "Así te mandamos directo a lo que necesitas — sin pasos de más."));

    var opts = el("div", "cg-options");

    var optMayoreo = el("button", "cg-opt cg-opt-mayoreo");
    optMayoreo.type = "button";
    optMayoreo.innerHTML =
      '<span class="cg-opt-icon">🏭</span>' +
      '<b>Mayoreo</b>' +
      '<span>5,000+ piezas personalizadas — cotización a medida</span>';
    optMayoreo.addEventListener("click", function () {
      save("mayoreo");
      closeOverlay(overlay);
    });

    var optCaja = el("button", "cg-opt cg-opt-caja");
    optCaja.type = "button";
    optCaja.innerHTML =
      '<span class="cg-opt-icon">📦</span>' +
      '<b>Por caja</b>' +
      '<span>Recojo en Mercado de Abastos — precio de mostrador</span>';
    optCaja.addEventListener("click", function () {
      save("por-caja");
      showCajaRedirect(overlay);
    });

    opts.appendChild(optMayoreo);
    opts.appendChild(optCaja);
    gate.appendChild(opts);
    card.appendChild(gate);

    document.body.appendChild(overlay);
    return overlay;
  }

  function showCajaRedirect(overlay) {
    var card = overlay.querySelector(".cg-card");
    card.innerHTML = "";
    var box = el("div", "cg-redirect");
    box.appendChild(el("p", "cg-eyebrow", "COMPRA POR CAJA"));
    box.appendChild(el("h2", null, "Te esperamos en Abastos."));
    box.appendChild(el(
      "p",
      "cg-lead",
      "Por caja se compra en persona, a precio de mostrador — no necesitas armar una cotización aquí. " +
        "Elige a dónde ir:"
    ));
    var links = el("div", "cg-redirect-links");
    var a1 = el("a", "cg-redirect-link cg-redirect-primary", "📍 Ver ubicación y horario →");
    a1.href = "../ubicacion/";
    var a2 = el("a", "cg-redirect-link", "🗂️ Ver catálogo →");
    a2.href = "../productos/";
    links.appendChild(a1);
    links.appendChild(a2);
    box.appendChild(links);

    var alt = el(
      "button",
      "cg-redirect-alt",
      "En realidad sí quiero armar un pedido de mayoreo →"
    );
    alt.type = "button";
    alt.addEventListener("click", function () {
      save("mayoreo");
      closeOverlay(overlay);
    });
    box.appendChild(alt);

    card.appendChild(box);
  }

  function closeOverlay(overlay) {
    overlay.classList.add("cg-closing");
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 220);
  }

  function start() {
    var current = saved();
    // "mayoreo" ya elegido en esta sesión -> directo al builder, sin volver a preguntar.
    if (current === "mayoreo") return;
    var overlay = buildOverlay();
    // Si ya había elegido "por-caja" antes (ej. regresó con el botón atrás),
    // muestra directo el panel de redirección en vez de la pregunta completa.
    if (current === "por-caja") showCajaRedirect(overlay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
