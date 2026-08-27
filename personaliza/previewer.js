/* ==========================================================================
   PITUCHE · ESTUDIO DE PERSONALIZACIÓN — motor (canvas 2D, vanilla, sin backend)
   One Bad Eye Studio · agosto 2026
   Sube tu logo -> se dibuja IMPRESO sobre la foto real del producto con
   globalCompositeOperation='multiply' (el blanco desaparece, se integra a la
   superficie). En el vaso se curva como cilindro. Arrastrar / tamaño / rotación.
   Descarga tu vista previa (canvas.toDataURL). No sube nada a ningún servidor.
   ========================================================================== */
(function () {
  'use strict';

  var SIZE = 1024;
  var IMG = '/personaliza/img/';

  /* config por producto: foto base, si es cilíndrico, centro/tamaño default y
     caja segura donde puede moverse el logo (en coords del canvas 1024). */
  var PRODUCTS = {
    vaso:  { src: IMG + 'base_vaso.png',  curve: true,  cx: 512, cy: 560, w: 300, arc: 1.15,
             safe: { x0: 330, y0: 360, x1: 694, y1: 780 } },
    bolsa: { src: IMG + 'base_bolsa.png', curve: false, cx: 512, cy: 560, w: 330, arc: 0,
             safe: { x0: 300, y0: 300, x1: 724, y1: 800 } },
    envase:{ src: IMG + 'base_envase.png',curve: false, cx: 512, cy: 350, w: 250, arc: 0,
             safe: { x0: 350, y0: 250, x1: 674, y1: 470 } }
  };

  var state = {
    prod: 'vaso', hasLogo: false, stamp: null, stampW: 1, stampH: 1,
    lx: 512, ly: 560, lw: 300, rot: 0
  };

  var canvas, ctx, hint, wrap, tip, sizeR, rotR, nameEl, panelLocks;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---- carga de fotos base ---- */
  function loadProducts(done) {
    var keys = Object.keys(PRODUCTS), pend = keys.length;
    keys.forEach(function (k) {
      var im = new Image();
      im.onload = function () { PRODUCTS[k].img = im; if (--pend === 0) done(); };
      im.onerror = function () { if (--pend === 0) done(); };
      im.src = PRODUCTS[k].src;
    });
  }

  /* ---- aplanar logo sobre blanco para que multiply lo integre ---- */
  function makeStamp(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    return { canvas: c, w: w, h: h };
  }

  /* ---- stamp rotado a bbox (para rotación en vaso y plano) ---- */
  function rotatedStamp(deg) {
    if (!deg) return { canvas: state.stamp, w: state.stampW, h: state.stampH };
    var rad = deg * Math.PI / 180, w = state.stampW, h = state.stampH;
    var bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
    var bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    var c = document.createElement('canvas'); c.width = Math.ceil(bw); c.height = Math.ceil(bh);
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); /* fondo blanco = invisible en multiply */
    g.translate(bw / 2, bh / 2); g.rotate(rad);
    g.drawImage(state.stamp, -w / 2, -h / 2, w, h);
    return { canvas: c, w: c.width, h: c.height };
  }

  /* ---- dibujo principal ---- */
  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    var P = PRODUCTS[state.prod];
    if (P.img) ctx.drawImage(P.img, 0, 0, SIZE, SIZE);
    else { ctx.fillStyle = '#eceae6'; ctx.fillRect(0, 0, SIZE, SIZE); }
    if (state.hasLogo && state.stamp) {
      if (P.curve) drawCurved(P); else drawFlat();
    }
  }

  function drawFlat() {
    var src = rotatedStamp(state.rot);
    var W = state.lw, H = W * (src.h / src.w);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.95;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src.canvas, state.lx - W / 2, state.ly - H / 2, W, H);
    ctx.restore();
  }

  /* cilindro: se dibuja el logo en tiras verticales mapeadas sobre un arco.
     La compresión hacia los bordes + el multiply (que hereda el sombreado del
     vaso en la foto) dan el efecto envolvente, no de sticker. */
  function drawCurved(P) {
    var src = rotatedStamp(state.rot);
    var W = state.lw, H = W * (src.h / src.w);
    var A = P.arc || 1.15;                       /* medio ángulo visible */
    var R = (W / 2) / Math.sin(A);               /* radio aparente */
    var steps = Math.max(48, Math.round(W));
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.95;
    ctx.imageSmoothingQuality = 'high';
    for (var i = 0; i < steps; i++) {
      var t = i / steps, u = t * 2 - 1;
      var th = u * A;
      var sxScreen = state.lx + R * Math.sin(th);
      var sliceW = R * Math.cos(th) * (2 * A / steps) + 1.4;   /* compresión en bordes */
      var hh = H * (0.97 + 0.03 * Math.cos(th));               /* leve foreshorten vertical */
      var srcX = t * src.w, srcW = src.w / steps + 1;
      ctx.drawImage(src.canvas, srcX, 0, srcW, src.h,
                    sxScreen - sliceW / 2, state.ly - hh / 2, sliceW, hh);
    }
    ctx.restore();
  }

  /* ---- posicionar dentro de la caja segura ---- */
  function clampPos() {
    var s = PRODUCTS[state.prod].safe;
    state.lx = Math.max(s.x0, Math.min(s.x1, state.lx));
    state.ly = Math.max(s.y0, Math.min(s.y1, state.ly));
  }

  /* ---- carga de logo del usuario ---- */
  function onLogoFile(f) {
    if (!f) return;
    if (nameEl) nameEl.innerHTML = 'Archivo: <b>' + f.name + '</b>';
    if (!window.FileReader) return;
    var fr = new FileReader();
    fr.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var st = makeStamp(img);
        state.stamp = st.canvas; state.stampW = st.w; state.stampH = st.h;
        var P = PRODUCTS[state.prod];
        state.lx = P.cx; state.ly = P.cy; state.lw = P.w; state.rot = 0;
        if (sizeR) sizeR.value = P.w; if (rotR) rotR.value = 0;
        state.hasLogo = true;
        unlock(true);
        if (hint) hint.style.display = 'none';
        draw();
      };
      img.onerror = function () { alert('No pudimos leer esa imagen. Prueba con un PNG o JPG.'); };
      img.src = ev.target.result;
    };
    fr.readAsDataURL(f);
  }

  function unlock(on) {
    for (var i = 0; i < panelLocks.length; i++) {
      var el = panelLocks[i];
      el.classList.toggle('is-locked', !on);
      if ('disabled' in el) el.disabled = !on;
    }
  }

  /* ---- cambio de producto (conserva logo y posición relativa) ---- */
  function setProduct(key) {
    if (!PRODUCTS[key]) return;
    var prev = PRODUCTS[state.prod];
    var fx = (state.lx - prev.safe.x0) / (prev.safe.x1 - prev.safe.x0);
    var fy = (state.ly - prev.safe.y0) / (prev.safe.y1 - prev.safe.y0);
    state.prod = key;
    var P = PRODUCTS[key];
    if (state.hasLogo) {
      state.lx = P.safe.x0 + (isFinite(fx) ? fx : 0.5) * (P.safe.x1 - P.safe.x0);
      state.ly = P.safe.y0 + (isFinite(fy) ? fy : 0.5) * (P.safe.y1 - P.safe.y0);
      clampPos();
    }
    var tabs = document.querySelectorAll('.prod-tab');
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].dataset.prod === key;
      tabs[i].classList.toggle('is-on', on);
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
    draw();
  }

  /* ---- arrastrar el logo ---- */
  function toCanvas(ev) {
    var r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (SIZE / r.width), y: (ev.clientY - r.top) * (SIZE / r.height) };
  }
  var drag = null;
  function pointerDown(ev) {
    if (!state.hasLogo) return;
    var p = toCanvas(ev);
    var H = state.lw * (state.stampH / state.stampW);
    if (Math.abs(p.x - state.lx) <= state.lw * 0.6 && Math.abs(p.y - state.ly) <= H * 0.6 + 20) {
      drag = { dx: state.lx - p.x, dy: state.ly - p.y };
      canvas.classList.add('dragging');
      if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    }
  }
  function pointerMove(ev) {
    if (!drag) return;
    var p = toCanvas(ev);
    state.lx = p.x + drag.dx; state.ly = p.y + drag.dy;
    clampPos(); draw(); ev.preventDefault();
  }
  function pointerUp() { drag = null; if (canvas) canvas.classList.remove('dragging'); }

  /* ---- descargar vista previa ---- */
  function download() {
    if (!state.hasLogo) return;
    try {
      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url; a.download = 'pituche-preview-' + state.prod + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) {
      alert('No se pudo generar la descarga en este navegador.');
    }
  }

  /* ---- init ---- */
  ready(function () {
    var sec = document.querySelector('.studio-section');
    if (!sec) { initMenu(); return; }
    canvas = document.getElementById('studioCanvas');
    if (!canvas) { initMenu(); return; }
    ctx = canvas.getContext('2d');
    hint = document.getElementById('stageHint');
    wrap = document.getElementById('stageWrap');
    tip  = document.getElementById('stageTip');
    sizeR = document.getElementById('sizeRange');
    rotR = document.getElementById('rotRange');
    nameEl = document.getElementById('logoName');
    panelLocks = sec.querySelectorAll('[data-needs-logo]');
    unlock(false);

    var input = document.getElementById('logoInput');
    var upBtn = document.getElementById('uploadBtn');
    if (upBtn && input) upBtn.addEventListener('click', function () { input.click(); });
    if (input) input.addEventListener('change', function () { onLogoFile(input.files && input.files[0]); });

    /* click en el escenario vacío = subir */
    if (wrap && input) wrap.addEventListener('click', function () { if (!state.hasLogo) input.click(); });

    /* drag & drop de archivo sobre el escenario */
    if (wrap) {
      ['dragenter', 'dragover'].forEach(function (t) {
        wrap.addEventListener(t, function (e) { e.preventDefault(); wrap.classList.add('dragover'); });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        wrap.addEventListener(t, function (e) { e.preventDefault(); wrap.classList.remove('dragover'); });
      });
      wrap.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) onLogoFile(f);
      });
    }

    /* tabs de producto */
    var tabs = document.querySelectorAll('.prod-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', (function (t) {
        return function () { setProduct(t.dataset.prod); };
      })(tabs[i]));
    }

    /* sliders */
    if (sizeR) sizeR.addEventListener('input', function () {
      state.lw = parseInt(sizeR.value, 10); clampPos(); draw();
    });
    if (rotR) rotR.addEventListener('input', function () {
      state.rot = parseInt(rotR.value, 10); draw();
    });

    /* arrastrar */
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);

    /* botones */
    var dl = document.getElementById('downloadBtn');
    if (dl) dl.addEventListener('click', download);
    var rs = document.getElementById('resetBtn');
    if (rs) rs.addEventListener('click', function () {
      var P = PRODUCTS[state.prod];
      state.lx = P.cx; state.ly = P.cy; state.lw = P.w; state.rot = 0;
      if (sizeR) sizeR.value = P.w; if (rotR) rotR.value = 0;
      draw();
    });

    loadProducts(function () { draw(); });
    initMenu();
  });

  /* ---- menú móvil (los scripts de Next se quitaron de esta página) ---- */
  function initMenu() {
    if (document.querySelector('script[src*="/_next/"]')) return;
    var btn = document.querySelector('.site-header .menu-button');
    var nav = document.querySelector('.site-header nav');
    if (btn && nav && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }
})();
