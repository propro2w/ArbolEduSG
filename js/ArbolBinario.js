/* ==========================================================
   ArbolBinario.js · Árbol binario de búsqueda (desde cero)
   No usa ninguna estructura nativa que resuelva el árbol:
   solo la clase Nodo y referencias izq / der.
   ========================================================== */

class ArbolBinario {
  constructor() {
    this.raiz = null;
    this.tamano = 0;
  }

  /* ---------- Utilidades de valores ---------- */

  /**
   * Compara dos valores. Devuelve -1, 0 o 1.
   * Los números van antes que los caracteres; entre iguales se usa < y >.
   */
  static comparar(a, b) {
    const aNum = typeof a === 'number';
    const bNum = typeof b === 'number';
    if (aNum !== bNum) return aNum ? -1 : 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /** Convierte el texto escrito por el usuario en un número o un carácter. */
  static parsear(texto) {
    const t = String(texto).trim();
    if (t === '') return { error: 'Escribe un número o un carácter.' };
    if (/^-?\d+(\.\d+)?$/.test(t)) return { valor: Number(t) };
    if ([...t].length === 1) return { valor: t };
    return { error: 'Solo se permite un número o un único carácter (ej. 25 o K).' };
  }

  estaVacio() {
    return this.raiz === null;
  }

  vaciar() {
    this.raiz = null;
    this.tamano = 0;
  }

  /* ---------- Búsqueda ---------- */

  /**
   * Recorre el árbol desde la raíz buscando `valor` y registra cada paso.
   * Cada paso: { nodo, cmp, dir } donde dir es 'izq', 'der' o null (si se encontró).
   */
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

  /**
   * Inserta un valor. Devuelve el nodo creado o null si el valor ya existe.
   */
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

  /** Elimina un valor. Devuelve true si existía. */
  eliminar(valor) {
    const antes = this.tamano;
    this.raiz = this._eliminar(this.raiz, valor);
    return this.tamano < antes;
  }

  /** Versión recursiva: devuelve la nueva raíz del subárbol. */
  _eliminar(nodo, valor) {
    if (nodo === null) return null;

    const cmp = ArbolBinario.comparar(valor, nodo.valor);
    if (cmp < 0) { nodo.izq = this._eliminar(nodo.izq, valor); return nodo; }
    if (cmp > 0) { nodo.der = this._eliminar(nodo.der, valor); return nodo; }

    // Encontrado: tres casos
    this.tamano--;
    if (nodo.izq === null) return nodo.der;   // caso 1 (hoja) y caso 2 (solo hijo derecho)
    if (nodo.der === null) return nodo.izq;   // caso 2 (solo hijo izquierdo)

    // Caso 3: dos hijos → el sucesor inorden (mínimo del subárbol derecho) ocupa su lugar
    const sucesor = this.minimo(nodo.der);
    const nuevaDer = this._quitarMinimo(nodo.der);
    sucesor.izq = nodo.izq;
    sucesor.der = nuevaDer;
    return sucesor;
  }

  /** Quita el nodo mínimo de un subárbol y devuelve la nueva raíz de ese subárbol. */
  _quitarMinimo(nodo) {
    if (nodo.izq === null) return nodo.der;
    nodo.izq = this._quitarMinimo(nodo.izq);
    return nodo;
  }

  /** Nodo con el menor valor del subárbol. */
  minimo(nodo) {
    while (nodo.izq !== null) nodo = nodo.izq;
    return nodo;
  }

  /* ---------- Recorridos (recursivos) ---------- */

  /**
   * Genera la lista de eventos del recorrido para poder animarlo:
   *  - 'entra'  : se hace la llamada recursiva sobre el nodo
   *  - 'visita' : se procesa (imprime) el nodo
   *  - 'sale'   : termina la llamada y se regresa al padre
   * @param {'preorden'|'inorden'|'postorden'} tipo
   */
  generarRecorrido(tipo) {
    const eventos = [];
    this._recorrer(this.raiz, tipo, eventos);
    return eventos;
  }

  _recorrer(nodo, tipo, eventos) {
    if (nodo === null) return;                       // caso base

    eventos.push({ t: 'entra', nodo });
    if (tipo === 'preorden') eventos.push({ t: 'visita', nodo });

    this._recorrer(nodo.izq, tipo, eventos);
    if (tipo === 'inorden') eventos.push({ t: 'visita', nodo });

    this._recorrer(nodo.der, tipo, eventos);
    if (tipo === 'postorden') eventos.push({ t: 'visita', nodo });

    eventos.push({ t: 'sale', nodo });
  }

  /** Devuelve solo los valores visitados, en orden. */
  recorrido(tipo) {
    return this.generarRecorrido(tipo)
      .filter((e) => e.t === 'visita')
      .map((e) => e.nodo.valor);
  }

  /* ---------- Propiedades del árbol ---------- */

  /** Todos los nodos en preorden (útil para dibujar). */
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

  /** Altura de un subárbol: hoja = 0, vacío = -1. */
  alturaDe(nodo) {
    if (nodo === null) return -1;
    return 1 + Math.max(this.alturaDe(nodo.izq), this.alturaDe(nodo.der));
  }

  altura() {
    return this.alturaDe(this.raiz);
  }

  /** Datos de un nodo: nivel, altura, padre, grado y tipo. */
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
