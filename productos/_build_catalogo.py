#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Construye productos/catalogo.js a partir de las paginas de categoria ya
existentes en sitio/productos/<categoria>/index.html.

NO inventa datos: nombre, foto (img), badge, caso de uso y enlace salen tal
cual del HTML actual. La subcategoria se toma del badge <span> de cada tarjeta
(texto real). El enlace "ver ficha" se resuelve a un archivo que EXISTE:
  - /producto/<slug>        si existe producto/<slug>/index.html (hoy son 3)
  - /productos/<categoria>  (la pagina de categoria, que siempre existe) si no.

Salida: window.PITUCHE_CATEGORIAS y window.PITUCHE_CATALOGO como .js global
(no JSON) para que funcione abriendo el .html directo con file://.
"""
import os
import re
import json

BASE = os.path.dirname(os.path.abspath(__file__))          # .../sitio/productos
SITIO = os.path.dirname(BASE)                              # .../sitio

# Orden + etiqueta + emoji EXACTOS como aparecen en las category-tabs del sitio.
CATEGORIAS = [
    ("vasos",              "Vasos",              "\U0001F964"),   # 🥤
    ("platos-y-charolas",  "Platos y charolas",  "\U0001F37D️"),  # 🍽️
    ("cubiertos",          "Cubiertos",          "\U0001F374"),   # 🍴
    ("contenedores",       "Contenedores",       "\U0001F961"),   # 🥡
    ("envases",            "Envases",            "\U0001F372"),   # 🍲
    ("pasteleria",         "Pastelería",         "\U0001F382"),   # 🎂
    ("bolsas-de-papel",    "Bolsas de papel",    "\U0001F6CD️"),  # 🛍️
    ("aluminio",           "Aluminio",           "♨️"),  # ♨️
    ("ensaladeras",        "Ensaladeras",        "\U0001F957"),   # 🥗
    ("complementos",       "Complementos",       "\U0001F9FB"),   # 🧻
]

# Estructura minificada de cada tarjeta:
# <article class="product-card"><a class="product-photo" href="HREF">
#   <img src="IMG" alt="ALT"/><span>BADGE</span></a><p>USO</p>
#   <h3><a href="...">NOMBRE</a></h3><small>PRES</small>...
CARD_RE = re.compile(
    r'<article class="product-card">.*?'
    r'class="product-photo" href="([^"]+)">'
    r'<img src="([^"]+)" alt="([^"]*)"/>'
    r'<span>([^<]*)</span></a>'
    r'<p>([^<]*)</p>'
    r'<h3><a href="[^"]*">([^<]*)</a></h3>'
    r'<small>([^<]*)</small>',
    re.DOTALL,
)


def ficha_existe(slug):
    # Las fichas reales viven en sitio/producto/<slug>/index.html (singular),
    # carpeta HERMANA de productos/ (plural). Hoy solo existen 3.
    return os.path.isfile(os.path.join(SITIO, "producto", slug, "index.html"))


def limpiar(txt):
    # Los HTML traen comentarios de hidratacion de Next (<!-- -->) intercalados.
    txt = txt.replace("<!-- -->", "").replace("<!--", "").replace("-->", "")
    return re.sub(r"\s+", " ", txt).strip()


def main():
    catalogo = []
    resumen = []
    for slug, nombre_cat, emoji in CATEGORIAS:
        path = os.path.join(BASE, slug, "index.html")
        if not os.path.isfile(path):
            resumen.append((slug, 0))
            continue
        html = open(path, encoding="utf-8").read()
        cards = CARD_RE.findall(html)
        for href, img, alt, badge, uso, nombre, pres in cards:
            prod_slug = href.rstrip("/").split("/producto/")[-1]
            real = ficha_existe(prod_slug)
            ficha = ("/producto/" + prod_slug) if real else ("/productos/" + slug)
            catalogo.append({
                "categoria": slug,
                "categoriaNombre": nombre_cat,
                "subcategoria": limpiar(badge) or nombre_cat,
                "nombre": limpiar(nombre),
                "uso": limpiar(uso),
                "presentaciones": limpiar(pres),
                "img": img,
                "href": ficha,             # SIEMPRE apunta a un archivo que existe
                "hrefOriginal": href,      # link tal cual del sitio (referencia)
                "fichaReal": real,
            })
        resumen.append((slug, len(cards)))

    cats_js = [{"slug": s, "nombre": n, "emoji": e} for (s, n, e) in CATEGORIAS]

    out = os.path.join(BASE, "catalogo.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* GENERADO por _build_catalogo.py -- NO editar a mano.\n")
        f.write("   Datos extraidos de productos/<categoria>/index.html del propio sitio. */\n")
        f.write("window.PITUCHE_CATEGORIAS = " + json.dumps(cats_js, ensure_ascii=False, indent=2) + ";\n")
        f.write("window.PITUCHE_CATALOGO = " + json.dumps(catalogo, ensure_ascii=False, indent=2) + ";\n")

    # Reporte a stdout
    print("Categoria            Productos")
    print("-" * 34)
    total = 0
    for slug, n in resumen:
        total += n
        print("%-20s %d" % (slug, n))
    print("-" * 34)
    print("%-20s %d" % ("TOTAL", total))
    reales = sum(1 for p in catalogo if p["fichaReal"])
    print("\nFichas con archivo real: %d de %d (resto resuelve a su pagina de categoria)" % (reales, total))
    print("Escrito: %s" % out)


if __name__ == "__main__":
    main()
