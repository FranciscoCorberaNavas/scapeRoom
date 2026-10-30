/* ==========================================================================
   LA WEB ROTA · Escape room de CSS
   Contenido del juego: preguntas, retos y textos.
   Si quieres cambiar una pregunta o un reto, este es el archivo que tocar.
   ========================================================================== */

/* Respuestas ligeramente ofuscadas para que no se lean a simple vista.
   (Un alumno de DAW con las DevTools podría sacarlas: véase el README). */
const SECRETOS = "==QfiIzdhRWLzN3YtIXZsxWY0JiOiwWYzJCLdJyUiwiIBJCLiAlIsISQiwiIDJyW6IychJHdlxmIs0lIFVVUPxkQiwiITFEUBNkIsISQEF0QTF0QislOiMXY6VWawJCLdBDLywSMbpjIj1UblJmIs0FMsEDLwwSMsADLxwCMsEDLwwSMbpjIzVGbnd2bU1WZiJCLdJDLxwiMbpjIj1WMwJye";

/* --------------------------------------------------------------------------
   PRUEBA 1 · SELECTORES
   tipo "clic": el equipo marca los elementos que selecciona el selector.
               La corrección se hace con querySelectorAll real, así que
               basta con cambiar el HTML o el selector para crear otra.
   tipo "test": pregunta de opción múltiple (respuestas en SECRETOS.p1mc).
   -------------------------------------------------------------------------- */
const HTML_NAV = `
<header>
  <nav>
    <a href="/">Inicio</a>
    <ul>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/contacto">Contacto</a></li>
    </ul>
    <a href="/login">Entrar</a>
  </nav>
</header>
<footer>
  <a href="/aviso-legal">Aviso legal</a>
</footer>`;

const HTML_ARTICULO = `
<article>
  <h2>Título</h2>
  <p>Entradilla</p>
  <p>Párrafo 1</p>
  <div class="aviso">Aviso</div>
  <p>Párrafo 2</p>
  <h2>Otro título</h2>
  <p>Párrafo 3</p>
</article>`;

const HTML_DESTACADO = `
<section class="destacado">
  <p>Texto normal</p>
  <p class="destacado">Texto importante</p>
  <span class="destacado">Etiqueta</span>
  <div class="destacado">
    <p>Dentro del div</p>
  </div>
</section>`;

const HTML_ENLACES = `
<ul class="enlaces">
  <li><a href="https://developer.mozilla.org">MDN</a></li>
  <li><a href="http://web-antigua.es">Web antigua</a></li>
  <li><a href="/apuntes">Apuntes</a></li>
  <li><a href="https://www.w3.org" target="_blank">W3C</a></li>
  <li><a href="mailto:profe@instituto.es">Correo</a></li>
</ul>`;

const HTML_MENU = `
<ul class="menu">
  <li class="activo">Inicio</li>
  <li>Ciclos
    <ul>
      <li>DAW</li>
      <li>DAM</li>
    </ul>
  </li>
  <li>Contacto</li>
</ul>`;

