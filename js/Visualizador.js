/* ==========================================================
   Visualizador.js · Dibuja el árbol con Zoom, Paneo y Puntero
   ========================================================== */

class Visualizador {
  constructor(svg, opciones = {}) {
    this.svg = svg;
    this.arbol = null;

    this.pos = new Map();
    this.destinos = new Map();
    this.padres = new Map();
    this.niveles = [];

    this.estados = new Map();
    this.aristas = new Map();
    this.fantasma = null;
    this.puntero = false;
    this.nulo = null;
    this.mostrarNiveles = false;

    this.vb = { w: 640, h: 320, x: 0, y: 0 };
    this.duracion = 450;
    this.alClickNodo = opciones.alClickNodo || null;

    this.R = 22;
    this.dx = 58;
    this.dy = 78;
    this.mx = 44;
    this.my = 74;

    this._raf = null;
    this._fin = null;
    this._reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._configurarZoomPan();
    this._configurarBotonesZoom();

    svg.addEventListener('click', (e) => {
      const g = e.target.closest('.nodo');
      if (!g || !this.alClickNodo || !this.arbol) return;
      const id = Number(g.dataset.id);
      const nodo = this.arbol.todosLosNodos().find((n) => n.id === id);
      if (nodo) this.alClickNodo(nodo);
    });
  }

  _configurarZoomPan() {
    let arrastrando = false;
    let inicioX = 0, inicioY = 0;

    this.svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('.nodo')) return;
      arrastrando = true;
      inicioX = e.clientX;
      inicioY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!arrastrando) return;
      const dx = (e.clientX - inicioX) * (this.vb.w / this.svg.clientWidth);
      const dy = (e.clientY - inicioY) * (this.vb.h / this.svg.clientHeight);
      this.vb.x -= dx;
      this.vb.y -= dy;
      inicioX = e.clientX;
      inicioY = e.clientY;
      this._aplicarViewBox();
    });

    window.addEventListener('mouseup', () => { arrastrando = false; });

    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 0.9 : 1.1;
      this.vb.w *= factor;
      this.vb.h *= factor;
      this._aplicarViewBox();
    }, { passive: false });
  }

  _configurarBotonesZoom() {
    const btnIn = document.getElementById('btn-zoom-in');
    const btnOut = document.getElementById('btn-zoom-out');
    const btnReset = document.getElementById('btn-zoom-reset');

    if (btnIn) {
      btnIn.addEventListener('click', (e) => {
        e.preventDefault();
        this.zoom(0.8);
      });
    }
    if (btnOut) {
      btnOut.addEventListener('click', (e) => {
        e.preventDefault();
        this.zoom(1.25);
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        this._calcularLayout();
        this.dibujar();
      });
    }
  }

  _aplicarViewBox() {
    this.svg.setAttribute('viewBox', `${this.vb.x} ${this.vb.y} ${this.vb.w} ${this.vb.h}`);
  }

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
    if (this.arbol) recorrer(this.arbol.raiz, 0, null);

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
    this.vb.w = w;
    this.vb.h = h;
    this.vb.x = 0;
    this.vb.y = 0;
    this._aplicarViewBox();
  }

  actualizar(arbol = this.arbol, animar = true) {
    this.arbol = arbol;
    this._calcularLayout();

    arbol.todosLosNodos().forEach((n) => {
      if (this.pos.has(n.id)) return;
      const padrePos = this.pos.get(this.padres.get(n.id));
      const base = padrePos || this.destinos.get(n.id);
      this.pos.set(n.id, { x: base.x, y: base.y });
    });

    for (const clave of [...this.pos.keys()]) {
      if (typeof clave === 'number' && !this.destinos.has(clave)) this.pos.delete(clave);
    }

    return this.mover(new Map(this.destinos), animar ? this.duracion : 0);
  }

  mover(destinos, duracion = this.duracion) {
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
        const suave = 1 - Math.pow(1 - t, 3);
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

  colocar(clave, nodo, duracion = this.duracion) {
    const d = this.destinos.get(nodo.id);
    if (!d) return Promise.resolve();
    if (!this.pos.has(clave)) this.pos.set(clave, { x: d.x, y: d.y - 50 });
    return this.mover(new Map([[clave, { x: d.x, y: d.y }]]), duracion);
  }

  quitar(clave) {
    this.pos.delete(clave);
    if (clave === 'fantasma') this.fantasma = null;
    if (clave === 'puntero') this.puntero = false;
    this.dibujar();
  }

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

  dibujar() {
    if (!this.arbol) return;
    const { w, h } = this.vb;
    const R = this.R;
    const nodos = this.arbol.todosLosNodos();
    let s = '';

    if (this.mostrarNiveles) {
      for (const lv of this.niveles) {
        s += `<line class="guia" x1="0" y1="${lv.y}" x2="${w}" y2="${lv.y}"/>`;
        s += `<text class="guia-txt" x="8" y="${lv.y - 6}">Nivel ${lv.nivel}</text>`;
      }
    }

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

    if (this.nulo) {
      const p = this.pos.get(this.nulo.padreId);
      if (p) {
        const x = p.x + (this.nulo.dir === 'izq' ? -this.dx * 0.5 : this.dx * 0.5);
        const y = p.y + this.dy * 0.8;
        s += `<line class="arista nulo" x1="${p.x}" y1="${p.y}" x2="${x}" y2="${y}"/>`;
        s += `<circle class="nulo-c" cx="${x}" cy="${y}" r="14"/><text class="nulo-t" x="${x}" y="${y}">∅</text>`;
      }
    }

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

    const pf = this.pos.get('fantasma');
    if (this.fantasma && pf) {
      s += `<g class="fantasma" transform="translate(${pf.x.toFixed(1)} ${(pf.y - 46).toFixed(1)})">`;
      s += `<circle r="16" fill="${this.fantasma.color}"/><text>${escapar(this.fantasma.valor)}</text></g>`;
    }

    const pp = this.pos.get('puntero');
    if (this.puntero && pp) {
      const x = pp.x, y = pp.y;
      s += `<polygon class="puntero" points="${x - 10},${y - 48} ${x + 10},${y - 48} ${x},${y - 28}"/>`;
    }

    if (nodos.length === 0 && !this.fantasma) {
      s += `<text class="vacio" x="${w / 2}" y="${h / 2}">Árbol vacío: inserta un valor para empezar</text>`;
    }

    this.svg.innerHTML = s;
  }

  zoom(factor) {
    const cx = this.vb.x + this.vb.w / 2;
    const cy = this.vb.y + this.vb.h / 2;
    this.vb.w *= factor;
    this.vb.h *= factor;
    this.vb.x = cx - this.vb.w / 2;
    this.vb.y = cy - this.vb.h / 2;
    this._aplicarViewBox();
  }
}