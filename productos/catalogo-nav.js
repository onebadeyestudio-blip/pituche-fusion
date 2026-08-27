/* ============================================================
   Navegador de categorias estilo Adidas (Pituche).
   Mejora progresiva: construye la UI por JS e inserta ANTES del
   .catalog-shell existente, ocultandolo. Si algo falla, el indice
   original queda intacto (no se borra nada del HTML).
   Datos: window.PITUCHE_CATEGORIAS / window.PITUCHE_CATALOGO (catalogo.js).
   ============================================================ */
(function () {
  "use strict";

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function init() {
    if (document.getElementById("catb")) return; // ya construido: no duplicar
    var CATS = window.PITUCHE_CATEGORIAS;
    var ITEMS = window.PITUCHE_CATALOGO;
    if (!CATS || !ITEMS || !CATS.length || !ITEMS.length) return;

    var legacy = document.querySelector(".catalog-shell");
    var host = (legacy && legacy.parentNode) || document.querySelector("main") || document.body;

    // --- indices ---
    var byCat = {};
    CATS.forEach(function (c) { byCat[c.slug] = []; });
    ITEMS.forEach(function (p) { (byCat[p.categoria] || (byCat[p.categoria] = [])).push(p); });

    function nameOf(slug) {
      for (var i = 0; i < CATS.length; i++) if (CATS[i].slug === slug) return CATS[i].nombre;
      return slug;
    }
    function subsOf(slug) {
      var seen = {}, order = [];
      (byCat[slug] || []).forEach(function (p) {
        var s = p.subcategoria || nameOf(slug);
        if (!(s in seen)) { seen[s] = 0; order.push(s); }
        seen[s]++;
      });
      return order.map(function (n) { return { name: n, count: seen[n] }; });
    }

    var state = { cat: null, sub: null };  // cat null => primer render siempre ocurre

    // ================= construccion de la UI =================
    var section = el("section", "catb");
    section.id = "catb";

    var head = el("div", "catb-head");
    head.appendChild(el("p", "catb-eyebrow", "EXPLORA POR CATEGORÍA"));
    head.appendChild(el("h2", null, "Encuentra tu producto sin cambiar de página"));
    head.appendChild(el("p", "catb-sub", "Elige una categoría en el menú; los productos aparecen aquí mismo, sin recargar."));
    section.appendChild(head);

    // chips (movil)
    var chips = el("div", "catb-chips");
    chips.setAttribute("role", "tablist");
    var subchips = el("div", "catb-subchips");
    subchips.hidden = true;
    section.appendChild(chips);
    section.appendChild(subchips);

    // shell
    var shell = el("div", "catb-shell");
    var rail = el("aside", "catb-rail");
    rail.setAttribute("aria-label", "Categorías");
    rail.appendChild(el("div", "catb-rail-title", "Categorías"));

    // boton "Todos"
    var allBtn = el("button", "catb-all");
    allBtn.type = "button";
    allBtn.setAttribute("data-cat", "__all");
    allBtn.appendChild(el("span", "catb-cat-label", "Todos los productos"));
    allBtn.appendChild(el("span", "catb-count", String(ITEMS.length)));
    allBtn.addEventListener("click", function () { selectCategory("__all", false, true); });
    rail.appendChild(allBtn);

    // categorias + subcategorias
    CATS.forEach(function (c) {
      var list = byCat[c.slug] || [];
      var wrap = el("div", "catb-cat");
      wrap.setAttribute("data-cat", c.slug);

      var head2 = el("button", "catb-cat-head");
      head2.type = "button";
      head2.setAttribute("aria-expanded", "false");
      head2.appendChild(el("span", "catb-cat-emoji", c.emoji));
      head2.appendChild(el("span", "catb-cat-label", c.nombre));
      head2.appendChild(el("span", "catb-count", String(list.length)));
      head2.appendChild(el("span", "catb-caret", "▸")); // ▸
      head2.addEventListener("click", function () { selectCategory(c.slug, false, true); });
      wrap.appendChild(head2);

      var subsBox = el("div", "catb-subs");
      subsBox.hidden = true;
      subsOf(c.slug).forEach(function (s) {
        var sb = el("button", "catb-sub");
        sb.type = "button";
        sb.setAttribute("data-sub", s.name);
        sb.appendChild(el("span", null, s.name));
        sb.appendChild(el("span", "catb-subcount", String(s.count)));
        sb.addEventListener("click", function (ev) {
          ev.stopPropagation();
          if (state.sub === s.name) selectSub(c.slug, null);   // toggle => quitar filtro
          else selectSub(c.slug, s.name);
        });
        subsBox.appendChild(sb);
      });
      wrap.appendChild(subsBox);
      rail.appendChild(wrap);
    });

    var help = el("a", "catb-help");
    help.href = "/armar-pedido";
    help.innerHTML = "¿No sabes cuál elegir? <b>Te ayudamos →</b>";
    rail.appendChild(help);

    shell.appendChild(rail);

    // panel
    var panel = el("div", "catb-panel");
    var phead = el("div", "catb-panel-head");
    var titleEl = el("b", null, "Todos los productos");
    titleEl.id = "catb-title";
    var countEl = el("span", null, "");
    countEl.id = "catb-count";
    phead.appendChild(titleEl);
    phead.appendChild(countEl);
    panel.appendChild(phead);
    var grid = el("div", "catb-grid");
    grid.id = "catb-grid";
    panel.appendChild(grid);
    shell.appendChild(panel);

    section.appendChild(shell);

    // chips de categoria (movil): Todos + cada categoria
    var allChip = el("button", "catb-chip");
    allChip.type = "button";
    allChip.setAttribute("data-cat", "__all");
    allChip.appendChild(el("span", null, "Todos"));
    allChip.addEventListener("click", function () { selectCategory("__all", false, true); });
    chips.appendChild(allChip);
    CATS.forEach(function (c) {
      var ch = el("button", "catb-chip");
      ch.type = "button";
      ch.setAttribute("data-cat", c.slug);
      ch.appendChild(el("span", "catb-cat-emoji", c.emoji));
      ch.appendChild(el("span", null, c.nombre));
      ch.addEventListener("click", function () { selectCategory(c.slug, false, true); });
      chips.appendChild(ch);
    });

    // insertar y ocultar el shell viejo (mejora progresiva)
    host.insertBefore ? host.insertBefore(section, legacy || null) : host.appendChild(section);
    if (legacy) legacy.style.display = "none";

    // ================= render =================
    function card(p) {
      var art = el("article", "catb-card");
      var a = el("a", "catb-photo");
      a.href = p.href;
      var img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = p.img;
      img.alt = p.nombre;
      a.appendChild(img);
      if (p.subcategoria) a.appendChild(el("span", "catb-badge", p.subcategoria));
      art.appendChild(a);

      if (p.uso) art.appendChild(el("p", "catb-uso", p.uso));
      var h = el("h3", "catb-name");
      var ha = el("a", null, p.nombre);
      ha.href = p.href;
      h.appendChild(ha);
      art.appendChild(h);
      if (p.presentaciones) art.appendChild(el("small", "catb-pres", p.presentaciones));

      var acts = el("div", "catb-actions");
      var ver = el("a", "catb-ver", "Ver detalles");
      ver.href = p.href;
      acts.appendChild(ver);
      var slug = (p.hrefOriginal || p.href || "").split("/producto/").pop().replace(/\/+$/, "");
      var add = el("a", "catb-add", "Agregar +");
      add.href = "/armar-pedido?producto=" + slug;
      acts.appendChild(add);
      art.appendChild(acts);
      return art;
    }

    function renderPanel() {
      var slug = state.cat;
      var items = (slug === "__all" || !slug) ? ITEMS.slice() : (byCat[slug] || []).slice();
      if (state.sub) items = items.filter(function (p) { return p.subcategoria === state.sub; });

      var t = (slug === "__all" || !slug) ? "Todos los productos" : nameOf(slug);
      if (state.sub) t += " · " + state.sub;
      titleEl.textContent = t;
      countEl.textContent = items.length === 1 ? "1 producto" : items.length + " productos";

      grid.textContent = "";
      var frag = document.createDocumentFragment();
      items.forEach(function (p) { frag.appendChild(card(p)); });
      grid.appendChild(frag);
    }

    function renderSubchips(slug) {
      subchips.textContent = "";
      if (slug === "__all" || !slug) { subchips.hidden = true; return; }
      var subs = subsOf(slug);
      var all = el("button", "catb-subchip");
      all.type = "button";
      all.setAttribute("data-sub", "");
      all.textContent = "Todo " + nameOf(slug);
      all.addEventListener("click", function () { selectSub(slug, null); });
      subchips.appendChild(all);
      subs.forEach(function (s) {
        var b = el("button", "catb-subchip");
        b.type = "button";
        b.setAttribute("data-sub", s.name);
        b.textContent = s.name;
        b.addEventListener("click", function () {
          if (state.sub === s.name) selectSub(slug, null);
          else selectSub(slug, s.name);
        });
        subchips.appendChild(b);
      });
      subchips.hidden = false;
    }

    function setActiveCat(slug) {
      allBtn.classList.toggle("is-active", slug === "__all");
      var cats = rail.querySelectorAll(".catb-cat");
      Array.prototype.forEach.call(cats, function (w) {
        var on = w.getAttribute("data-cat") === slug;
        w.classList.toggle("is-active", on);
        w.classList.toggle("is-open", on);
        var subs = w.querySelector(".catb-subs");
        var hd = w.querySelector(".catb-cat-head");
        if (subs) subs.hidden = !on;
        if (hd) hd.setAttribute("aria-expanded", on ? "true" : "false");
      });
      var allChips = chips.querySelectorAll(".catb-chip");
      Array.prototype.forEach.call(allChips, function (ch) {
        ch.classList.toggle("is-active", ch.getAttribute("data-cat") === slug);
      });
    }

    function setActiveSub(name) {
      var railSubs = rail.querySelectorAll(".catb-sub");
      Array.prototype.forEach.call(railSubs, function (b) {
        b.classList.toggle("is-active", name != null && b.getAttribute("data-sub") === name);
      });
      var scs = subchips.querySelectorAll(".catb-subchip");
      Array.prototype.forEach.call(scs, function (b) {
        var v = b.getAttribute("data-sub");
        b.classList.toggle("is-active", (name == null && v === "") || (name != null && v === name));
      });
    }

    function selectSub(slug, name) {
      if (state.cat !== slug) { state.cat = slug; setActiveCat(slug); renderSubchips(slug); }
      state.sub = name;
      setActiveSub(name);
      renderPanel();
    }

    function maybeScroll(userAction) {
      if (userAction && window.matchMedia("(max-width: 760px)").matches) {
        try { phead.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
      }
    }

    function selectCategory(slug, fromHash, userAction) {
      state.cat = slug;
      state.sub = null;
      setActiveCat(slug);
      renderSubchips(slug);
      setActiveSub(null);
      renderPanel();
      maybeScroll(userAction);
      if (!fromHash) {
        var target = (slug !== "__all") ? slug : "";
        var cur = (location.hash || "").replace(/^#/, "");
        if (cur !== target) {
          if (target) location.hash = target;                                   // dispara hashchange
          else history.replaceState(null, "", location.pathname + location.search);
        }
      }
    }

    function applyHash() {
      var h = "";
      try { h = decodeURIComponent((location.hash || "").replace(/^#/, "")).trim(); } catch (e) { h = (location.hash || "").replace(/^#/, ""); }
      var found = false;
      for (var i = 0; i < CATS.length; i++) if (CATS[i].slug === h) { found = true; break; }
      var slug = found ? h : "__all";
      if (state.cat === slug && state.sub == null) return; // ya estamos ahi: evita doble render
      selectCategory(slug, true, false);
    }

    if (window.__catbHash) { try { window.removeEventListener("hashchange", window.__catbHash); } catch (e) {} }
    window.__catbHash = applyHash;
    window.addEventListener("hashchange", applyHash);
    applyHash(); // primer render (respeta #categoria si viene en la URL)
    document.documentElement.setAttribute("data-catb", "ready");
  }

  function boot() {
    try { init(); }
    catch (e) {
      // Si algo falla, deja el indice original visible.
      try {
        var s = document.getElementById("catb");
        if (s && s.parentNode) s.parentNode.removeChild(s);
        var legacy = document.querySelector(".catalog-shell");
        if (legacy) legacy.style.display = "";
      } catch (e2) {}
      try { document.documentElement.setAttribute("data-catb-error", String((e && e.message) || e)); } catch (e3) {}
      if (window.console) console.error("[catalogo-nav] fallo, indice original intacto:", e);
    }
  }

  // Tope de seguridad para no reintentar en bucle si init lanzara error siempre.
  var attempts = 0;
  function ensure() {
    if (document.getElementById("catb")) return true;   // ya presente y estable
    if (attempts++ > 40) return false;
    boot();
    return !!document.getElementById("catb");
  }

  // La hidratacion de Next re-renderiza <main> y puede borrar nodos ajenos.
  // Insertamos varias veces hasta que quede estable y vigilamos con un
  // MutationObserver por si React lo elimina despues de la primera pasada.
  function schedule() {
    [0, 60, 160, 350, 700, 1200, 2000, 3200].forEach(function (d) { setTimeout(ensure, d); });
    window.addEventListener("load", ensure, { once: true });
    try {
      var mo = new MutationObserver(function () {
        if (!document.getElementById("catb")) ensure();
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { try { mo.disconnect(); } catch (e) {} ensure(); }, 6000);
    } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();