const PRUEBA1 = [
  { tipo: "clic", selector: "nav a", html: HTML_NAV,
    explicacion: "El espacio es el combinador DESCENDIENTE: selecciona los <a> que estén dentro de <nav> a cualquier profundidad (también los de la lista). El del <footer> no está dentro de <nav>." },
  { tipo: "clic", selector: "nav > a", html: HTML_NAV,
    explicacion: "El > es el combinador HIJO DIRECTO: solo los <a> cuyo padre inmediato es <nav>. Los de la lista tienen como padre un <li>." },
  { tipo: "clic", selector: "h2 + p", html: HTML_ARTICULO,
    explicacion: "El + es el HERMANO ADYACENTE: el <p> que va justo después de un <h2>, con el mismo padre. Solo hay dos: «Entradilla» y «Párrafo 3»." },
  { tipo: "clic", selector: "h2 ~ p", html: HTML_ARTICULO,
    explicacion: "El ~ es el HERMANO GENERAL: todos los <p> que vienen después de un <h2> en el mismo padre, aunque haya otros elementos en medio. Aquí son los cuatro." },
  { tipo: "clic", selector: "p.destacado", html: HTML_DESTACADO,
    explicacion: "Sin espacio, p.destacado es un selector COMPUESTO: un mismo elemento que es <p> Y tiene la clase destacado. Solo hay uno." },
  { tipo: "clic", selector: ".destacado p", html: HTML_DESTACADO,
    explicacion: "Con espacio es DESCENDIENTE: cualquier <p> dentro de algo con clase destacado. Como la <section> ya es .destacado, entran los tres <p>." },
  { tipo: "clic", selector: 'a[href^="https"]', html: HTML_ENLACES,
    explicacion: "[atributo^=\"valor\"] selecciona los elementos cuyo atributo EMPIEZA por ese valor. Solo dos enlaces empiezan por https (el de http no cuenta)." },
  { tipo: "clic", selector: "li:first-child", html: HTML_MENU,
    explicacion: ":first-child selecciona cualquier <li> que sea el primer hijo de SU padre. Por eso también entra «DAW», el primero de la lista anidada." },

  { tipo: "test",
    enunciado: "¿De qué color se ve el texto «Hola»?",
    html: `<p id="intro" class="texto">Hola</p>`,
    css: `#intro { color: blue; }\n.texto { color: green; }\np      { color: red; }`,
    opciones: ["Rojo, porque es la última regla", "Verde", "Azul", "Negro (ninguna se aplica)"],
    explicacion: "Gana la regla más ESPECÍFICA, no la última: #intro (1,0,0) supera a .texto (0,1,0) y a p (0,0,1). El orden solo decide cuando hay empate." },
  { tipo: "test",
    enunciado: "¿De qué color se ve el texto «Hola»?",
    html: `<div class="caja">\n  <p class="nota">Hola</p>\n</div>`,
    css: `.caja p { color: orange; }\np.nota  { color: purple; }\ndiv p   { color: gray; }`,
    opciones: ["Naranja", "Morado", "Gris, porque es la última regla"],
    explicacion: ".caja p y p.nota empatan con (0,1,1); en un empate gana la que aparece DESPUÉS: p.nota (morado). div p es (0,0,2), menos específica, aunque sea la última." },
  { tipo: "test",
    enunciado: "¿Cuál es la especificidad de este selector?",
    css: `#menu .item > a:hover`,
    opciones: ["(1, 1, 1)", "(0, 3, 1)", "(1, 2, 1)", "(1, 2, 2)"],
    explicacion: "Un id (#menu) → 1. Clases y pseudoclases (.item y :hover) → 2. Etiquetas (a) → 1. Los combinadores como > no suman nada." }
];

/* --------------------------------------------------------------------------
   PRUEBA 2 · POSITION
   Cada reto se carga en un iframe. El CSS de la página es fijo y el equipo
   solo escribe su propio CSS. La función "comprobar" mide la escena real
   (posiciones en píxeles, qué elemento queda encima…) y devuelve una lista
   de criterios cumplidos o no.
   -------------------------------------------------------------------------- */
const CSS_COMUN = `
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f4f1ea;color:#222;font-size:15px}
`;

const PARRAFOS = (n, desde = 1) => Array.from({ length: n }, (_, i) =>
  `  <p class="contenido__texto">Párrafo ${desde + i}. Texto de relleno para que la página tenga scroll y se pueda comprobar cómo se comportan los elementos al desplazarse.</p>`
).join("\n");

