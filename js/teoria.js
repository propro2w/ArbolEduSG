/* ==========================================================
   teoria.js · Módulo 2: Bloque teórico y glosario dinámico
   Cada concepto se explica y se señala en un árbol de ejemplo.
   ========================================================== */

class Teoria {
  constructor() {
    this.$ = (id) => document.getElementById(id);

    // Árbol de ejemplo (construido con nuestra propia clase)
    this.arbol = new ArbolBinario();
    [50, 30, 70, 20, 40, 60, 80, 35].forEach((v) => this.arbol.insertar(v));

    this.vis = new Visualizador(this.$('svg-teoria'), {
      alClickNodo: (nodo) => this.infoNodo(nodo),
    });
    this.vis.duracion = 500;

    this.terminos = this._definirTerminos();
    this._construirChips();
    this._construirGlosario();
    this.$('buscar-glosario').addEventListener('input', (e) => this._filtrarGlosario(e.target.value));

    this.vis.actualizar(this.arbol, false);
    this.seleccionar('raiz');
  }

  /* ---------- Definición de los conceptos ---------- */

  _definirTerminos() {
    const A = this.arbol;
    const V = this.vis;

    // Ayudas para marcar el árbol de ejemplo
    const N = (v) => A.buscarRuta(v).nodo;
    const camino = (v) => A.buscarRuta(v).pasos.map((p) => p.nodo);
    const marcar = (lista, estado) => lista.forEach((n) => V.marcar(n, estado));
    const subarbol = (n) => {
      const r = [];
      const f = (x) => { if (!x) return; r.push(x); f(x.izq); f(x.der); };
      f(n);
      return r;
    };
    // Pinta las aristas de una lista de nodos conectados (padre → hijo)
    const unir = (lista, conEtiqueta = true) => {
      for (let i = 1; i < lista.length; i++) {
        const hijo = lista[i];
        const dir = lista[i - 1].izq === hijo ? 'izq' : 'der';
        V.marcarArista(hijo, 'camino', conEtiqueta ? dir : '');
      }
    };
    const valores = (lista) => lista.map((n) => n.valor).join(', ');

    return [
      {
        id: 'nodo', nombre: 'Nodo',
        def: 'Es la unidad básica del árbol. Guarda un dato (el valor) y dos referencias: una al hijo izquierdo y otra al hijo derecho.',
        aplicar: () => { marcar(A.todosLosNodos(), 'camino'); return `Cada círculo es un nodo. Este árbol tiene ${A.tamano}.`; },
      },
      {
        id: 'raiz', nombre: 'Nodo raíz',
        def: 'Es el nodo de más arriba y el único que no tiene padre. Desde él se puede llegar a todos los demás nodos.',
        aplicar: () => { V.marcar(A.raiz, 'actual'); return `Aquí la raíz es ${A.raiz.valor}. Siempre está en el nivel 0.`; },
      },
      {
        id: 'padre', nombre: 'Padre',
        def: 'Nodo que tiene uno o dos hijos conectados justo debajo de él.',
        aplicar: () => {
          const p = N(30);
          V.marcar(p, 'actual'); marcar([p.izq, p.der], 'camino'); unir([p, p.izq]); unir([p, p.der]);
          return `${p.valor} es el padre de ${p.izq.valor} y ${p.der.valor}.`;
        },
      },
      {
        id: 'hijo', nombre: 'Hijo (izquierdo y derecho)',
        def: 'Nodo conectado directamente debajo de otro. En un árbol binario cada nodo tiene como máximo dos hijos: uno izquierdo y uno derecho.',
        aplicar: () => {
          const p = N(30);
          V.marcar(p, 'camino'); marcar([p.izq, p.der], 'actual'); unir([p, p.izq]); unir([p, p.der]);
          return `${p.izq.valor} es el hijo izquierdo de ${p.valor} y ${p.der.valor} es el hijo derecho.`;
        },
      },
      {
        id: 'hermanos', nombre: 'Hermanos',
        def: 'Nodos que comparten el mismo padre.',
        aplicar: () => {
          const p = N(30);
          V.marcar(p, 'camino'); marcar([p.izq, p.der], 'actual'); unir([p, p.izq], false); unir([p, p.der], false);
          return `${p.izq.valor} y ${p.der.valor} son hermanos porque ambos son hijos de ${p.valor}.`;
        },
      },
      {
        id: 'hoja', nombre: 'Hoja',
        def: 'Nodo que no tiene hijos. Marca el final de una rama.',
        aplicar: () => {
          const hojas = A.todosLosNodos().filter((n) => n.esHoja());
          marcar(hojas, 'encontrado');
          return `Las hojas de este árbol son: ${valores(hojas)}.`;
        },
      },
      {
        id: 'interno', nombre: 'Nodo interno',
        def: 'Cualquier nodo que tiene al menos un hijo; es decir, todos los que no son hojas (la raíz también cuenta, si tiene hijos).',
        aplicar: () => {
          const internos = A.todosLosNodos().filter((n) => !n.esHoja());
          marcar(internos, 'actual');
          return `Nodos internos: ${valores(internos)}.`;
        },
      },
      {
        id: 'subarbol', nombre: 'Subárbol',
        def: 'Un nodo junto con todos sus descendientes forma un subárbol. Cada hijo de la raíz es la raíz de un subárbol: el izquierdo y el derecho.',
        aplicar: () => {
          V.marcar(A.raiz, 'actual');
          const izq = subarbol(A.raiz.izq), der = subarbol(A.raiz.der);
          marcar(izq, 'camino'); marcar(der, 'visitado');
          return `Subárbol izquierdo (azul): ${valores(izq)}. Subárbol derecho (verde): ${valores(der)}.`;
        },
      },
      {
        id: 'grado', nombre: 'Grado',
        def: 'Es la cantidad de hijos que tiene un nodo. En un árbol binario el grado va de 0 (hoja) a 2.',
        aplicar: () => {
          const dos = A.todosLosNodos().filter((n) => n.izq && n.der);
          marcar(dos, 'actual');
          return `Tienen grado 2: ${valores(dos)}. El 40 tiene grado 1 (solo hijo izquierdo) y las hojas tienen grado 0.`;
        },
      },
      {
        id: 'nivel', nombre: 'Nivel',
        def: 'Es la distancia desde la raíz, contada en saltos. La raíz está en el nivel 0, sus hijos en el nivel 1, sus nietos en el 2, y así sucesivamente.',
        aplicar: () => {
          V.mostrarNiveles = true;
          const n2 = A.todosLosNodos().filter((n) => A.infoNodo(n).nivel === 2);
          marcar(n2, 'actual');
          return `Los nodos del nivel 2 son: ${valores(n2)}.`;
        },
      },
      {
        id: 'altura', nombre: 'Altura',
        def: 'Es el número de aristas del camino más largo que va desde el nodo hasta una hoja. La altura del árbol es la altura de su raíz. Un árbol con un solo nodo tiene altura 0.',
        aplicar: () => {
          const c = camino(35);
          marcar(c, 'camino'); V.marcar(c[c.length - 1], 'actual'); unir(c, false);
          return `El camino más largo es ${valores(c)}: tiene ${c.length - 1} aristas, así que la altura del árbol es ${A.altura()}.`;
        },
      },
      {
        id: 'profundidad', nombre: 'Profundidad',
        def: 'Es el número de aristas que hay entre la raíz y un nodo. Coincide con el nivel del nodo.',
        aplicar: () => {
          const c = camino(40);
          marcar(c, 'camino'); V.marcar(c[c.length - 1], 'actual'); unir(c, false);
          return `Para llegar al 40 se pasa por ${valores(c)}: son ${c.length - 1} aristas, por eso su profundidad es ${c.length - 1}.`;
        },
      },
      {
        id: 'camino', nombre: 'Camino',
        def: 'Secuencia de nodos conectados, de arriba hacia abajo, que lleva de un nodo a otro.',
        aplicar: () => {
          const c = camino(60);
          marcar(c, 'camino'); V.marcar(c[c.length - 1], 'actual'); unir(c);
          return `Camino de la raíz al 60: ${c.map((n) => n.valor).join(' → ')}.`;
        },
      },
      {
        id: 'ancestros', nombre: 'Ancestros y descendientes',
        def: 'Los ancestros de un nodo son todos los que están en el camino hacia la raíz (sin contarlo). Los descendientes son todos los que cuelgan de él.',
        aplicar: () => {
          const c = camino(30);
          const desc = subarbol(N(30)).slice(1);
          V.marcar(N(30), 'actual'); marcar(c.slice(0, -1), 'camino'); marcar(desc, 'visitado');
          return `Del 30: ancestro → ${valores(c.slice(0, -1))} (azul). Descendientes → ${valores(desc)} (verde).`;
        },
      },
      {
        id: 'abb', nombre: 'Árbol binario de búsqueda',
        def: 'Es un árbol binario con una regla: en cada nodo, todo lo que está a su izquierda es menor y todo lo que está a su derecha es mayor. Gracias a esto, buscar descarta la mitad del camino en cada paso.',
        aplicar: () => {
          V.marcar(A.raiz, 'actual');
          marcar(subarbol(A.raiz.izq), 'camino'); marcar(subarbol(A.raiz.der), 'visitado');
          return `Todo lo de la izquierda de ${A.raiz.valor} es menor (azul) y todo lo de la derecha es mayor (verde).`;
        },
      },
      {
        id: 'recorridos', nombre: 'Recorridos',
        def: 'Son las formas de visitar todos los nodos una sola vez. Preorden visita Raíz-Izq-Der, Inorden visita Izq-Raíz-Der y Postorden visita Izq-Der-Raíz. En un árbol de búsqueda, el inorden devuelve los valores ordenados.',
        aplicar: () => {
          const ino = A.recorrido('inorden');
          return `Inorden del árbol de ejemplo: ${ino.join(', ')}. ¡Sale ordenado! Pruébalo en el Simulador.`;
        },
      },
    ];
  }

