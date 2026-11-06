/* ==========================================================
   ArbolBinario.js · Árbol binario de búsqueda (desde cero)
   ========================================================== */

class ArbolBinario {
  constructor() {
    this.raiz = null;
    this.tamano = 0;
  }

  static comparar(a, b) {
    const aNum = typeof a === 'number';
    const bNum = typeof b === 'number';
    if (aNum !== bNum) return aNum ? -1 : 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  static parsear(texto, modo = 'numerico') {
    const t = String(texto).trim();
    if (t === '') return { error: 'Escribe un valor.' };

    if (modo === 'numerico') {
      if (/^-?\d+$/.test(t)) return { valor: Number(t) };
      if (/^-?\d+\.\d+$/.test(t)) return { error: 'No se permiten números decimales, solo enteros.' };
      return { error: 'En modo numérico solo se permiten enteros (ej. 42).' };
    }

    if (modo === 'letras') {
      if (/^[a-zA-Z]$/.test(t)) return { valor: t.toUpperCase() };
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

  insertar(valor) {
    const nuevo = new Nodo(valor);
    if (this.raiz === null) {
      this.raiz = nuevo;
      this.tamano++;
      return nuevo;
    }

    let actual = this.raiz;
    while (true) {
      const cmp = ArbolBinario.comparar(valor, actual.valor);
      const dir = cmp < 0 ? 'izq' : 'der';
      if (actual[dir] === null) {
        actual[dir] = nuevo;
        break;
      }
      actual = actual[dir];
    }
    this.tamano++;
    return nuevo;
  }

  eliminar(valor) {
    const antes = this.tamano;
    this.raiz = this._eliminar(this.raiz, valor);
    return this.tamano < antes;
  }

  _eliminar(nodo, valor) {
    if (nodo === null) return null;

    const cmp = ArbolBinario.comparar(valor, nodo.valor);
    if (cmp < 0) {
      nodo.izq = this._eliminar(nodo.izq, valor);
      return nodo;
    }
    if (cmp > 0) {
      nodo.der = this._eliminar(nodo.der, valor);
      return nodo;
    }

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

  generarRecorrido(tipo) {
    const eventos = [];
    this._recorrer(this.raiz, tipo, eventos, []);
    return eventos;
  }

  _recorrer(nodo, tipo, eventos, pila = []) {
    if (nodo === null) return;
    pila.push(`${tipo}(${nodo.valor})`);
    eventos.push({ t: 'entra', nodo, pila: [...pila] });

    if (tipo === 'preorden') eventos.push({ t: 'visita', nodo, pila: [...pila] });
    this._recorrer(nodo.izq, tipo, eventos, pila);
    if (tipo === 'inorden') eventos.push({ t: 'visita', nodo, pila: [...pila] });
    this._recorrer(nodo.der, tipo, eventos, pila);
    if (tipo === 'postorden') eventos.push({ t: 'visita', nodo, pila: [...pila] });

    eventos.push({ t: 'sale', nodo, pila: [...pila] });
    pila.pop();
  }

  recorrido(tipo) {
    return this.generarRecorrido(tipo)
      .filter((e) => e.t === 'visita')
      .map((e) => e.nodo.valor);
  }

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

  contarSubarboles() {
    if (!this.raiz) return { izq: 0, der: 0 };
    const contar = (n) => (n === null ? 0 : 1 + contar(n.izq) + contar(n.der));
    return {
      izq: this.raiz.izq ? contar(this.raiz.izq) : 0,
      der: this.raiz.der ? contar(this.raiz.der) : 0,
    };
  }

  contarSubarbolNodo(nodo) {
    if (!nodo) return { izq: 0, der: 0 };
    const contar = (n) => (n === null ? 0 : 1 + contar(n.izq) + contar(n.der));
    return {
      izq: nodo.izq ? contar(nodo.izq) : 0,
      der: nodo.der ? contar(nodo.der) : 0,
    };
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