const PRUEBA2 = [
  {
    titulo: "La etiqueta perdida",
    mision: "La etiqueta <b>¡Oferta!</b> debe quedar en la <b>esquina superior derecha de la tarjeta</b> (puede sobresalir un poco del borde).",
    html: `<main class="escaparate">
  <article class="tarjeta">
    <div class="tarjeta__imagen">👟</div>
    <h3 class="tarjeta__titulo">Zapatillas Run</h3>
    <p class="tarjeta__precio">49,90 €</p>
    <span class="tarjeta__etiqueta">¡Oferta!</span>
  </article>
</main>`,
    css: `.escaparate { padding: 28px 48px; }
.tarjeta { width: 220px; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 4px 14px rgba(0,0,0,.12); }
.tarjeta__imagen { height: 90px; background: #ffe9a8; border-radius: 8px; text-align: center; font-size: 48px; line-height: 90px; }
.tarjeta__titulo { margin: 12px 0 4px; }
.tarjeta__precio { margin: 0; font-weight: 700; }
.tarjeta__etiqueta { background: #e63946; color: #fff; font-weight: 700; padding: 4px 10px; border-radius: 999px; font-size: 13px; }`,
    inicial: `/* Coloca la etiqueta en la esquina superior derecha de la tarjeta */

.tarjeta {

}

.tarjeta__etiqueta {

}
`,
    pista: "La etiqueta tiene que salir del flujo con position: absolute. Pero ¿respecto a qué se coloca? Se coloca respecto a su antepasado POSICIONADO más cercano… y ahora mismo no hay ninguno.",
    comprobar(doc, win) {
      const t = doc.querySelector(".tarjeta"), e = doc.querySelector(".tarjeta__etiqueta");
      const cs = (el) => win.getComputedStyle(el);
      const rt = t.getBoundingClientRect(), re = e.getBoundingClientRect();
      return [
        { ok: cs(e).position === "absolute", txt: "La etiqueta está fuera del flujo (position: absolute)" },
        { ok: cs(t).position !== "static", txt: "La tarjeta es la referencia de posicionamiento (no es static)" },
        { ok: Math.abs(re.top - rt.top) <= 16 && Math.abs(re.right - rt.right) <= 16, txt: "La etiqueta está en la esquina superior derecha de la tarjeta (±16px)" }
      ];
    }
  },
  {
    titulo: "La cabecera fugitiva",
    mision: "La <b>cabecera</b> debe quedarse <b>siempre visible arriba</b> al hacer scroll, <b>sin tapar el contenido</b> al principio y <b>sin que nada pase por encima</b> de ella.",
    html: `<header class="cabecera">🛠️ Taller Web · DAW2</header>
<main class="contenido">
${PARRAFOS(3)}
  <div class="contenido__aviso">⚠️ Aviso importante (este bloque tiene position: relative)</div>
${PARRAFOS(9, 4)}
</main>`,
    css: `.cabecera { background: #1d3557; color: #fff; padding: 14px 20px; font-weight: 700; }
.contenido { padding: 16px 20px; }
.contenido__texto { margin: 0 0 14px; line-height: 1.5; }
.contenido__aviso { position: relative; background: #ffd23f; padding: 16px; border-radius: 8px; margin-bottom: 14px; font-weight: 600; }`,
    inicial: `/* La cabecera debe quedarse siempre visible arriba al hacer scroll */

.cabecera {

}
`,
    pista: "position: sticky necesita un valor de top para saber dónde «pegarse». Y si al hacer scroll el aviso amarillo pasa por ENCIMA de la cabecera… mira qué tiene ese aviso en el CSS de la página.",
    comprobar(doc, win) {
      const h = doc.querySelector(".cabecera"), p = doc.querySelector(".contenido__texto"), a = doc.querySelector(".contenido__aviso");
      const pos = win.getComputedStyle(h).position;
      win.scrollTo(0, 0);
      const noTapa = p.getBoundingClientRect().top >= h.getBoundingClientRect().bottom - 1;
      // Bajamos hasta que el aviso quede justo debajo del borde superior
      const y = a.getBoundingClientRect().top + win.scrollY - 6;
      win.scrollTo(0, y);
      const rh = h.getBoundingClientRect();
      const arriba = Math.abs(rh.top) <= 2 && win.scrollY > 50;
      const ra = a.getBoundingClientRect();
      const px = Math.min(Math.max(ra.left + 40, rh.left + 5), rh.right - 5);
      const encima = doc.elementFromPoint(px, rh.top + rh.height / 2);
      const nadaEncima = !!encima && h.contains(encima);
      win.scrollTo(0, 0);
      return [
        { ok: pos === "sticky" || pos === "fixed", txt: "La cabecera usa un posicionamiento que la mantiene visible" },
        { ok: arriba, txt: "Al hacer scroll la cabecera sigue pegada arriba" },
        { ok: noTapa, txt: "Al principio la cabecera no tapa el primer párrafo" },
        { ok: nadaEncima, txt: "Al hacer scroll el aviso amarillo pasa POR DEBAJO de la cabecera" }
      ];
    }
  },
  {
    titulo: "El botón que se escapa",
    mision: "El botón <b>↑</b> debe quedarse <b>fijo en la esquina inferior derecha de la pantalla</b> (a 40px o menos de los bordes), también al hacer scroll.",
    html: `<main class="contenido">
${PARRAFOS(4)}
  <a href="#" class="boton-subir" title="Volver arriba">↑</a>
${PARRAFOS(8, 5)}
</main>`,
    css: `.contenido { padding: 16px 20px; }
.contenido__texto { margin: 0 0 14px; line-height: 1.5; }
.boton-subir { display: block; width: 48px; height: 48px; border-radius: 50%; background: #e63946; color: #fff; text-align: center; line-height: 48px; font-size: 22px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,.3); }`,
    inicial: `/* El botón debe quedarse fijo abajo a la derecha aunque hagas scroll */

.boton-subir {

}
`,
    pista: "Hay un valor de position que coloca el elemento respecto a la VENTANA y no respecto a la página, así que no se mueve con el scroll. Después solo te falta bottom y right.",
    comprobar(doc, win) {
      const b = doc.querySelector(".boton-subir"), de = doc.documentElement;
      const enEsquina = () => {
        const r = b.getBoundingClientRect(), dx = de.clientWidth - r.right, dy = de.clientHeight - r.bottom;
        return dx >= 0 && dx <= 40 && dy >= 0 && dy <= 40;
      };
      win.scrollTo(0, 0);
      const a = enEsquina();
      win.scrollTo(0, 450);
      const bajado = win.scrollY > 100, c = enEsquina();
      win.scrollTo(0, 0);
      return [
        { ok: win.getComputedStyle(b).position === "fixed", txt: "El botón se posiciona respecto a la ventana" },
        { ok: a, txt: "Está en la esquina inferior derecha (a 40px o menos de los bordes)" },
        { ok: bajado && c, txt: "Sigue en la esquina después de hacer scroll" }
      ];
    }
  },
  {
    titulo: "El modal rebelde",
    mision: "La capa oscura debe <b>tapar toda la pantalla, incluida la cabecera</b>, también al hacer scroll, y la caja blanca debe quedar <b>centrada</b>. ¡Sin flex ni grid!",
    html: `<header class="cabecera">🛠️ Taller Web · DAW2</header>
<main class="contenido">
${PARRAFOS(10)}
</main>
<div class="modal">
  <div class="modal__caja">
    <h2 class="modal__titulo">¡Atención!</h2>
    <p class="modal__texto">Este aviso debe tapar toda la página y quedar centrado.</p>
  </div>
</div>`,
    css: `.cabecera { position: relative; z-index: 10; background: #1d3557; color: #fff; padding: 14px 20px; font-weight: 700; }
.contenido { padding: 16px 20px; }
.contenido__texto { margin: 0 0 14px; line-height: 1.5; }
.modal { background: rgba(20, 20, 30, .75); }
.modal__caja { width: 260px; background: #fff; padding: 18px; border-radius: 12px; }
.modal__titulo { margin: 0 0 8px; }
.modal__texto { margin: 0; }`,
    inicial: `/* 1) La capa oscura tapa TODA la pantalla (también la cabecera y al hacer scroll) */

.modal {

}

/* 2) La caja blanca queda centrada en la pantalla (sin flex ni grid) */

.modal__caja {

}
`,
    pista: "Capa: position: fixed con top, right, bottom y left a 0 (o inset: 0). La cabecera tiene z-index: 10… Caja: position: absolute, top y left al 50% y luego transform: translate(-50%, -50%).",
    comprobar(doc, win) {
      const m = doc.querySelector(".modal"), c = doc.querySelector(".modal__caja"), h = doc.querySelector(".cabecera"), de = doc.documentElement;
      const vw = de.clientWidth, vh = de.clientHeight;
      const tapa = () => {
        const r = m.getBoundingClientRect();
        return r.left <= 1 && r.top <= 1 && r.right >= vw - 1 && r.bottom >= vh - 1;
      };
      win.scrollTo(0, 0);
      const t1 = tapa();
      const rh = h.getBoundingClientRect();
      const encima = doc.elementFromPoint(12, rh.top + rh.height / 2);
      const sobreCabecera = !!encima && m.contains(encima);
      const rc = c.getBoundingClientRect();
      const centrada = Math.abs((rc.left + rc.right) / 2 - vw / 2) <= 12 && Math.abs((rc.top + rc.bottom) / 2 - vh / 2) <= 12;
      win.scrollTo(0, 400);
      const bajado = win.scrollY > 100, t2 = tapa();
      win.scrollTo(0, 0);
      return [
        { ok: t1, txt: "La capa oscura ocupa toda la pantalla" },
        { ok: bajado && t2, txt: "Sigue tapando toda la pantalla al hacer scroll" },
        { ok: sobreCabecera, txt: "La capa queda POR ENCIMA de la cabecera" },
        { ok: centrada, txt: "La caja blanca está centrada en horizontal y en vertical (±12px)" }
      ];
    }
  },
  {
    titulo: "El submenú enterrado",
    mision: "El submenú debe aparecer <b>justo debajo de «Productos»</b> y alineado a su izquierda, <b>sin empujar el banner</b> y <b>por encima de él</b>.",
    html: `<nav class="menu">
  <ul class="menu__lista">
    <li class="menu__item">Inicio</li>
    <li class="menu__item menu__item--desplegable">Productos ▾
      <ul class="submenu">
        <li class="submenu__item">Portátiles</li>
        <li class="submenu__item">Monitores</li>
        <li class="submenu__item">Teclados</li>
      </ul>
    </li>
    <li class="menu__item">Contacto</li>
  </ul>
</nav>
<section class="banner">🔥 Black Friday: hasta −50 %</section>`,
    css: `.menu { background: #1d3557; padding: 0 12px; }
.menu__lista { list-style: none; margin: 0; padding: 0; }
.menu__item { display: inline-block; vertical-align: top; color: #fff; padding: 14px 16px; font-weight: 600; }
.menu__item--desplegable { background: #274a75; }
.submenu { list-style: none; margin: 0; padding: 6px 0; width: 170px; background: #fff; border-radius: 0 0 8px 8px; box-shadow: 0 6px 16px rgba(0,0,0,.25); }
.submenu__item { color: #222; padding: 8px 14px; font-weight: 400; }
.banner { position: relative; z-index: 2; margin: 8px 20px; padding: 44px 20px; background: #e63946; color: #fff; font-size: 22px; font-weight: 800; border-radius: 12px; }`,
    inicial: `/* El submenú aparece justo debajo de "Productos", alineado a su izquierda,
   sin empujar el banner y POR ENCIMA de él */

.menu__item--desplegable {

}

.submenu {

}
`,
    pista: "Con position: absolute el submenú deja de empujar el banner. Su referencia debe ser el <li> de Productos (que tendrá que estar posicionado). Y ojo: el banner tiene position: relative y z-index: 2.",
    comprobar(doc, win) {
      const li = doc.querySelector(".menu__item--desplegable"), s = doc.querySelector(".submenu"), b = doc.querySelector(".banner");
      const rs = s.getBoundingClientRect(), rl = li.getBoundingClientRect();
      const topConMenu = b.getBoundingClientRect().top;
      const antes = s.style.display; s.style.display = "none";
      const topSinMenu = b.getBoundingClientRect().top;
      s.style.display = antes;
      const rb = b.getBoundingClientRect();
      const x1 = Math.max(rs.left, rb.left), x2 = Math.min(rs.right, rb.right);
      const y1 = Math.max(rs.top, rb.top), y2 = Math.min(rs.bottom, rb.bottom);
      let encima = false;
      if (x2 - x1 > 4 && y2 - y1 > 4) {
        const el = doc.elementFromPoint((x1 + x2) / 2, (y1 + y2) / 2);
        encima = !!el && s.contains(el);
      }
      return [
        { ok: win.getComputedStyle(s).position === "absolute", txt: "El submenú está fuera del flujo" },
        { ok: Math.abs(topConMenu - topSinMenu) <= 1, txt: "El submenú no empuja el banner hacia abajo" },
        { ok: Math.abs(rs.top - rl.bottom) <= 6 && Math.abs(rs.left - rl.left) <= 6, txt: "Aparece justo debajo de «Productos» y alineado a su izquierda (±6px)" },
        { ok: encima, txt: "El submenú queda POR ENCIMA del banner" }
      ];
    }
  }
];

