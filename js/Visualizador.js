/* ==========================================================
   Visualizador.js · Dibuja un ArbolBinario en un <svg> y anima
   el movimiento de los nodos. No contiene lógica del árbol.
   ========================================================== */

class Visualizador {
  /**
   * @param {SVGElement} svg
   * @param {{alClickNodo?: function(Nodo)}} opciones
   */
  constructor(svg, opciones = {}) {
    this.svg = svg;
    this.arbol = null;

    this.pos = new Map();       // posición actual (en píxeles SVG) por id de nodo / 'fantasma' / 'puntero'
    this.destinos = new Map();  // posición final de cada nodo
    this.padres = new Map();    // id hijo → id padre
    this.niveles = [];          // [{nivel, y}] para las guías

    this.estados = new Map();   // id nodo → 'actual' | 'camino' | 'visitado' | 'encontrado' | 'eliminar'
    this.aristas = new Map();   // id hijo → { clase, etiqueta }
    this.fantasma = null;       // { valor, color } valor que viaja buscando su lugar
    this.puntero = false;       // flecha que recorre el árbol
    this.nulo = null;           // { padreId, dir } hueco vacío donde terminó la búsqueda
    this.mostrarNiveles = false;

    this.vb = { w: 640, h: 320 };
    this.duracion = 450;        // ms de cada movimiento
    this.alClickNodo = opciones.alClickNodo || null;

    // Medidas
    this.R = 22;      // radio del nodo
    this.dx = 58;     // separación horizontal
    this.dy = 78;     // separación vertical
    this.mx = 44;     // margen lateral
    this.my = 74;     // margen superior

    this._raf = null;
    this._fin = null;
    this._reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Un solo "listener" para todos los nodos (el SVG se redibuja seguido)
    svg.addEventListener('click', (e) => {
      const g = e.target.closest('.nodo');
      if (!g || !this.alClickNodo || !this.arbol) return;
      const id = Number(g.dataset.id);
      const nodo = this.arbol.todosLosNodos().find((n) => n.id === id);
      if (nodo) this.alClickNodo(nodo);
    });
  }

  /* ---------- Distribución (layout) ---------- */

  /** Calcula dónde debe ir cada nodo: x por orden inorden, y por nivel. */
  _calcularLayout() {
    const info = new Map();
    let columna = 0;
    let maxNivel = 0;

    const recorrer = (nodo, nivel, padre) => {
      if (nodo === null) return;
      recorrer(nodo.izq, nivel + 1, nodo);
      info.set(nodo.id, { col: columna++, nivel, padreId: padre ? padre.id : null });
      if (nivel > maxNivel) maxNivel = nivel;
      recorrer(nodo.der, nivel + 1, nodo);
    };
    recorrer(this.arbol.raiz, 0, null);

    const anchoArbol = Math.max(0, (columna - 1) * this.dx);
    const w = Math.max(640, anchoArbol + 2 * this.mx);
    const h = Math.max(300, maxNivel * this.dy + this.my + 100);
    const desfase = (w - anchoArbol) / 2;

    this.destinos = new Map();
    this.padres = new Map();
    info.forEach((d, id) => {
      this.destinos.set(id, { x: desfase + d.col * this.dx, y: this.my + d.nivel * this.dy });
      this.padres.set(id, d.padreId);
    });

    this.niveles = [];
    if (columna > 0) {
      for (let n = 0; n <= maxNivel; n++) this.niveles.push({ nivel: n, y: this.my + n * this.dy });
    }
    this.vb = { w, h };
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  /**
   * Recalcula posiciones y anima los nodos hasta su lugar nuevo.
   * Los nodos nuevos nacen en la posición de su padre.
   */
  actualizar(arbol = this.arbol, animar = true) {
    this.arbol = arbol;
    this._calcularLayout();

    // Posición inicial de nodos nuevos (en preorden, el padre ya tiene la suya)
    arbol.todosLosNodos().forEach((n) => {
      if (this.pos.has(n.id)) return;
      const padrePos = this.pos.get(this.padres.get(n.id));
      const base = padrePos || this.destinos.get(n.id);
      this.pos.set(n.id, { x: base.x, y: base.y });
    });

    // Olvidar nodos que ya no existen
    for (const clave of [...this.pos.keys()]) {
      if (typeof clave === 'number' && !this.destinos.has(clave)) this.pos.delete(clave);
    }

    return this.mover(new Map(this.destinos), animar ? this.duracion : 0);
  }

  /* ---------- Animación ---------- */

  /**
   * Mueve las claves indicadas hasta sus destinos.
   * @param {Map<any,{x:number,y:number}>} destinos
   * @returns {Promise<void>} se resuelve al terminar el movimiento
   */
  mover(destinos, duracion = this.duracion) {
    // Si había un movimiento en curso, se corta y se libera su promesa
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._fin) this._fin();

    return new Promise((resolve) => {
      if (duracion <= 0 || this._reducir || destinos.size === 0) {
        destinos.forEach((d, k) => this.pos.set(k, { x: d.x, y: d.y }));
        this.dibujar();
        this._fin = null;
        resolve();
        return;
      }

      this._fin = resolve;
      const inicio = new Map();
      destinos.forEach((d, k) => inicio.set(k, this.pos.get(k) || d));
      const t0 = performance.now();

      const paso = (ahora) => {
        const t = Math.min(1, (ahora - t0) / duracion);
        const suave = 1 - Math.pow(1 - t, 3); // ease-out cúbico
        destinos.forEach((d, k) => {
          const s = inicio.get(k);
          this.pos.set(k, { x: s.x + (d.x - s.x) * suave, y: s.y + (d.y - s.y) * suave });
        });
        this.dibujar();
        if (t < 1) {
          this._raf = requestAnimationFrame(paso);
        } else {
          this._raf = null;
          this._fin = null;
          resolve();
        }
      };
      this._raf = requestAnimationFrame(paso);
    });
  }

