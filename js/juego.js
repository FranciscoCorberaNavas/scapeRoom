/* ==========================================================================
   LA WEB ROTA · Lógica del juego
   El progreso de cada equipo se guarda en el localStorage de su navegador,
   así que si recargan la página no pierden nada.
   ========================================================================== */
"use strict";

const S = JSON.parse(atob(SECRETOS.split("").reverse().join("")));
const CLAVE = "webrota-v1";
const VACIOS = new Set(["img", "br", "hr", "input", "meta", "link"]);
const PROHIBIDO = /flex|grid/i;

/* Puntuación ------------------------------------------------------------- */
const ESCALA_P1 = [10, 6, 3];         // 1.º intento, 2.º, 3.º o más
const ESCALA_BEM_TEST = [5, 3, 1];
const puntosReto = (st) => Math.max(6, 20 - 3 * st.fallos - (st.pista ? 5 : 0));
const puntosBemA = (st) => Math.max(6, 20 - 4 * st.fallos);
const puntosBemB = (st) => Math.max(10, 30 - 4 * st.fallos);
const PUNTOS_SALIDA = 10;
const deEscala = (escala, fallos) => escala[Math.min(fallos, escala.length - 1)];

/* Utilidades ------------------------------------------------------------- */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function resaltarHTML(src) {
  return esc(src).replace(/(&lt;\/?)([a-z0-9]+)((?:\s.*?)?)(\/?&gt;)/gi, (m, a, tag, attrs, c) =>
    `<span class="c-tag">${a}${tag}</span>` +
    attrs.replace(/([a-z-]+)=(&quot;.*?&quot;)/gi, '<span class="c-attr">$1</span>=<span class="c-val">$2</span>') +
    `<span class="c-tag">${c}</span>`);
}

function resaltarCSS(src) {
  return esc(src)
    .replace(/(^|\})(\s*)([^{}]+?)(\s*\{)/g, '$1$2<span class="c-sel">$3</span>$4')
    .replace(/([a-z-]+)(\s*:\s*)([^;{}\n]+);/g, '<span class="c-prop">$1</span>$2<span class="c-val">$3</span>;');
}

function hash(s) {
  let h = 2166136261 >>> 0;
  for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function codigoVerificacion(equipo, puntos, completo) {
  const nombre = equipo.trim().toLowerCase().replace(/\s+/g, " ");
  const firma = (hash(`${nombre}|${puntos}|${completo ? 1 : 0}|${S.sal}`) % 1679616).toString(36).toUpperCase().padStart(4, "0");
  return `${puntos}-${completo ? "F" : "P"}-${firma}`;
}

function aviso(texto, tipo = "ok") {
  const el = document.createElement("div");
  el.className = `aviso aviso--${tipo}`;
  el.innerHTML = texto;
  $("#avisos").append(el);
  setTimeout(() => el.classList.add("aviso--fuera"), 2600);
  setTimeout(() => el.remove(), 3100);
}

/* Estado ----------------------------------------------------------------- */
let E = null;

function estadoNuevo(equipo) {
  return {
    equipo,
    inicio: Date.now(),
    p1: PRUEBA1.map(() => ({ hecho: false, fallos: 0, puntos: 0, sel: [], descartadas: [] })),
    p2: PRUEBA2.map((r) => ({ hecho: false, fallos: 0, pista: false, puntos: 0, css: r.inicial })),
    p3: {
      a: { hecho: false, fallos: 0, puntos: 0, marcas: BEM_NOMBRES.map(() => null) },
      t: BEM_TEST.map(() => ({ hecho: false, fallos: 0, puntos: 0, descartadas: [] })),
      b: { hecho: false, fallos: 0, puntos: 0, html: BEM_HTML_ORIGINAL }
    },
    final: { hecho: false, puntos: 0, fin: null },
    vista: { tab: "p1", p1: 0, p2: 0, p3: "a" }
  };
}

function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) { /* sin almacenamiento: seguimos en memoria */ } }
function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (d && d.equipo && d.p1.length === PRUEBA1.length && d.p2.length === PRUEBA2.length && d.p3.t.length === BEM_TEST.length) return d;
  } catch (e) { /* estado corrupto o inexistente */ }
  return null;
}

const p1Completa = () => E.p1.every((q) => q.hecho);
const p2Completa = () => E.p2.every((r) => r.hecho);
const p3Completa = () => E.p3.a.hecho && E.p3.t.every((q) => q.hecho) && E.p3.b.hecho;
const todasCompletas = () => p1Completa() && p2Completa() && p3Completa();

function total() {
  const suma = (arr) => arr.reduce((t, x) => t + x.puntos, 0);
  return suma(E.p1) + suma(E.p2) + E.p3.a.puntos + suma(E.p3.t) + E.p3.b.puntos + E.final.puntos;
}