/* --------------------------------------------------------------------------
   PRUEBA 3 · BEM
   -------------------------------------------------------------------------- */
const BEM_NOMBRES = [
  { clase: "tarjeta__titulo",               por: "✔ Elemento «titulo» del bloque «tarjeta»." },
  { clase: "tarjeta__cabecera__titulo",     por: "✘ No se encadenan elementos. El título pertenece al bloque: tarjeta__titulo." },
  { clase: "boton--grande",                 por: "✔ Modificador del bloque «boton». En el HTML irá junto a la clase base: class=\"boton boton--grande\"." },
  { clase: "Menu_Item",                     por: "✘ Mayúsculas y un solo guion bajo. Lo correcto es menu__item." },
  { clase: "formulario__campo--error",      por: "✔ Elemento «campo» del bloque «formulario» con el modificador «error»." },
  { clase: "tarjeta--destacada__titulo",    por: "✘ El modificador va siempre al final. El bloque lleva tarjeta--destacada y el título, tarjeta__titulo." },
  { clase: "buscador__input--deshabilitado", por: "✔ Bloque, elemento y modificador en el orden correcto." },
  { clase: "cabecera__nav__enlace",         por: "✘ Elemento de un elemento. Sería cabecera__enlace (o convertir nav en su propio bloque: nav__enlace)." },
  { clase: "lista-tareas__item",            por: "✔ El guion simple separa palabras dentro de un mismo nombre." },
  { clase: "__titulo",                      por: "✘ Falta el bloque: un elemento no existe fuera de su bloque." }
];

