/* ==========================================================
   teoria.js · Módulo 2: Bloque teórico y animaciones en bucle
   ========================================================== */

class Teoria {
  constructor() {
    this.$ = (id) => document.getElementById(id);

    // Árbol de ejemplo para la teoría interactiva
    this.arbol = new ArbolBinario();
    [50, 30, 70, 20, 40, 60, 80, 35].forEach((v) => this.arbol.insertar(v));

    this.vis = new Visualizador(this.$('svg-teoria'), {
      alClickNodo: (nodo) => this.infoNodo(nodo),
    });
    this.vis.duracion = 500;

    this.terminos = this._definirTerminos();
    this._construirChips();

    this.vis.actualizar(this.arbol, false);
    this.seleccionar('raiz');

    // Inicializar animaciones de recorridos en bucle
    this._iniciarAnimacionesRecorridos();
  }

  /* ---------- Definición de los conceptos ---------- */

  _definirTerminos() {
    const A = this.arbol;
    const V = this.vis;

    const N = (v) => A.buscarRuta(v).nodo;
    const camino = (v) => A.buscarRuta(v).pasos.map((p) => p.nodo);
    const marcar = (lista, estado) => lista.forEach((n) => V.marcar(n, estado));
    const subarbol = (n) => {
      const r = [];
      const f = (x) => { if (!x) return; r.push(x); f(x.izq); f(x.der); };
      f(n);
      return r;
    };
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
        def: 'Cualquier nodo que tiene al menos un hijo; es decir, todos los que no son hojas.',
        aplicar: () => {
          const internos = A.todosLosNodos().filter((n) => !n.esHoja());
          marcar(internos, 'actual');
          return `Nodos internos: ${valores(internos)}.`;
        },
      },
      {
        id: 'subarbol', nombre: 'Subárbol',
        def: 'Un nodo junto con todos sus descendientes forma un subárbol.',
        aplicar: () => {
          V.marcar(A.raiz, 'actual');
          const izq = subarbol(A.raiz.izq), der = subarbol(A.raiz.der);
          marcar(izq, 'camino'); marcar(der, 'visitado');
          return `Subárbol izquierdo (azul): ${valores(izq)}. Subárbol derecho (verde): ${valores(der)}.`;
        },
      },
      {
        id: 'grado', nombre: 'Grado',
        def: 'Es la cantidad de hijos que tiene un nodo. En un árbol binario el grado va de 0 a 2.',
        aplicar: () => {
          const dos = A.todosLosNodos().filter((n) => n.izq && n.der);
          marcar(dos, 'actual');
          return `Tienen grado 2: ${valores(dos)}. El 40 tiene grado 1 y las hojas tienen grado 0.`;
        },
      },
      {
        id: 'nivel', nombre: 'Nivel',
        def: 'Es la distancia desde la raíz, contada en saltos. La raíz está en el nivel 0.',
        aplicar: () => {
          V.mostrarNiveles = true;
          const n2 = A.todosLosNodos().filter((n) => A.infoNodo(n).nivel === 2);
          marcar(n2, 'actual');
          return `Los nodos del nivel 2 son: ${valores(n2)}.`;
        },
      },
      {
        id: 'altura', nombre: 'Altura',
        def: 'Es el número de aristas del camino más largo que va desde el nodo hasta una hoja.',
        aplicar: () => {
          const c = camino(35);
          marcar(c, 'camino'); V.marcar(c[c.length - 1], 'actual'); unir(c, false);
          return `El camino más largo es ${valores(c)}: la altura del árbol es ${A.altura()}.`;
        },
      },
      {
        id: 'profundidad', nombre: 'Profundidad',
        def: 'Es el número de aristas que hay entre la raíz y un nodo.',
        aplicar: () => {
          const c = camino(40);
          marcar(c, 'camino'); V.marcar(c[c.length - 1], 'actual'); unir(c, false);
          return `Para llegar al 40 se pasa por ${valores(c)}: su profundidad es ${c.length - 1}.`;
        },
      },
      {
        id: 'camino', nombre: 'Camino',
        def: 'Secuencia de nodos conectados que lleva de un nodo a otro.',
        aplicar: () => {
          const c = camino(60);
          marcar(c, 'camino'); V.marcar(c[c.length - 1], 'actual'); unir(c);
          return `Camino de la raíz al 60: ${c.map((n) => n.valor).join(' → ')}.`;
        },
      },
      {
        id: 'abb', nombre: 'Árbol binario de búsqueda',
        def: 'En cada nodo, todo lo que está a su izquierda es menor y lo que está a su derecha es mayor.',
        aplicar: () => {
          V.marcar(A.raiz, 'actual');
          marcar(subarbol(A.raiz.izq), 'camino'); marcar(subarbol(A.raiz.der), 'visitado');
          return `A la izquierda de ${A.raiz.valor} valores menores (azul), a la derecha mayores (verde).`;
        },
      }
    ];
  }

  /* ---------- Interfaz Teórica ---------- */

  _construirChips() {
    const cont = this.$('chips');
    if (!cont) return;
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
    const d = this.$('detalle');
    d.classList.remove('entra');
    void d.offsetWidth;
    d.classList.add('entra');
  }

  /* ---------- Animaciones de Recorridos en Bucle ---------- */

  _iniciarAnimacionesRecorridos() {
    // Estructura del mini árbol de ejemplo:
    //         A
    //       /   \
    //      B     C
    //     / \
    //    D   E
    const nodosConfig = {
      A: { x: 100, y: 25, label: 'A' },
      B: { x: 50,  y: 75, label: 'B' },
      C: { x: 150, y: 75, label: 'C' },
      D: { x: 25,  y: 125, label: 'D' },
      E: { x: 75,  y: 125, label: 'E' }
    };

    const aristasConfig = [
      { id: 'arista-A-B', x1: 100, y1: 25, x2: 50,  y2: 75 },
      { id: 'arista-A-C', x1: 100, y1: 25, x2: 150, y2: 75 },
      { id: 'arista-B-D', x1: 50,  y1: 75, x2: 25,  y2: 125 },
      { id: 'arista-B-E', x1: 50,  y1: 75, x2: 75,  y2: 125 }
    ];

    const secuenciaPreorden  = ['A', 'B', 'D', 'E', 'C'];
    const secuenciaInorden   = ['D', 'B', 'E', 'A', 'C'];
    const secuenciaPostorden = ['D', 'E', 'B', 'C', 'A'];

    const renderSVG = (svgId, secuencia) => {
      const svg = document.getElementById(svgId);
      if (!svg) return;
      svg.innerHTML = '';

      // Dibujar Aristas
      aristasConfig.forEach(a => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', a.x1);
        line.setAttribute('y1', a.y1);
        line.setAttribute('x2', a.x2);
        line.setAttribute('y2', a.y2);
        line.setAttribute('stroke', 'var(--arista, #94a3b8)');
        line.setAttribute('stroke-width', '2.5');
        svg.appendChild(line);
      });

      // Dibujar Nodos
      const elementosNodo = {};
      Object.keys(nodosConfig).forEach(key => {
        const n = nodosConfig[key];
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', n.x);
        circle.setAttribute('cy', n.y);
        circle.setAttribute('r', '15');
        circle.setAttribute('fill', 'var(--nodo-bg, #ffffff)');
        circle.setAttribute('stroke', 'var(--primario, #2f6bff)');
        circle.setAttribute('stroke-width', '2.5');
        circle.style.transition = 'all 0.3s ease';

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', n.x);
        text.setAttribute('y', n.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12px');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', 'var(--tinta-1, #1e293b)');
        text.textContent = n.label;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);

        elementosNodo[key] = circle;
      });

      // Bucle de Animación
      let paso = 0;
      setInterval(() => {
        // Reiniciar todos
        Object.keys(elementosNodo).forEach(k => {
          elementosNodo[k].setAttribute('fill', 'var(--nodo-bg, #ffffff)');
          elementosNodo[k].setAttribute('stroke', 'var(--primario, #2f6bff)');
        });

        const actual = secuencia[paso];
        if (elementosNodo[actual]) {
          elementosNodo[actual].setAttribute('fill', '#ffd23f');
          elementosNodo[actual].setAttribute('stroke', '#e5a100');
        }

        paso = (paso + 1) % secuencia.length;
      }, 1000);
    };

    renderSVG('anim-preorden', secuenciaPreorden);
    renderSVG('anim-inorden', secuenciaInorden);
    renderSVG('anim-postorden', secuenciaPostorden);
  }
}