  /* ---------- Interfaz ---------- */

  _construirChips() {
    const cont = this.$('chips');
    this.terminos.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = t.nombre;
      b.dataset.id = t.id;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => this.seleccionar(t.id));
      cont.appendChild(b);
    });
  }

  /** Muestra un concepto: texto + resaltado en el árbol. */
  seleccionar(id) {
    const t = this.terminos.find((x) => x.id === id);
    if (!t) return;

    document.querySelectorAll('#chips .chip').forEach((c) =>
      c.setAttribute('aria-pressed', String(c.dataset.id === id)));

    this.vis.limpiarEstados();
    this.vis.mostrarNiveles = false;
    const nota = t.aplicar();
    this.vis.dibujar();
    this._mostrarDetalle(t.nombre, t.def, nota);
  }

  /** Datos de un nodo del árbol de ejemplo al hacer clic sobre él. */
  infoNodo(nodo) {
    document.querySelectorAll('#chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    this.vis.limpiarEstados();
    this.vis.mostrarNiveles = false;
    this.vis.marcar(nodo, 'actual');

    const i = this.arbol.infoNodo(nodo);
    const tipo = i.esRaiz ? 'raíz' : i.esHoja ? 'hoja' : 'nodo interno';
    const def = `Nivel ${i.nivel} · Altura ${i.altura} · Grado ${i.grado} · Tipo: ${tipo}.`;
    const nota = `Padre: ${i.padre ? i.padre.valor : 'ninguno'} · Hijo izquierdo: ${nodo.izq ? nodo.izq.valor : '—'} · Hijo derecho: ${nodo.der ? nodo.der.valor : '—'}.`;
    this._mostrarDetalle(`Nodo ${nodo.valor}`, def, nota);
  }

  _mostrarDetalle(titulo, def, nota) {
    this.$('t-titulo').textContent = titulo;
    this.$('t-def').textContent = def;
    this.$('t-nota').textContent = nota;
    // Reinicia la animación de entrada
    const d = this.$('detalle');
    d.classList.remove('entra');
    void d.offsetWidth;
    d.classList.add('entra');
  }

  /* ---------- Glosario ---------- */

  _construirGlosario() {
    const cont = this.$('glosario');
    this.terminos.forEach((t) => {
      const det = document.createElement('details');
      det.dataset.busca = `${t.nombre} ${t.def}`.toLowerCase();

      const sum = document.createElement('summary');
      sum.textContent = t.nombre;
      det.appendChild(sum);

      const cuerpo = document.createElement('div');
      cuerpo.className = 'cuerpo';
      const p = document.createElement('p');
      p.textContent = t.def;
      const btn = document.createElement('button');
      btn.className = 'btn suave';
      btn.textContent = 'Verlo en el árbol';
      btn.addEventListener('click', () => {
        this.seleccionar(t.id);
        this.$('svg-teoria').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      cuerpo.append(p, btn);
      det.appendChild(cuerpo);
      cont.appendChild(det);
    });

    const vacio = document.createElement('p');
    vacio.className = 'vacio-g';
    vacio.id = 'glosario-vacio';
    vacio.textContent = 'No hay términos que coincidan con tu búsqueda.';
    vacio.hidden = true;
    cont.appendChild(vacio);
  }

  _filtrarGlosario(texto) {
    const q = texto.trim().toLowerCase();
    let visibles = 0;
    document.querySelectorAll('#glosario details').forEach((d) => {
      const coincide = q === '' || d.dataset.busca.includes(q);
      d.hidden = !coincide;
      if (coincide) visibles++;
    });
    this.$('glosario-vacio').hidden = visibles > 0;
  }
}
