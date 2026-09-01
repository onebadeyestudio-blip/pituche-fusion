/* Cablea el boton "Solicitar cotizacion" del builder al lead-capture real
   (Supabase Edge Function -> GHL). Sprint 2, 2026-08-31 (Hugo).
   ADITIVO: no toca _next/ ni el builder React; solo escucha clicks sobre el
   DOM ya pintado, igual que cotizador-extra.js. Selectores verificados en
   vivo (localhost:8791/armar-pedido/, build actual):
     - .builder .form-grid input[placeholder="Tu nombre"]
     - .builder .form-grid input[placeholder="Nombre del negocio"]
     - .builder .form-grid input[placeholder="33 0000 0000"]
     - .builder .form-grid input[placeholder="Guadalajara, Zapopan..."]
     - .builder .summary-box span:nth-child(2)  -> "🥤 Vasos" (familia/producto)
     - .builder .summary-box span:nth-child(3)  -> "3000 · piezas al mes"
     - .builder button.primary.full             -> "Solicitar cotizacion" (hoy no-op)
     - .builder small.demo-message              -> aviso "Demo visual..." */
(function () {
  "use strict";

  var ENDPOINT = "https://tjeescgwlzvxbkxeybqv.supabase.co/functions/v1/pituche-armar-pedido-lead";
  // Publishable key de Supabase -- NO es secreta, esta hecha para vivir en el
  // navegador (misma logica que una publishable key de Stripe). El secreto
  // real (GHL_TOKEN_PITUCHE) vive del lado del servidor, dentro de la funcion.
  var ANON_KEY = "sb_publishable_7PO5v4hWyf1xEai3ylHfuw_oVXwLl8Q";
  var GATE_KEY = "pituche_cliente_tipo";

  function slugify(s) {
    return String(s || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function readForm() {
    var box = document.querySelector(".builder");
    if (!box) return null;
    var qs = function (ph) { return box.querySelector('.form-grid input[placeholder="' + ph + '"]'); };
    var nombreEl = qs("Tu nombre");
    var negocioEl = qs("Nombre del negocio");
    var whatsappEl = qs("33 0000 0000");
    var zonaEl = qs("Guadalajara, Zapopan...");
    var summarySpans = box.querySelectorAll(".summary-box span");
    var productoTitulo = summarySpans[0] ? summarySpans[0].textContent.replace(/^[^\p{L}\p{N}]+/u, "").trim() : "";
    var cantidadUnidad = summarySpans[1] ? summarySpans[1].textContent.trim() : "";
    var cantidad = "", unidad = "";
    if (cantidadUnidad.indexOf(" · ") !== -1) {
      var parts = cantidadUnidad.split(" · ");
      cantidad = (parts[0] || "").trim();
      unidad = (parts[1] || "").trim();
    } else {
      cantidad = cantidadUnidad;
    }
    var clienteTipo = "";
    try { clienteTipo = sessionStorage.getItem(GATE_KEY) || ""; } catch (e) { /* noop */ }

    return {
      nombreEl: nombreEl, whatsappEl: whatsappEl,
      payload: {
        nombre: nombreEl ? nombreEl.value.trim() : "",
        negocio: negocioEl ? negocioEl.value.trim() : "",
        whatsapp: whatsappEl ? whatsappEl.value.trim() : "",
        zona: zonaEl ? zonaEl.value.trim() : "",
        producto: slugify(productoTitulo),
        producto_titulo: productoTitulo,
        cantidad: cantidad,
        unidad: unidad,
        cliente_tipo: clienteTipo,
        website: "" // honeypot -- siempre vacio desde este flujo
      }
    };
  }

  function setStatus(box, text, isError) {
    var msg = box.querySelector("small.demo-message");
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("cot-lead-error", !!isError);
    msg.classList.toggle("cot-lead-ok", !isError && text.indexOf("✅") === 0);
  }

  function markDemoNoticeLive(box) {
    // El copy "Demo visual: no envia datos..." ya no aplica -- el envio es real.
    var msg = box.querySelector("small.demo-message");
    if (msg && !msg.dataset.leadRewritten) {
      msg.textContent = "Tu solicitud llega directo a nuestro equipo de ventas.";
      msg.dataset.leadRewritten = "1";
    }
  }

  function handleClick(btn, box) {
    if (btn.dataset.leadBusy === "1") return;
    var data = readForm();
    if (!data) return;

    if (!data.payload.nombre || !data.payload.whatsapp) {
      setStatus(box, "Falta tu nombre o WhatsApp para poder cotizarte.", true);
      (data.payload.nombre ? data.whatsappEl : data.nombreEl || data.whatsappEl || {}).focus &&
        (data.payload.nombre ? data.whatsappEl : data.nombreEl).focus();
      return;
    }

    btn.dataset.leadBusy = "1";
    var original = btn.textContent;
    btn.textContent = "Enviando…";
    btn.disabled = true;
    setStatus(box, "Enviando tu solicitud…", false);

    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": "Bearer " + ANON_KEY
      },
      body: JSON.stringify(data.payload)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (res.ok && res.body && res.body.ok) {
          btn.textContent = "Solicitud enviada ✓";
          setStatus(box, "✅ Recibimos tu solicitud. Te contactamos por WhatsApp en breve.", false);
        } else {
          var detail = res.body && (res.body.error === "not_configured")
            ? "Nuestro sistema de cotizaciones está en configuración final — escríbenos por WhatsApp mientras tanto."
            : "No pudimos enviar tu solicitud. Escríbenos por WhatsApp y te ayudamos directo.";
          btn.textContent = original;
          btn.disabled = false;
          btn.dataset.leadBusy = "0";
          setStatus(box, "⚠️ " + detail, true);
        }
      })
      .catch(function () {
        btn.textContent = original;
        btn.disabled = false;
        btn.dataset.leadBusy = "0";
        setStatus(box, "⚠️ No pudimos enviar tu solicitud (conexión). Escríbenos por WhatsApp.", true);
      });
  }

  var observer = null;

  function findSubmitButton(box) {
    // OJO: "button.primary.full" NO es exclusivo del boton final -- los botones
    // "Continuar con <familia>" / "Continuar" de los pasos 1 y 2 usan las MISMAS
    // clases (bug real, cazado en vivo 31-ago: interceptar por clase bloqueaba
    // el avance del paso 1 con preventDefault+stopImmediatePropagation). El
    // texto exacto "Solicitar cotizacion" SI es exclusivo del paso 3.
    var candidates = box.querySelectorAll("button.primary.full");
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].textContent.trim().indexOf("Solicitar cotizaci") === 0) return candidates[i];
    }
    return null;
  }

  function run() {
    var box = document.querySelector(".builder");
    if (!box) return;
    var btn = findSubmitButton(box);
    if (btn && !btn.dataset.leadBound) {
      btn.dataset.leadBound = "1";
      // capture:true + stopImmediatePropagation: el propio boton React trae un
      // handler que muestra un alert() "Esta demo no envia informacion..." --
      // verificado en vivo (localhost:8791). Ahora que el envio es real, ese
      // alert ya no debe dispararse. Interceptamos en fase de captura, ANTES
      // de que el evento le llegue al listener delegado de React (bubble).
      btn.addEventListener(
        "click",
        function (ev) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          if (ev.stopPropagation) ev.stopPropagation();
          handleClick(btn, box);
        },
        true
      );
    }
    markDemoNoticeLive(box);
  }

  function start() {
    run();
    observer = new MutationObserver(function () { run(); });
    observer.observe(document.body, { childList: true, subtree: true });
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
