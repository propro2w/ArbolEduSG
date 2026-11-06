/* ==========================================================
   simulador.js · Módulo 1: Simulador visual e interactivo
   ========================================================== */

class Cancelado extends Error {}

class Simulador {
  constructor() {
    this.$ = (id) => document.getElementById(id);
    this.arbol = new ArbolBinario();
    this.vis = new Visualizador(this.$('svg-sim'));

    this.ocupado = false;
    this.cancelar = false;
    this._siguiente = null;
    this.pilaNodos = [];
    this.salidaEl = null;
    this.modoActual = 'numerico';

    this._enlazarEventos();
    this._actualizarVelocidad();
    this.vis.actualizar(this.arbol, false);
    this.actualizarStats();
  }

  _enlazarEventos() {
    const $ = this.$;
    $('btn-insertar').addEventListener('click', () => this.insertar());
    $('btn-eliminar').addEventListener('click', () => this.eliminar());
    $('btn-buscar').addEventListener('click', () => this.buscar());
    $('valor').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.insertar(); });

    $('tipo-arbol').addEventListener('change', (e) => {
      const modo = e.target.value;
      $('valor').placeholder = modo === 'numerico' ? 'Ej. 42' : 'Ej. K';
      if (!this.arbol.estaVacio()) {
        if (confirm('Cambiar el tipo de árbol vaciará el lienzo actual. ¿Deseas continuar?')) {
          this.cargar([], 'Árbol cambiado a modo ' + (modo === 'numerico' ? 'Enteros' : 'Letras'));
        } else {
          e.target.value = this.modoActual;
        }
      } else {
        this.actualizarStats();
      }
      this.modoActual = $('tipo-arbol').value;
    });

    $('btn-preorden').addEventListener('click', () => this.recorrer('preorden'));
    $('btn-inorden').addEventListener('click', () => this.recorrer('inorden'));
    $('btn-postorden').addEventListener('click', () => this.recorrer('postorden'));

    $('btn-ejemplo').addEventListener('click', () => {
      const modo = $('tipo-arbol').value;
      const datos = modo === 'numerico' ? [50, 30, 70, 20, 40, 60, 80, 35] : ['M', 'F', 'T', 'B', 'H', 'P', 'W', 'K'];
      this.cargar(datos, 'Árbol de ejemplo cargado.');
    });
    $('btn-aleatorio').addEventListener('click', () => this.cargar(this._valoresAleatorios(), 'Árbol aleatorio generado.'));
    $('btn-limpiar').addEventListener('click', () => this.cargar([], 'Árbol vaciado.'));

    $('velocidad').addEventListener('input', () => this._actualizarVelocidad());
    $('chk-niveles').addEventListener('change', (e) => { this.vis.mostrarNiveles = e.target.checked; this.vis.dibujar(); });

    $('btn-siguiente').addEventListener('click', () => this._liberarSiguiente());
    $('btn-detener').addEventListener('click', () => {
      if (!this.ocupado) return;
      this.cancelar = true;
      this._liberarSiguiente();
    });
  }

  retardo() { return 1500 - Number(this.$('velocidad').value) * 130; }

  _actualizarVelocidad() { this.vis.duracion = Math.min(500, this.retardo() * 0.55); }

  _liberarSiguiente() {
    if (this._siguiente) { const r = this._siguiente; this._siguiente = null; r(); }
  }

  async esperar(factor = 1, omitirManual = false) {
    if (this.cancelar) throw new Cancelado();
    const manual = this.$('modo-manual').checked;
    if (manual && !omitirManual) {
      this.$('btn-siguiente').disabled = false;
      await new Promise((r) => { this._siguiente = r; });
      this.$('btn-siguiente').disabled = true;
    } else {
      await dormir(manual ? 150 : this.retardo() * factor);
    }
    if (this.cancelar) throw new Cancelado();
  }

  async ejecutar(titulo, fn) {
    if (this.ocupado) return;
    this.ocupado = true;
    this.cancelar = false;
    this._bloquear(true);
    this.vis.limpiarEstados();
    this.limpiarBitacora();
    this.$('estado-op').textContent = titulo;
    try {
      await fn();
    } catch (e) {
      if (e instanceof Cancelado) {
        this.log('Animación detenida.', 'aviso');
        this.vis.limpiarEstados();
        this.pilaNodos = [];
        this.renderPila();
      } else {
        console.error(e);
        mostrarToast('Ocurrió un error: ' + e.message);
      }
    } finally {
      this.ocupado = false;
      this._siguiente = null;
      this._bloquear(false);
      this.$('btn-siguiente').disabled = true;
      this.$('estado-op').textContent = 'Listo';
      this.actualizarStats();
    }
  }

  _bloquear(si) {
    document.querySelectorAll('#mod-simulador .accion').forEach((b) => { b.disabled = si; });
    this.$('btn-detener').disabled = !si;
  }

  leerValor() {
    const modo = this.$('tipo-arbol').value;
    const r = ArbolBinario.parsear(this.$('valor').value, modo);
    if (r.error) {
      mostrarToast(r.error);
      this.$('valor').focus();
      return null;
    }
    return r;
  }

  _textoCmp(v, nodoValor, cmp) {
    if (cmp === 0) return `${v} = ${nodoValor}: ¡lo encontré!`;
    return cmp < 0
      ? `Comparo ${v} con ${nodoValor}: ${v} < ${nodoValor} → voy a la izquierda`
      : `Comparo ${v} con ${nodoValor}: ${v} > ${nodoValor} → voy a la derecha`;
  }

  async insertar() {
    if (this.ocupado) return;
    const lectura = this.leerValor();
    if (!lectura) return;
    const v = lectura.valor;

    if (this.arbol.buscarRuta(v).encontrado) {
      mostrarToast(`El valor ${v} ya existe: este árbol no admite repetidos.`);
      return;
    }

    await this.ejecutar(`Insertar ${v}`, async () => {
      const ruta = this.arbol.buscarRuta(v);
      this.$('valor').value = '';

      if (this.arbol.estaVacio()) {
        this.log(`El árbol está vacío: ${v} será la raíz.`);
        await this.esperar(0.6);
      } else {
        this.vis.fantasma = { valor: v, color: Nodo.colorParaId(Nodo.contador + 1) };
        this.log(`Empiezo en la raíz con el valor ${v}.`);

        for (const paso of ruta.pasos) {
          await this.vis.colocar('fantasma', paso.nodo);
          this.vis.marcar(paso.nodo, 'actual');
          this.log(this._textoCmp(v, paso.nodo.valor, paso.cmp));
          await this.esperar();

          this.vis.marcar(paso.nodo, 'camino');
          const hijo = paso.nodo[paso.dir];
          if (hijo) this.vis.marcarArista(hijo, 'camino', paso.dir);
        }

        const ultimo = ruta.pasos[ruta.pasos.length - 1];
        this.vis.marcarNulo(ultimo.nodo, ultimo.dir);
        this.log(`El hijo ${ultimo.dir === 'izq' ? 'izquierdo' : 'derecho'} de ${ultimo.nodo.valor} está vacío: aquí va ${v}.`);
        await this.esperar();
        this.vis.quitar('fantasma');
        this.vis.nulo = null;
      }

      const nuevo = this.arbol.insertar(v);
      await this.vis.actualizar(this.arbol);
      this.vis.marcar(nuevo, 'encontrado');
      this.log(`Listo: ${v} insertado.`, 'ok');
    });
  }

  async buscar() {
    if (this.ocupado) return;
    const lectura = this.leerValor();
    if (!lectura) return;
    const v = lectura.valor;

    if (this.arbol.estaVacio()) { mostrarToast('El árbol está vacío.'); return; }

    await this.ejecutar(`Buscar ${v}`, async () => {
      const ruta = this.arbol.buscarRuta(v);
      this.vis.puntero = true;
      this.log(`Busco ${v} empezando en la raíz.`);

      for (const paso of ruta.pasos) {
        await this.vis.colocar('puntero', paso.nodo);
        this.vis.marcar(paso.nodo, 'actual');
        this.log(this._textoCmp(v, paso.nodo.valor, paso.cmp), paso.cmp === 0 ? 'ok' : '');
        await this.esperar();

        if (paso.cmp === 0) break;
        this.vis.marcar(paso.nodo, 'camino');
        const hijo = paso.nodo[paso.dir];
        if (hijo) this.vis.marcarArista(hijo, 'camino', paso.dir);
      }

      if (ruta.encontrado) {
        this.vis.marcar(ruta.nodo, 'encontrado');
        this.log(`Encontrado: ${v} está en el árbol (se revisaron ${ruta.pasos.length} nodos).`, 'ok');
      } else {
        const ultimo = ruta.pasos[ruta.pasos.length - 1];
        this.vis.marcarNulo(ultimo.nodo, ultimo.dir);
        this.log(`Llegué a un hueco vacío: ${v} no existe en el árbol.`, 'error');
      }
      this.vis.quitar('puntero');
    });
  }

  async eliminar() {
    if (this.ocupado) return;
    const lectura = this.leerValor();
    if (!lectura) return;
    const v = lectura.valor;

    if (this.arbol.estaVacio()) { mostrarToast('El árbol está vacío.'); return; }

    await this.ejecutar(`Eliminar ${v}`, async () => {
      const ruta = this.arbol.buscarRuta(v);
      this.vis.puntero = true;
      this.log(`Primero busco ${v} en el árbol.`);

      for (const paso of ruta.pasos) {
        await this.vis.colocar('puntero', paso.nodo);
        this.vis.marcar(paso.nodo, 'actual');
        this.log(this._textoCmp(v, paso.nodo.valor, paso.cmp));
        await this.esperar();
        if (paso.cmp === 0) break;
        this.vis.marcar(paso.nodo, 'camino');
        const hijo = paso.nodo[paso.dir];
        if (hijo) this.vis.marcarArista(hijo, 'camino', paso.dir);
      }

      if (!ruta.encontrado) {
        const ultimo = ruta.pasos[ruta.pasos.length - 1];
        this.vis.marcarNulo(ultimo.nodo, ultimo.dir);
        this.vis.quitar('puntero');
        this.log(`${v} no existe: no hay nada que eliminar.`, 'error');
        return;
      }

      const nodo = ruta.nodo;
      this.$('valor').value = '';
      this.vis.marcar(nodo, 'eliminar');

      if (nodo.esHoja()) {
        this.log(`Caso 1: ${v} es una hoja → se elimina directamente.`);
      } else if (!nodo.izq || !nodo.der) {
        const hijo = nodo.izq || nodo.der;
        this.vis.marcar(hijo, 'visitado');
        this.log(`Caso 2: ${v} tiene un solo hijo (${hijo.valor}) → el hijo ocupa su lugar.`);
      } else {
        this.log(`Caso 3: ${v} tiene dos hijos → lo reemplaza su sucesor inorden (el menor del subárbol derecho).`);
        await this.esperar();
        let actual = nodo.der;
        this.vis.marcarArista(actual, 'camino', 'der');
        while (actual) {
          await this.vis.colocar('puntero', actual);
          this.vis.marcar(actual, 'actual');
          if (actual.izq) {
            this.log(`${actual.valor} aún tiene hijo izquierdo → sigo bajando por la izquierda.`);
            await this.esperar();
            this.vis.marcar(actual, 'camino');
            this.vis.marcarArista(actual.izq, 'camino', 'izq');
            actual = actual.izq;
          } else {
            break;
          }
        }
        this.vis.marcar(actual, 'encontrado');
        this.log(`El sucesor es ${actual.valor}: ocupará el lugar de ${v}.`);
      }

      await this.esperar();
      this.vis.quitar('puntero');
      this.arbol.eliminar(v);
      this.vis.limpiarEstados();
      await this.vis.actualizar(this.arbol);
      this.log(`Listo: ${v} eliminado.`, 'ok');
    });
  }

  async recorrer(tipo) {
    if (this.ocupado) return;
    if (this.arbol.estaVacio()) { mostrarToast('El árbol está vacío: inserta valores primero.'); return; }

    const reglas = {
      preorden: ['Preorden', 'Raíz → Izquierdo → Derecho'],
      inorden: ['Inorden', 'Izquierdo → Raíz → Derecho'],
      postorden: ['Postorden', 'Izquierdo → Derecho → Raíz'],
    };
    const [nombre, regla] = reglas[tipo];

    await this.ejecutar(`Recorrido ${nombre}`, async () => {
      this.consolaInicio(`${tipo}(raiz)   // ${regla}`);
      this.pilaNodos = [];
      this.renderPila(tipo);
      const salida = [];
      this.vis.puntero = true;
      this.log(`Recorrido ${nombre}: ${regla}.`);

      for (const ev of this.arbol.generarRecorrido(tipo)) {
        const n = ev.nodo;

        if (ev.t === 'entra') {
          const padre = this.pilaNodos[this.pilaNodos.length - 1];
          if (padre && this.vis.estadoDe(padre) !== 'visitado') this.vis.marcar(padre, 'camino');
          this.pilaNodos.push(n);
          this.renderPila(tipo);
          this.vis.marcar(n, 'actual');
          await this.vis.colocar('puntero', n);
          this.log(`Llamada ${tipo}(${n.valor})`);
          await this.esperar(0.7);

        } else if (ev.t === 'visita') {
          salida.push(n.valor);
          this.vis.marcar(n, 'visitado');
          this.consolaChip(n.valor);
          this.log(`Visito ${n.valor} → se imprime en la consola.`, 'ok');
          await this.esperar();

        } else {
          this.pilaNodos.pop();
          this.renderPila(tipo);
          const tope = this.pilaNodos[this.pilaNodos.length - 1];
          if (tope) {
            if (this.vis.estadoDe(tope) !== 'visitado') this.vis.marcar(tope, 'actual');
            await this.vis.colocar('puntero', tope);
            this.log(`Termina ${tipo}(${n.valor}); regreso a ${tipo}(${tope.valor}).`);
            await this.esperar(0.5, true);
          } else {
            this.log(`Termina ${tipo}(${n.valor}): se cerró la primera llamada.`);
          }
        }
      }

      this.vis.quitar('puntero');
      this.consolaLinea(`Resultado: ${salida.join(', ')}`, 'res');
      this.log(`Recorrido terminado: ${salida.join(' → ')}`, 'ok');
    });
  }

  _valoresAleatorios() {
    const modo = this.$('tipo-arbol').value;
    const set = new Set();
    if (modo === 'numerico') {
      while (set.size < 8) set.add(aleatorioEntre(1, 99));
    } else {
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      while (set.size < 8) set.add(letras[aleatorioEntre(0, 25)]);
    }
    return [...set];
  }

  async cargar(valores, mensaje) {
    await this.ejecutar('Cargando árbol', async () => {
      this.arbol = new ArbolBinario();
      this.vis.arbol = this.arbol;
      await this.vis.actualizar(this.arbol, false);
      valores.forEach((v) => this.arbol.insertar(v));
      await this.vis.actualizar(this.arbol);
      this.consolaInicio('Árbol listo. Elige un recorrido.');
      this.pilaNodos = [];
      this.renderPila();
      this.log(mensaje, 'ok');
    });
  }

  consolaInicio(titulo) {
    const c = this.$('consola');
    c.innerHTML = '';
    this.consolaLinea(`> ${titulo}`, 'cmd');
    this.salidaEl = document.createElement('div');
    this.salidaEl.className = 'salida';
    c.appendChild(this.salidaEl);
  }

  consolaLinea(texto, clase = '') {
    const c = this.$('consola');
    const d = document.createElement('div');
    d.className = `linea ${clase}`;
    d.textContent = texto;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }

  consolaChip(valor) {
    if (!this.salidaEl) return;
    const s = document.createElement('span');
    s.className = 'chip-sal';
    s.textContent = valor;
    this.salidaEl.appendChild(s);
    this.$('consola').scrollTop = this.$('consola').scrollHeight;
  }

  renderPila(tipo = '') {
    const ol = this.$('pila');
    ol.innerHTML = '';
    if (this.pilaNodos.length === 0) {
      ol.innerHTML = '<li class="vacia">vacía</li>';
      return;
    }
    [...this.pilaNodos].reverse().forEach((n, i) => {
      const li = document.createElement('li');
      li.textContent = `${tipo}(${n.valor})`;
      if (i === 0) li.className = 'tope';
      ol.appendChild(li);
    });
  }

  limpiarBitacora() { this.$('bitacora').innerHTML = ''; }

  log(texto, clase = '') {
    const ol = this.$('bitacora');
    const li = document.createElement('li');
    li.textContent = texto;
    if (clase) li.className = clase;
    ol.appendChild(li);
    ol.scrollTop = ol.scrollHeight;
  }

  actualizarStats() {
    const modo = this.$('tipo-arbol').value;
    this.$('stat-tipo').textContent = modo === 'numerico' ? 'Enteros' : 'Letras';
    this.$('stat-nodos').textContent = this.arbol.tamano;
    this.$('stat-altura').textContent = this.arbol.estaVacio() ? '–' : this.arbol.altura();
    this.$('stat-grado').textContent = this.arbol.estaVacio() ? '–' : this.arbol.gradoMaximo();
  }
}