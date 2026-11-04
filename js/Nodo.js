/* ==========================================================
   Nodo.js · Nodo de un árbol binario (implementado desde cero)
   Cada nodo guarda un valor (número o carácter), referencias a
   sus hijos izquierdo y derecho, y un color propio e irrepetible.
   ========================================================== */

class Nodo {
  /**
   * @param {number|string} valor  Dato que guarda el nodo.
   */
  constructor(valor) {
    this.valor = valor;
    this.izq = null;          // hijo izquierdo
    this.der = null;          // hijo derecho
    this.id = ++Nodo.contador; // identificador único (sirve para animar posiciones)
    this.color = Nodo.colorParaId(this.id);
  }

  /** Un nodo es hoja si no tiene ningún hijo. */
  esHoja() {
    return this.izq === null && this.der === null;
  }

  /**
   * Genera un color distinto para cada id usando el "ángulo áureo"
   * (137.5°), que reparte los tonos de forma uniforme sin repetirlos.
   */
  static colorParaId(id) {
    const tono = (id * 137.508) % 360;
    return `hsl(${tono.toFixed(0)}, 68%, 42%)`;
  }
}

// Contador compartido por todos los nodos creados.
Nodo.contador = 0;
