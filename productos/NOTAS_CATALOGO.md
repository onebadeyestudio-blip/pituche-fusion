# Navegador de categorías (estilo Adidas) — /productos

Capa nueva sobre `productos/index.html`: menú lateral IZQUIERDA persistente
(sticky) + panel de resultados DERECHA. Al hacer clic en una categoría NO se
cambia de página: se expanden sus subcategorías (acordeón, misma columna
izquierda) y el panel derecho se llena con sus productos, sin recargar.
En móvil el menú lateral se vuelve una fila de chips horizontales y el panel
queda debajo. El estado vive en el hash de la URL (`#vasos`) para compartir/volver.

## Archivos (todos en `productos/`)
- `_build_catalogo.py` — script de extracción. Lee cada `productos/<categoria>/index.html`
  del propio sitio y genera `catalogo.js`. NO inventa datos: nombre, foto, badge,
  caso de uso y enlace salen tal cual del HTML actual.
- `catalogo.js` — datos **generados** (`window.PITUCHE_CATEGORIAS` + `window.PITUCHE_CATALOGO`).
  Se sirve como `.js` global (no JSON) para que funcione abriendo el `.html` con `file://`.
- `catalogo.css` — estilos propios, namespace `catb-*`, autosuficientes (no dependen
  del CSS de `_next`). Paleta calcada del sitio.
- `catalogo-nav.js` — lógica. Construye el navegador por JS (mejora progresiva) e
  inserta ANTES del `.catalog-shell` original, ocultándolo. Si el JS falla, el índice
  original queda intacto. Reinserta tras la hidratación de Next (que si no, borra el nodo).

## Regenerar los datos
Después de agregar/editar productos en las páginas de categoría:

    cd productos && python3 _build_catalogo.py

## Conteo por categoría (17 productos)
vasos 1 · platos-y-charolas 1 · cubiertos 1 · contenedores 1 · envases 1 ·
pastelería 2 · bolsas-de-papel 1 · aluminio 1 · ensaladeras 1 · complementos 7.

## Reglas respetadas
- No se tocó `_next/` ni CSS con hash compartido. Estilos nuevos = `catalogo.css`.
- Additive-only: no se borró nada; el shell original solo se oculta en runtime.
- Las páginas `productos/<categoria>/` NO se modificaron.
- Sin frameworks/build/servidor: JS puro; funciona con `file://`.
- Los 17 enlaces "Ver detalles" apuntan a un archivo que existe (ficha real en
  `producto/<slug>/` cuando existe —hoy 3—, si no, la página de su categoría).

## QC hecho
Capturas antes/después a 1440 y 390 en `../_qc_categorias/` (scratch, sin versionar).
Verificado: hero/tabs/footer sin cambios; 3 categorías distintas llenan el panel con
productos reales y distintos (Vasos 1, Complementos 7, Pastelería 2); ningún clic
navega fuera; `file://` renderiza las 17 tarjetas usando el JS global.
