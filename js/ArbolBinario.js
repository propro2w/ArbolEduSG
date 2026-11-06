/* ==========================================================
   ArbolBinario.js · Árbol binario de búsqueda (desde cero)
   ========================================================== */

class ArbolBinario {
  constructor() {
    this.raiz = null;
    this.tamano = 0;
  }

  /* ---------- Utilidades de valores ---------- */

  static comparar(a, b) {
    const aNum = typeof a === 'number';
    const bNum = typeof b === 'number';
    if (aNum !== bNum) return aNum ? -1 : 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Convierte y valida el texto según el modo seleccionado ('numerico' o 'letras').
   * Rechaza estrictamente números decimales.
   */
  static parsear(texto, modo = 'numerico') {
    const t = String(texto).trim();
    if (t === '') return { error: 'Escribe un valor.' };

    if (modo === 'numerico') {
      if (/^-?\d+$/.test(t)) {
        return { valor: Number(t) };
      }
      if (/^-?\d+\.\d+$/.test(t)) {
        return { error: 'No se permiten números decimales, solo enteros.' };
      }
      return { error: 'En modo numérico solo se permiten enteros (ej. 42).' };
    }

    if (modo === 'letras') {
      if (/^[a-zA-Z]$/.test(t)) {
        return { valor: t.toUpperCase() };
      }
      return { error: 'En modo letras solo debes ingresar un único carácter de la A a la Z.' };
    }

    return { error: 'Modo de entrada no válido.' };
  }

  estaVacio() {
    return this.raiz === null;
  }

  vaciar() {
    this.raiz = null;
    this.tamano = 0;
  }

  /* ---------- Búsqueda ---------- */

  buscarRuta(valor) {
    const pasos = [];
    let actual = this.raiz;
    while (actual !== null) {
      const cmp = ArbolBinario.comparar(valor, actual.valor);
      if (cmp === 0) {
        pasos.push({ nodo: actual, cmp: 0, dir: null });
        return { pasos, encontrado: true, nodo: actual };
      }
      const dir = cmp < 0 ? 'izq' : 'der';
      pasos.push({ nodo: actual, cmp, dir });
      actual = actual[dir];
    }
    return { pasos, encontrado: false, nodo: null };
  }

  /* ---------- Inserción ---------- */

  insertar(valor) {
    const ruta = this.buscarRuta(valor);
    if (ruta.encontrado) return null;

    const nuevo = new Nodo(valor);
    if (this.raiz === null) {
      this.raiz = nuevo;
    } else {
      const ultimo = ruta.pasos[ruta.pasos.length - 1];
      ultimo.nodo[ultimo.dir] = nuevo;
    }
    this.tamano++;
    return nuevo;
  }

  /* ---------- Eliminación ---------- */

  eliminar(valor) {
    const antes = this.tamano;
    this.raiz = this._eliminar(this.raiz, valor);
    return this.tamano < antes;
  }

  _eliminar(nodo, valor) {
    if (nodo === null) return null;

    const cmp = ArbolBinario.comparar(valor, nodo.valor);
    if (cmp < 0) { nodo.izq = this._eliminar(nodo.izq, valor); return nodo; }
    if (cmp > 0) { nodo.der = this._eliminar(nodo.der, valor); return nodo; }

    this.tamano--;
    if (nodo.izq === null) return nodo.der;
    if (nodo.der === null) return nodo.izq;

    const sucesor = this.minimo(nodo.der);
    const nuevaDer = this._quitarMinimo(nodo.der);
    sucesor.izq = nodo.izq;
    sucesor.der = nuevaDer;
    return sucesor;
  }

  _quitarMinimo(nodo) {
    if (nodo.izq === null) return nodo.der;
    nodo.izq = this._quitarMinimo(nodo.izq);
    return nodo;
  }

  minimo(nodo) {
    while (nodo.izq !== null) nodo = nodo.izq;
    return nodo;
  }

  /* ---------- Recorridos ---------- */

  generarRecorrido(tipo) {
    const eventos = [];
    this._recorrer(this.raiz, tipo, eventos);
    return eventos;
  }

  _recorrer(nodo, tipo, eventos) {
    if (nodo === null) return;

    eventos.push({ t: 'entra', nodo });
    if (tipo === 'preorden') eventos.push({ t: 'visita', nodo });

    this._recorrer(nodo.izq, tipo, eventos);
    if (tipo === 'inorden') eventos.push({ t: 'visita', nodo });

    this._recorrer(nodo.der, tipo, eventos);
    if (tipo === 'postorden') eventos.push({ t: 'visita', nodo });

    eventos.push({ t: 'sale', nodo });
  }

  recorrido(tipo) {
    return this.generarRecorrido(tipo)
      .filter((e) => e.t === 'visita')
      .map((e) => e.nodo.valor);
  }

  /* ---------- Propiedades del árbol ---------- */

  todosLosNodos() {
    const lista = [];
    const visitar = (n) => {
      if (n === null) return;
      lista.push(n);
      visitar(n.izq);
      visitar(n.der);
    };
    visitar(this.raiz);
    return lista;
  }

  alturaDe(nodo) {
    if (nodo === null) return -1;
    return 1 + Math.max(this.alturaDe(nodo.izq), this.alturaDe(nodo.der));
  }

  altura() {
    return this.alturaDe(this.raiz);
  }

  /** Grado máximo del árbol (el mayor grado entre todos sus nodos). */
  gradoMaximo() {
    if (this.estaVacio()) return 0;
    let max = 0;
    for (const n of this.todosLosNodos()) {
      const g = (n.izq ? 1 : 0) + (n.der ? 1 : 0);
      if (g > max) max = g;
      if (max === 2) break;
    }
    return max;
  }

  infoNodo(nodo) {
    const pasos = this.buscarRuta(nodo.valor).pasos;
    const grado = (nodo.izq ? 1 : 0) + (nodo.der ? 1 : 0);
    return {
      nivel: pasos.length - 1,
      altura: this.alturaDe(nodo),
      padre: pasos.length > 1 ? pasos[pasos.length - 2].nodo : null,
      grado,
      esHoja: nodo.esHoja(),
      esRaiz: nodo === this.raiz,
    };
  }
}