  /** Desplaza el "fantasma" o el "puntero" hasta un nodo. */
  colocar(clave, nodo, duracion = this.duracion) {
    const d = this.destinos.get(nodo.id);
    if (!d) return Promise.resolve();
    if (!this.pos.has(clave)) this.pos.set(clave, { x: d.x, y: d.y - 50 }); // entra desde arriba
    return this.mover(new Map([[clave, { x: d.x, y: d.y }]]), duracion);
  }

  quitar(clave) {
    this.pos.delete(clave);
    if (clave === 'fantasma') this.fantasma = null;
    if (clave === 'puntero') this.puntero = false;
    this.dibujar();
  }

  /* ---------- Marcas visuales ---------- */

  marcar(nodo, estado) { this.estados.set(nodo.id, estado); this.dibujar(); }
  estadoDe(nodo) { return this.estados.get(nodo.id) || ''; }
  marcarArista(hijo, clase, etiqueta = '') { this.aristas.set(hijo.id, { clase, etiqueta }); this.dibujar(); }
  marcarNulo(padre, dir) { this.nulo = { padreId: padre.id, dir }; this.dibujar(); }

  limpiarEstados() {
    this.estados.clear();
    this.aristas.clear();
    this.nulo = null;
    this.fantasma = null;
    this.puntero = false;
    this.pos.delete('fantasma');
    this.pos.delete('puntero');
    this.dibujar();
  }

  /* ---------- Dibujo ---------- */

  dibujar() {
    if (!this.arbol) return;
    const { w, h } = this.vb;
    const R = this.R;
    const nodos = this.arbol.todosLosNodos();
    let s = '';

    // Guías de nivel
    if (this.mostrarNiveles) {
      for (const lv of this.niveles) {
        s += `<line class="guia" x1="0" y1="${lv.y}" x2="${w}" y2="${lv.y}"/>`;
        s += `<text class="guia-txt" x="8" y="${lv.y - 6}">Nivel ${lv.nivel}</text>`;
      }
    }

    // Aristas
    for (const n of nodos) {
      const p = this.pos.get(n.id);
      if (!p) continue;
      for (const [hijo, dir] of [[n.izq, 'izq'], [n.der, 'der']]) {
        if (!hijo) continue;
        const q = this.pos.get(hijo.id);
        if (!q) continue;
        const a = this.aristas.get(hijo.id);
        s += `<line class="arista ${a ? a.clase : ''}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;
        if (a && a.etiqueta) {
          const mx = (p.x + q.x) / 2 + (dir === 'izq' ? -16 : 16);
          s += `<text class="arista-txt" x="${mx}" y="${(p.y + q.y) / 2}">${escapar(a.etiqueta)}</text>`;
        }
      }
    }

    // Hueco vacío (∅) donde terminó una búsqueda o donde se insertará
    if (this.nulo) {
      const p = this.pos.get(this.nulo.padreId);
      if (p) {
        const x = p.x + (this.nulo.dir === 'izq' ? -this.dx * 0.5 : this.dx * 0.5);
        const y = p.y + this.dy * 0.8;
        s += `<line class="arista nulo" x1="${p.x}" y1="${p.y}" x2="${x}" y2="${y}"/>`;
        s += `<circle class="nulo-c" cx="${x}" cy="${y}" r="14"/><text class="nulo-t" x="${x}" y="${y}">∅</text>`;
      }
    }

    // Nodos
    for (const n of nodos) {
      const p = this.pos.get(n.id);
      if (!p) continue;
      const estado = this.estados.get(n.id) || '';
      const largo = String(n.valor).length;
      const tam = largo > 4 ? 11 : largo > 3 ? 13 : largo > 2 ? 15 : 17;
      s += `<g class="nodo" data-id="${n.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">`;
      if (estado) s += `<circle class="halo ${estado}" r="${R + 8}"/>`;
      s += `<circle class="cuerpo" r="${R}" fill="${n.color}"/>`;
      s += `<text style="font-size:${tam}px">${escapar(n.valor)}</text></g>`;
    }

    // Valor "fantasma" que viaja buscando su posición
    const pf = this.pos.get('fantasma');
    if (this.fantasma && pf) {
      s += `<g class="fantasma" transform="translate(${pf.x.toFixed(1)} ${(pf.y - 46).toFixed(1)})">`;
      s += `<circle r="16" fill="${this.fantasma.color}"/><text>${escapar(this.fantasma.valor)}</text></g>`;
    }

    // Puntero del recorrido
    const pp = this.pos.get('puntero');
    if (this.puntero && pp) {
      const x = pp.x, y = pp.y;
      s += `<polygon class="puntero" points="${x - 10},${y - 48} ${x + 10},${y - 48} ${x},${y - 28}"/>`;
    }

    // Árbol vacío
    if (nodos.length === 0 && !this.fantasma) {
      s += `<text class="vacio" x="${w / 2}" y="${h / 2}">Árbol vacío: inserta un valor para empezar</text>`;
    }

    this.svg.innerHTML = s;
  }
}