/* Barra superior ----------------------------------------------------------- */
function pintarBarra() {
  $("#equipo").textContent = E.equipo;
  $("#puntos").textContent = total();
  const pieza = (txt, ok, titulo) =>
    `<span class="llavero__pieza${ok ? " llavero__pieza--ok" : ""}" title="${titulo}">${txt}</span>`;
  const letras = S.letras.map((l, i) => (E.p2[i].hecho ? l : "·")).join("");
  $("#llavero").innerHTML = `<span class="llavero__icono" aria-hidden="true">🔑</span>` +
    pieza(p1Completa() ? S.piezas[0] : "·······", p1Completa(), "Pieza de la prueba 1") +
    pieza(letras, p2Completa(), "Pieza de la prueba 2 (una letra por reto)") +
    pieza(p3Completa() ? S.piezas[2] : "······", p3Completa(), "Pieza de la prueba 3");
  const marcas = { p1: p1Completa(), p2: p2Completa(), p3: p3Completa(), fin: E.final.hecho };
  $$(".pestanas__boton").forEach((b) => b.classList.toggle("pestanas__boton--hecha", marcas[b.dataset.tab]));
}

function pintarReloj() {
  if (!E) return;
  const ms = (E.final.fin || Date.now()) - E.inicio;
  const s = Math.floor(ms / 1000);
  $("#reloj").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function sumarPuntos(p, texto) {
  pintarBarra();
  aviso(`${texto} <b>+${p} pts</b>`);
}

/* Navegación --------------------------------------------------------------- */
const RENDER = { p1: renderP1, p2: renderP2, p3: renderP3, fin: renderFin };

function irA(tab) {
  E.vista.tab = tab;
  guardar();
  $$(".prueba").forEach((s) => (s.hidden = s.id !== `tab-${tab}`));
  $$(".pestanas__boton").forEach((b) => b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false"));
  RENDER[tab]();
  window.scrollTo({ top: 0 });
}

function cabecera(etiqueta, titulo, extra = "") {
  return `<div class="prueba__cabecera">
    <div><p class="prueba__etiqueta">${etiqueta}</p><h2 class="prueba__titulo">${titulo}</h2></div>
    ${extra}
  </div>`;
}

function bannerPieza(texto) {
  return `<div class="pieza-ganada"><span>🔑 Pieza conseguida</span><b>${texto}</b></div>`;
}

/* Pregunta de opción múltiple (se usa en la prueba 1 y en la 3) ------------- */
function pintarTest(cont, q, st, correcta, escala, alAcertar) {
  const valor = deEscala(escala, st.fallos);
  cont.innerHTML = `
    <p class="pregunta__enunciado">${q.enunciado}</p>
    ${q.html ? `<p class="pregunta__rotulo">HTML</p><pre class="codigo">${resaltarHTML(q.html)}</pre>` : ""}
    ${q.css ? `<p class="pregunta__rotulo">CSS</p><pre class="codigo">${resaltarCSS(q.css)}</pre>` : ""}
    ${q.codigo ? `<pre class="codigo">${resaltarHTML(q.codigo)}</pre>` : ""}
    <div class="opciones">
      ${q.opciones.map((o, j) => {
        const mal = st.descartadas.includes(j), bien = st.hecho && j === correcta;
        return `<button class="opcion${mal ? " opcion--mal" : ""}${bien ? " opcion--bien" : ""}" data-j="${j}" ${mal || st.hecho ? "disabled" : ""}>
          <span class="opcion__letra">${"ABCD"[j]}</span>${esc(o)}</button>`;
      }).join("")}
    </div>
    ${st.hecho
      ? `<div class="explicacion">✅ <b>+${st.puntos} pts.</b> ${q.explicacion}</div>`
      : `<p class="valor">Esta pregunta vale ahora <b>${valor} pts</b>.</p>`}`;
  $$(".opcion", cont).forEach((b) => b.addEventListener("click", () => {
    const j = Number(b.dataset.j);
    if (j === correcta) {
      st.hecho = true;
      st.puntos = deEscala(escala, st.fallos);
      guardar();
      alAcertar(st.puntos);
    } else {
      st.fallos++;
      st.descartadas.push(j);
      guardar();
      aviso("✘ Respuesta incorrecta", "error");
      pintarTest(cont, q, st, correcta, escala, alAcertar);
    }
  }));
}

/* ==========================================================================
   PRUEBA 1 · SELECTORES
   ========================================================================== */
function construirVista(html) {
  const raiz = document.createElement("div");
  raiz.innerHTML = html.trim();
  const elementos = [...raiz.querySelectorAll("*")];
  const lineas = [];
  const atributos = (el) => [...el.attributes].map((a) =>
    ` <span class="c-attr">${a.name}</span>=<span class="c-val">"${esc(a.value)}"</span>`).join("");
  const abre = (el) => `<span class="c-tag">&lt;${el.localName}</span>${atributos(el)}<span class="c-tag">&gt;</span>`;
  const cierra = (el) => `<span class="c-tag">&lt;/${el.localName}&gt;</span>`;

  (function recorrer(nodo, nivel) {
    for (const hijo of nodo.childNodes) {
      if (hijo.nodeType === Node.TEXT_NODE) {
        const t = hijo.textContent.trim();
        if (t) lineas.push({ nivel, html: esc(t) });
      } else if (hijo.nodeType === Node.ELEMENT_NODE) {
        const idx = elementos.indexOf(hijo);
        if (hijo.children.length === 0) {
          const fin = VACIOS.has(hijo.localName) ? "" : esc(hijo.textContent.trim()) + cierra(hijo);
          lineas.push({ nivel, idx, html: abre(hijo) + fin });
        } else {
          lineas.push({ nivel, idx, html: abre(hijo) });
          recorrer(hijo, nivel + 1);
          lineas.push({ nivel, idx, html: cierra(hijo) });
        }
      }
    }
  })(raiz, 0);
  return { raiz, elementos, lineas };
}

function indiceTest(i) {
  return PRUEBA1.slice(0, i).filter((q) => q.tipo === "test").length;
}

function renderP1() {
  const cont = $("#tab-p1");
  const i = E.vista.p1;
  const q = PRUEBA1[i], st = E.p1[i];
  const puntitos = `<div class="puntitos" role="list">${PRUEBA1.map((_, j) =>
    `<button class="puntito${E.p1[j].hecho ? " puntito--hecho" : ""}${j === i ? " puntito--actual" : ""}" data-ir="${j}" aria-label="Pregunta ${j + 1}">${j + 1}</button>`).join("")}</div>`;

  cont.innerHTML = cabecera("Prueba 1 · ~10 min", "Francotiradores de selectores", puntitos) +
    (p1Completa() ? bannerPieza(S.piezas[0]) : "") +
    `<article class="tarjeta-juego">
      <p class="tarjeta-juego__num">Pregunta ${i + 1} de ${PRUEBA1.length}</p>
      <div id="p1-pregunta"></div>
      <div class="tarjeta-juego__nav">
        <button class="boton boton--fantasma" id="p1-ant" ${i === 0 ? "disabled" : ""}>◂ Anterior</button>
        <button class="boton ${st.hecho ? "" : "boton--fantasma"}" id="p1-sig" ${i === PRUEBA1.length - 1 ? "disabled" : ""}>Siguiente ▸</button>
      </div>
    </article>`;

  $$(".puntito", cont).forEach((b) => b.addEventListener("click", () => { E.vista.p1 = Number(b.dataset.ir); guardar(); renderP1(); }));
  $("#p1-ant", cont).addEventListener("click", () => { E.vista.p1--; guardar(); renderP1(); });
  $("#p1-sig", cont).addEventListener("click", () => { E.vista.p1++; guardar(); renderP1(); });

  const zona = $("#p1-pregunta", cont);
  const alAcertar = (p) => {
    sumarPuntos(p, "✔ ¡Correcto!");
    if (p1Completa()) setTimeout(() => aviso(`🔑 Pieza de la prueba 1: <b>${S.piezas[0]}</b>`, "pieza"), 400);
    renderP1();
  };
  if (q.tipo === "clic") pintarClic(zona, q, st, alAcertar);
  else pintarTest(zona, q, st, S.p1mc[indiceTest(i)], ESCALA_P1, alAcertar);
}

function pintarClic(cont, q, st, alAcertar) {
  const vista = construirVista(q.html);
  const correctas = new Set([...vista.raiz.querySelectorAll(q.selector)].map((e) => vista.elementos.indexOf(e)));
  const sel = new Set(st.hecho ? correctas : st.sel);

  cont.innerHTML = `
    <p class="pregunta__enunciado">Haced clic en <b>todos</b> los elementos que selecciona esta regla:</p>
    <div class="selector-grande"><code>${esc(q.selector)}</code><span> { color: red; }</span></div>
    <div class="codigo codigo--clic${st.hecho ? " codigo--resuelto" : ""}">
      ${vista.lineas.map((l) => `<div class="linea${l.idx !== undefined ? " linea--clic" : ""}" ${l.idx !== undefined ? `data-idx="${l.idx}"` : ""} style="--nivel:${l.nivel}">${l.html}</div>`).join("")}
    </div>
    ${st.hecho
      ? `<div class="explicacion">✅ <b>+${st.puntos} pts.</b> ${q.explicacion}</div>`
      : `<div class="acciones">
           <button class="boton" id="comprobar">Comprobar</button>
           <span class="valor">Marcados: <b id="marcados">0</b> · vale <b>${deEscala(ESCALA_P1, st.fallos)} pts</b></span>
         </div>
         <div class="feedback" id="feedback"></div>`}`;

  const pintarMarcas = () => {
    $$(".linea--clic", cont).forEach((l) => l.classList.toggle("linea--marcada", sel.has(Number(l.dataset.idx))));
    const m = $("#marcados", cont);
    if (m) m.textContent = sel.size;
  };
  pintarMarcas();
  if (st.hecho) return;

  $$(".linea--clic", cont).forEach((l) => l.addEventListener("click", () => {
    const idx = Number(l.dataset.idx);
    sel.has(idx) ? sel.delete(idx) : sel.add(idx);
    st.sel = [...sel];
    guardar();
    pintarMarcas();
  }));

  $("#comprobar", cont).addEventListener("click", () => {
    const fb = $("#feedback", cont);
    if (sel.size === 0) { fb.innerHTML = "Marcad al menos un elemento."; return; }
    const sobran = [...sel].filter((x) => !correctas.has(x)).length;
    const faltan = [...correctas].filter((x) => !sel.has(x)).length;
    if (!sobran && !faltan) {
      st.hecho = true;
      st.puntos = deEscala(ESCALA_P1, st.fallos);
      guardar();
      alAcertar(st.puntos);
    } else {
      st.fallos++;
      guardar();
      const partes = [];
      if (sobran) partes.push(`os sobra${sobran > 1 ? "n" : ""} <b>${sobran}</b>`);
      if (faltan) partes.push(`os falta${faltan > 1 ? "n" : ""} <b>${faltan}</b>`);
      fb.innerHTML = `✘ Todavía no: ${partes.join(" y ")}. Ahora vale <b>${deEscala(ESCALA_P1, st.fallos)} pts</b>.`;
      fb.classList.remove("feedback--sacudir"); void fb.offsetWidth; fb.classList.add("feedback--sacudir");
    }
  });
}

/* ==========================================================================
   PRUEBA 2 · POSITION
   ========================================================================== */
function documentoEscena(r, css) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>${CSS_COMUN}\n${r.css}</style>
<style id="css-alumno">${css.replace(/<\/style/gi, "")}</style>
</head><body>${r.html}</body></html>`;
}

function renderP2() {
  const cont = $("#tab-p2");
  const i = E.vista.p2, r = PRUEBA2[i], st = E.p2[i];
  const chips = `<div class="retos">${PRUEBA2.map((rr, j) =>
    `<button class="reto-chip${E.p2[j].hecho ? " reto-chip--hecho" : ""}${j === i ? " reto-chip--actual" : ""}" data-ir="${j}">
      Reto ${j + 1}<span class="reto-chip__letra">${E.p2[j].hecho ? S.letras[j] : "?"}</span></button>`).join("")}</div>`;

  cont.innerHTML = cabecera("Prueba 2 · ~17 min · prohibido flex y grid", "Recoloca la escena", chips) +
    (p2Completa() ? bannerPieza(S.piezas[1]) : "") +
    `<div class="escena">
      <div class="escena__panel">
        <h3 class="escena__titulo">Reto ${i + 1} · ${r.titulo}</h3>
        <p class="mision">${r.mision}</p>
        <details class="desplegable"><summary>Ver el HTML de la escena</summary><pre class="codigo">${resaltarHTML(r.html)}</pre></details>
        <details class="desplegable"><summary>Ver el CSS de la página (no se puede cambiar)</summary><pre class="codigo">${resaltarCSS(r.css)}</pre></details>
        <label class="editor__rotulo" for="editor-css">Vuestro CSS</label>
        <textarea id="editor-css" class="editor" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
        <p class="prohibido" id="prohibido" hidden>🚫 En esta prueba no se puede usar flex ni grid.</p>
        ${st.hecho
          ? `<div class="explicacion">✅ <b>Reto superado.</b> Letra conseguida: <b class="letra-grande">${S.letras[i]}</b> · +${st.puntos} pts</div>`
          : `<div class="acciones">
               <button class="boton" id="comprobar">Comprobar</button>
               <button class="boton boton--fantasma" id="pista">💡 Pista (−5 pts)</button>
               <button class="boton boton--fantasma" id="deshacer">Deshacer todo</button>
               <span class="valor">Vale <b id="valor">${puntosReto(st)}</b> pts</span>
             </div>`}
        <div class="pista" id="texto-pista" ${st.pista && !st.hecho ? "" : "hidden"}>💡 ${r.pista}</div>
        <ul class="checklist" id="checklist"></ul>
        <div class="tarjeta-juego__nav">
          <button class="boton boton--fantasma" id="r-ant" ${i === 0 ? "disabled" : ""}>◂ Reto anterior</button>
          <button class="boton ${st.hecho ? "" : "boton--fantasma"}" id="r-sig" ${i === PRUEBA2.length - 1 ? "disabled" : ""}>Siguiente reto ▸</button>
        </div>
      </div>
      <div class="escena__vista">
        <div class="navegador">
          <div class="navegador__barra"><span></span><span></span><span></span><em>taller-web.local</em></div>
          <iframe class="navegador__marco" id="marco" title="Vista previa de la escena" sandbox="allow-same-origin"></iframe>
        </div>
        <p class="escena__nota">Vista previa en vivo: se actualiza mientras escribís. Podéis hacer scroll dentro.</p>
      </div>
    </div>`;

  $$(".reto-chip", cont).forEach((b) => b.addEventListener("click", () => { E.vista.p2 = Number(b.dataset.ir); guardar(); renderP2(); }));
  $("#r-ant", cont).addEventListener("click", () => { E.vista.p2--; guardar(); renderP2(); });
  $("#r-sig", cont).addEventListener("click", () => { E.vista.p2++; guardar(); renderP2(); });

  const editor = $("#editor-css", cont), marco = $("#marco", cont), prohibido = $("#prohibido", cont);
  editor.value = st.css;
  editor.readOnly = st.hecho;
  let listo = false;
  marco.addEventListener("load", () => { listo = true; });
  marco.srcdoc = documentoEscena(r, st.css);

  const aplicar = () => {
    const tag = listo && marco.contentDocument && marco.contentDocument.getElementById("css-alumno");
    if (tag) tag.textContent = editor.value;
    prohibido.hidden = !PROHIBIDO.test(sinComentarios(editor.value));
  };
  aplicar();
  let espera;
  editor.addEventListener("input", () => {
    st.css = editor.value;
    clearTimeout(espera);
    espera = setTimeout(() => { aplicar(); guardar(); }, 200);
  });
  editor.addEventListener("keydown", (ev) => {
    if (ev.key === "Tab" && !ev.shiftKey) {
      ev.preventDefault();
      editor.setRangeText("  ", editor.selectionStart, editor.selectionEnd, "end");
      editor.dispatchEvent(new Event("input"));
    }
  });

  if (st.hecho) {
    marco.addEventListener("load", () => pintarChecklist(cont, r.comprobar(marco.contentDocument, marco.contentWindow)));
    return;
  }

  $("#pista", cont).addEventListener("click", () => {
    if (!st.pista) { st.pista = true; guardar(); aviso("💡 Pista desbloqueada (−5 pts al superar el reto)", "info"); }
    $("#texto-pista", cont).hidden = false;
    $("#valor", cont).textContent = puntosReto(st);
  });
  $("#deshacer", cont).addEventListener("click", () => {
    if (!confirm("¿Borrar vuestro CSS de este reto y volver al inicial?")) return;
    st.css = r.inicial; guardar(); renderP2();
  });
  $("#comprobar", cont).addEventListener("click", () => {
    if (!listo) { aviso("La vista previa aún se está cargando…", "info"); return; }
    st.css = editor.value;
    if (PROHIBIDO.test(sinComentarios(st.css))) {
      prohibido.hidden = false;
      aviso("🚫 Sin flex ni grid: solo position", "error");
      return;
    }
    aplicar();
    let res;
    try { res = r.comprobar(marco.contentDocument, marco.contentWindow); }
    catch (e) { res = [{ ok: false, txt: "No se ha podido comprobar la escena. Revisad que el CSS sea válido." }]; }
    pintarChecklist(cont, res);
    if (res.every((c) => c.ok)) {
      st.hecho = true;
      st.puntos = puntosReto(st);
      guardar();
      sumarPuntos(st.puntos, `🔑 Letra <b>${S.letras[i]}</b> conseguida`);
      if (p2Completa()) setTimeout(() => aviso(`🔑 Pieza de la prueba 2: <b>${S.piezas[1]}</b>`, "pieza"), 400);
      renderP2();
    } else {
      st.fallos++;
      guardar();
      $("#valor", cont).textContent = puntosReto(st);
      avisoFaltan(res);
    }
  });
}

function avisoFaltan(res) {
  const n = res.filter((c) => !c.ok).length;
  aviso(`✘ Falta${n > 1 ? "n" : ""} ${n} criterio${n > 1 ? "s" : ""}`, "error");
}

function pintarChecklist(cont, res) {
  $("#checklist", cont).innerHTML = res.map((c) =>
    `<li class="checklist__item checklist__item--${c.ok ? "ok" : "mal"}">${c.ok ? "✔" : "✘"} ${c.txt}</li>`).join("");
}

/* ==========================================================================
   PRUEBA 3 · BEM
   ========================================================================== */
function renderP3() {
  const cont = $("#tab-p3");
  const sub = E.vista.p3;
  const hechoT = E.p3.t.every((q) => q.hecho);
  const pestanas = [
    ["a", "A · ¿Es BEM?", E.p3.a.hecho],
    ["t", "B · Conceptos", hechoT],
    ["b", "C · Refactoriza", E.p3.b.hecho]
  ];
  cont.innerHTML = cabecera("Prueba 3 · ~12 min", "Inspectores BEM",
    `<div class="retos">${pestanas.map(([id, txt, ok]) =>
      `<button class="reto-chip${ok ? " reto-chip--hecho" : ""}${id === sub ? " reto-chip--actual" : ""}" data-sub="${id}">${txt}${ok ? '<span class="reto-chip__letra">✔</span>' : ""}</button>`).join("")}</div>`) +
    (p3Completa() ? bannerPieza(S.piezas[2]) : "") +
    `<article class="tarjeta-juego" id="p3-zona"></article>`;

  $$("[data-sub]", cont).forEach((b) => b.addEventListener("click", () => { E.vista.p3 = b.dataset.sub; guardar(); renderP3(); }));
  const zona = $("#p3-zona", cont);
  if (sub === "a") pintarBemA(zona);
  else if (sub === "t") pintarBemTest(zona);
  else pintarBemB(zona);
}

function trasBem(p, texto) {
  sumarPuntos(p, texto);
  if (p3Completa()) setTimeout(() => aviso(`🔑 Pieza de la prueba 3: <b>${S.piezas[2]}</b>`, "pieza"), 400);
  renderP3();
}

function pintarBemA(zona) {
  const st = E.p3.a;
  if (st.hecho) st.marcas = [...S.bemToggles];
  zona.innerHTML = `
    <p class="pregunta__enunciado">¿Cada uno de estos nombres de clase sigue la sintaxis BEM <code>bloque__elemento--modificador</code>?</p>
    <div class="bem-lista">
      ${BEM_NOMBRES.map((n, i) => `
        <div class="bem-item${st.hecho ? (S.bemToggles[i] ? " bem-item--si" : " bem-item--no") : ""}">
          <code class="bem-item__clase">.${n.clase}</code>
          <div class="bem-item__botones">
            <button class="interruptor${st.marcas[i] === 1 ? " interruptor--si" : ""}" data-i="${i}" data-v="1" ${st.hecho ? "disabled" : ""}>✔ BEM</button>
            <button class="interruptor${st.marcas[i] === 0 ? " interruptor--no" : ""}" data-i="${i}" data-v="0" ${st.hecho ? "disabled" : ""}>✘ No</button>
          </div>
          ${st.hecho ? `<p class="bem-item__por">${esc(n.por)}</p>` : ""}
        </div>`).join("")}
    </div>
    ${st.hecho
      ? `<div class="explicacion">✅ <b>+${st.puntos} pts.</b> Leed las explicaciones de cada nombre.</div>`
      : `<div class="acciones"><button class="boton" id="comprobar">Comprobar</button>
         <span class="valor">Vale <b>${puntosBemA(st)} pts</b> · hay que acertarlas todas</span></div>
         <div class="feedback" id="feedback"></div>`}`;
  if (st.hecho) return;

  $$(".interruptor", zona).forEach((b) => b.addEventListener("click", () => {
    st.marcas[Number(b.dataset.i)] = Number(b.dataset.v);
    guardar();
    pintarBemA(zona);
  }));
  $("#comprobar", zona).addEventListener("click", () => {
    const fb = $("#feedback", zona);
    const sinMarcar = st.marcas.filter((m) => m === null).length;
    if (sinMarcar) { fb.innerHTML = `Os falta${sinMarcar > 1 ? "n" : ""} <b>${sinMarcar}</b> por marcar.`; return; }
    const errores = st.marcas.filter((m, i) => m !== S.bemToggles[i]).length;
    if (!errores) {
      st.hecho = true; st.puntos = puntosBemA(st); guardar();
      trasBem(st.puntos, "✔ ¡Todas bien!");
    } else {
      st.fallos++; guardar();
      fb.innerHTML = `✘ Hay <b>${errores}</b> error${errores > 1 ? "es" : ""}. Ahora vale <b>${puntosBemA(st)} pts</b>.`;
      fb.classList.remove("feedback--sacudir"); void fb.offsetWidth; fb.classList.add("feedback--sacudir");
    }
  });
}

function pintarBemTest(zona) {
  zona.innerHTML = BEM_TEST.map((_, i) => `<div class="pregunta-bloque" id="bem-t${i}"><p class="tarjeta-juego__num">Pregunta ${i + 1} de ${BEM_TEST.length}</p><div></div></div>`).join("");
  BEM_TEST.forEach((q, i) => {
    const dentro = $(`#bem-t${i} > div`, zona);
    pintarTest(dentro, q, E.p3.t[i], S.bemMc[i], ESCALA_BEM_TEST, (p) => trasBem(p, "✔ ¡Correcto!"));
  });
}