const BEM_TEST = [
  { enunciado: "¿Qué falla en este HTML?",
    codigo: `<button class="boton--grande">Comprar</button>`,
    opciones: ["Nada, es BEM correcto",
               "Falta la clase base: debería ser class=\"boton boton--grande\"",
               "El modificador va con un solo guion: boton-grande",
               "Los modificadores se escriben con __"],
    explicacion: "Un modificador solo AÑADE cambios: los estilos base están en .boton, así que el elemento necesita las dos clases." },
  { enunciado: "¿Dónde puede estar un elemento con la clase tarjeta__titulo?",
    opciones: ["Solo como hijo directo de .tarjeta",
               "En cualquier parte de la página",
               "A cualquier profundidad dentro del bloque .tarjeta",
               "Solo dentro de .tarjeta__cabecera"],
    explicacion: "Un elemento pertenece a su BLOQUE, no a su padre en el HTML: puede estar anidado a cualquier nivel dentro de él. Por eso no hace falta tarjeta__cabecera__titulo." },
  { enunciado: "¿Por qué BEM prefiere .tarjeta__titulo { } a .tarjeta .cabecera h3 { }?",
    opciones: ["Porque mantiene la especificidad baja e igual para todo y no depende de cómo esté anidado el HTML",
               "Porque es más corto de escribir",
               "Porque los selectores descendientes no funcionan en todos los navegadores",
               "Porque BEM prohíbe usar selectores de etiqueta en todo el CSS"],
    explicacion: "Con una sola clase todas las reglas tienen especificidad (0,1,0): no hay guerras de especificidad y puedes cambiar la estructura HTML sin romper los estilos." }
];

const BEM_HTML_ORIGINAL = `<div class="producto destacado">
  <img class="foto" src="auriculares.jpg" alt="Auriculares Pro">
  <div class="info">
    <h3 class="titulo">Auriculares Pro</h3>
    <p class="precio rojo">59 €</p>
  </div>
  <button class="boton-comprar grande">Comprar</button>
</div>`;