function revisarBEM(html) {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, "text/html");
  const els = [...doc.body.querySelectorAll("*")];
  const clasesDe = (e) => [...e.classList];
  const todas = els.flatMap(clasesDe);
  const RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
  const estructura = doc.body.children.length === 1 && els.map((e) => e.localName).join(",") === "div,img,div,h3,p,button";
  const raiz = els[0];
  const interiores = els.slice(1);
  const viejas = ["destacado", "foto", "info", "titulo", "precio", "rojo", "grande", "boton-comprar"];
  return [
    { ok: estructura, txt: "Se mantienen las mismas 6 etiquetas en el mismo orden" },
    { ok: todas.length > 0 && todas.every((c) => RE.test(c)), txt: "Todas las clases cumplen la sintaxis BEM (minúsculas, __ para elementos, -- para modificadores)" },
    { ok: !!raiz && raiz.classList.contains("producto"), txt: "La etiqueta raíz es el bloque: class=\"producto\"" },
    { ok: interiores.length > 0 && interiores.every((e) => clasesDe(e).some((c) => /^producto__[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c))), txt: "Cada etiqueta interior tiene su clase de elemento del bloque (producto__…)" },
    { ok: todas.every((c) => (c.match(/__/g) || []).length <= 1), txt: "No hay elementos de elementos (nada de producto__info__titulo)" },
    { ok: els.every((e) => clasesDe(e).filter((c) => c.includes("--")).every((c) => e.classList.contains(c.split("--")[0]))), txt: "Cada modificador va acompañado de su clase base" },
    { ok: estructura && [els[0], els[4], els[5]].every((e) => clasesDe(e).some((c) => c.includes("--"))), txt: "La tarjeta destacada, el precio en oferta y el botón grande llevan modificador" },
    { ok: !todas.some((c) => viejas.includes(c) || /rojo/.test(c)), txt: "No quedan clases antiguas sueltas ni nombres de color (rojo): se nombra por la función" }
  ];
}

function pintarBemB(zona) {
  const st = E.p3.b;
  zona.innerHTML = `
    <div class="refactor">
      <div>
        <p class="pregunta__enunciado">Refactorizad este componente a BEM.</p>
        <p class="pregunta__rotulo">HTML original</p>
        <pre class="codigo">${resaltarHTML(BEM_HTML_ORIGINAL)}</pre>
        <p class="pregunta__rotulo">Requisitos</p>
        <ul class="requisitos">
          <li>El bloque se llama <code>producto</code>.</li>
          <li>Todas las etiquetas interiores son <b>elementos</b> de ese bloque.</li>
          <li>La tarjeta está destacada → <b>modificador</b> del bloque.</li>
          <li>El precio en rojo es un <b>precio en oferta</b> → modificador (nombradlo por su función, no por su color).</li>
          <li>El botón es grande → modificador.</li>
          <li>No cambiéis las etiquetas ni su orden: solo las clases.</li>
        </ul>
      </div>
      <div>
        <label class="editor__rotulo" for="editor-html">Vuestro HTML</label>
        <textarea id="editor-html" class="editor editor--alto" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
        ${st.hecho
          ? `<div class="explicacion">✅ <b>+${st.puntos} pts.</b> ¡Componente refactorizado!</div>`
          : `<div class="acciones"><button class="boton" id="comprobar">Comprobar</button>
             <button class="boton boton--fantasma" id="deshacer">Volver al original</button>
             <span class="valor">Vale <b id="valor">${puntosBemB(st)}</b> pts</span></div>`}
        <ul class="checklist" id="checklist"></ul>
      </div>
    </div>`;
  const editor = $("#editor-html", zona);
  editor.value = st.html;
  editor.readOnly = st.hecho;
  if (st.hecho) { pintarChecklist(zona, revisarBEM(st.html)); return; }

  editor.addEventListener("input", () => { st.html = editor.value; guardar(); });
  editor.addEventListener("keydown", (ev) => {
    if (ev.key === "Tab" && !ev.shiftKey) {
      ev.preventDefault();
      editor.setRangeText("  ", editor.selectionStart, editor.selectionEnd, "end");
      st.html = editor.value; guardar();
    }
  });
  $("#deshacer", zona).addEventListener("click", () => {
    if (!confirm("¿Volver al HTML original? Se perderán vuestros cambios.")) return;
    st.html = BEM_HTML_ORIGINAL; guardar(); pintarBemB(zona);
  });
  $("#comprobar", zona).addEventListener("click", () => {
    st.html = editor.value;
    const res = revisarBEM(st.html);
    pintarChecklist(zona, res);
    if (res.every((c) => c.ok)) {
      st.hecho = true; st.puntos = puntosBemB(st); guardar();
      trasBem(st.puntos, "✔ ¡Refactorización correcta!");
    } else {
      st.fallos++; guardar();
      $("#valor", zona).textContent = puntosBemB(st);
      avisoFaltan(res);
    }
  });
}

/* ==========================================================================
   SALIDA
   ========================================================================== */
function renderFin() {
  const cont = $("#tab-fin");
  const pts = total();
  const tiempo = $("#reloj").textContent;

  if (E.final.hecho) {
    cont.innerHTML = `
      <div class="final">
        <p class="final__aviso">✔ PRODUCCIÓN RESTAURADA</p>
        <h2 class="final__titulo">¡Web reparada!</h2>
        <p class="final__equipo">${esc(E.equipo)}</p>
        <div class="final__datos">
          <div><span>Puntos</span><b>${pts}</b></div>
          <div><span>Tiempo</span><b>${tiempo}</b></div>
        </div>
        <p class="final__instr">Enseñad este código al profe:</p>
        <p class="codigo-verif">${codigoVerificacion(E.equipo, pts, true)}</p>
      </div>`;
    return;
  }

  const piezas = [
    ["Prueba 1 · Selectores", p1Completa(), S.piezas[0], "p1"],
    ["Prueba 2 · Position", p2Completa(), S.piezas[1], "p2"],
    ["Prueba 3 · BEM", p3Completa(), S.piezas[2], "p3"]
  ];
  cont.innerHTML = cabecera("Salida", "La puerta de producción") + `
    <div class="salida">
      <article class="tarjeta-juego">
        <p class="pregunta__enunciado">Para salir necesitáis las tres piezas de la contraseña, en el orden de las pruebas.</p>
        <ul class="piezas">
          ${piezas.map(([n, ok, txt, tab]) => `<li class="piezas__item${ok ? " piezas__item--ok" : ""}">
            <span>${n}</span>${ok ? `<b>🔑 ${txt}</b>` : `<button class="boton boton--fantasma boton--mini" data-tab-ir="${tab}">Pendiente ▸</button>`}</li>`).join("")}
        </ul>
        ${todasCompletas()
          ? `<form class="contrasena" id="form-clave">
               <label for="clave">Contraseña</label>
               <div class="inicio__fila">
                 <input id="clave" autocomplete="off" placeholder="PIEZA1 PIEZA2 PIEZA3">
                 <button class="boton boton--grande" type="submit">Abrir 🔓</button>
               </div>
               <p class="feedback" id="feedback"></p>
             </form>`
          : `<p class="valor">Cuando tengáis las tres piezas aparecerá aquí el candado.</p>`}
      </article>
      <aside class="tarjeta-juego provisional">
        <p class="pregunta__rotulo">¿Se acaba el tiempo?</p>
        <p>Enseñad al profe vuestro código de puntuación provisional:</p>
        <p class="codigo-verif codigo-verif--peq">${codigoVerificacion(E.equipo, pts, false)}</p>
        <p class="valor">${esc(E.equipo)} · ${pts} pts · ${tiempo}</p>
      </aside>
    </div>`;

  $$("[data-tab-ir]", cont).forEach((b) => b.addEventListener("click", () => irA(b.dataset.tabIr)));
  const form = $("#form-clave", cont);
  if (!form) return;
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const valor = $("#clave", cont).value.toUpperCase().replace(/[^A-ZÑ]/g, "");
    if (valor === S.piezas.join("")) {
      E.final = { hecho: true, puntos: PUNTOS_SALIDA, fin: Date.now() };
      guardar();
      pintarReloj();
      sumarPuntos(PUNTOS_SALIDA, "🔓 ¡Salida abierta!");
      confeti();
      renderFin();
    } else {
      const fb = $("#feedback", cont);
      fb.innerHTML = "✘ Contraseña incorrecta. Revisad el orden de las piezas.";
      fb.classList.remove("feedback--sacudir"); void fb.offsetWidth; fb.classList.add("feedback--sacudir");
    }
  });
}

function confeti() {
  const colores = ["#ffd23f", "#ff5d5d", "#4ade80", "#7cc4ff", "#f4f1ea"];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("span");
    c.className = "confeti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colores[i % colores.length];
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    document.body.append(c);
    setTimeout(() => c.remove(), 4500);
  }
}

/* ==========================================================================
   ARRANQUE
   ========================================================================== */
function empezarJuego() {
  $("#inicio").hidden = true;
  $("#juego").hidden = false;
  $("#datos").hidden = false;
  $("#llavero").hidden = false;
  $("#reiniciar").hidden = false;
  pintarBarra();
  pintarReloj();
  irA(E.vista.tab || "p1");
}

function iniciar() {
  const guardado = cargar();
  if (guardado) {
    $("#form-inicio").hidden = true;
    $("#continuar").hidden = false;
    $("#boton-continuar").textContent = `Continuar como «${guardado.equipo}» ▸`;
    $("#boton-continuar").addEventListener("click", () => { E = guardado; empezarJuego(); });
    $("#boton-nueva").addEventListener("click", () => {
      if (!confirm(`Se borrará el progreso de «${guardado.equipo}». ¿Seguro?`)) return;
      try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
      $("#continuar").hidden = true;
      $("#form-inicio").hidden = false;
      $("#nombre-equipo").focus();
    });
  }

  $("#form-inicio").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nombre = $("#nombre-equipo").value.trim();
    if (!nombre) return;
    E = estadoNuevo(nombre);
    guardar();
    empezarJuego();
  });

  $$(".pestanas__boton").forEach((b) => b.addEventListener("click", () => irA(b.dataset.tab)));
  $("#reiniciar").addEventListener("click", () => {
    if (!confirm("¿Reiniciar la partida? Se borrará todo el progreso de este equipo.")) return;
    try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
    location.reload();
  });
  setInterval(pintarReloj, 1000);
}

iniciar();
