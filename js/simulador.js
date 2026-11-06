/* ==========================================================
   simulador.js · Módulo 1 (Con sonido, pila y subárboles al hacer clic)
   ========================================================== */

class Cancelado extends Error {}

class Simulador {
  constructor() {
    this.$ = (id) => document.getElementById(id);
    this.arbol = new ArbolBinario();
    
    this.vis = new Visualizador(this.$('svg-sim'), {
      alClickNodo: (nodo) => this.alClickNodoSimulador(nodo),
    });

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
    if ($('btn-insertar')) $('btn-insertar').addEventListener('click', () => this.insertar());
    if ($('btn-eliminar')) $('btn-eliminar').addEventListener('click', () => this.eliminar());
    if ($('btn-buscar')) $('btn-buscar').addEventListener('click', () => this.buscar());
    if ($('valor')) $('valor').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.insertar(); });

    if ($('tipo-arbol')) {
      $('tipo-arbol').addEventListener('change', (e) => {
        const modo = e.target.value;
        if ($('valor')) $('valor').placeholder = modo === 'numerico' ? 'Ej. 42' : 'Ej. K';
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
    }

    if ($('btn-preorden')) $('btn-preorden').addEventListener('click', () => this.recorrer('preorden'));
    if ($('btn-inorden')) $('btn-inorden').addEventListener('click', () => this.recorrer('inorden'));
    if ($('btn-postorden')) $('btn-postorden').addEventListener('click', () => this.recorrer('postorden'));

    if ($('btn-ejemplo')) {
      $('btn-ejemplo').addEventListener('click', () => {
        const modo = $('tipo-arbol') ? $('tipo-arbol').value : 'numerico';
        const datos = modo === 'numerico' ? [50, 30, 70, 20, 40, 60, 80, 35] : ['M', 'F', 'T', 'B', 'H', 'P', 'W', 'K'];
        this.cargar(datos, 'Árbol de ejemplo cargado.');
      });
    }
    if ($('btn-aleatorio')) $('btn-aleatorio').addEventListener('click', () => this.cargar(this._valoresAleatorios(), 'Árbol aleatorio generado.'));
    if ($('btn-limpiar')) $('btn-limpiar').addEventListener('click', () => this.cargar([], 'Árbol vaciado.'));

    if ($('velocidad')) $('velocidad').addEventListener('input', () => this._actualizarVelocidad());
    if ($('chk-niveles')) $('chk-niveles').addEventListener('change', (e) => { this.vis.mostrarNiveles = e.target.checked; this.vis.dibujar(); });

    if ($('btn-siguiente')) $('btn-siguiente').addEventListener('click', () => this._liberarSiguiente());
    if ($('btn-detener')) {
      $('btn-detener').addEventListener('click', () => {
        if (!this.ocupado) return;
        this.cancelar = true;
        this._liberarSiguiente();
      });
    }
  }

  retardo() { return 1500 - Number(this.$('velocidad') ? this.$('velocidad').value : 5) * 130; }
  _actualizarVelocidad() { this.vis.duracion = Math.min(500, this.retardo() * 0.55); }

  _liberarSiguiente() {
    if (this._siguiente) { const r = this._siguiente; this._siguiente = null; r(); }
  }

  async esperar(factor = 1, omitirManual = false) {
    if (this.cancelar) throw new Cancelado();
    const manual = this.$('modo-manual') ? this.$('modo-manual').checked : false;
    if (manual && !omitirManual) {
      if (this.$('btn-siguiente')) this.$('btn-siguiente').disabled = false;
      await new Promise((r) => { this._siguiente = r; });
      if (this.$('btn-siguiente')) this.$('btn-siguiente').disabled = true;
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
    this.pilaNodos = [];
    this.renderPila();
    if (this.$('estado-op')) this.$('estado-op').textContent = titulo;
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
      if (this.$('btn-siguiente')) this.$('btn-siguiente').disabled = true;
      if (this.$('estado-op')) this.$('estado-op').textContent = 'Listo';
      this.actualizarStats();
    }
  }

  _bloquear(si) {
    document.querySelectorAll('#mod-simulador .accion').forEach((b) => { b.disabled = si; });
    if (this.$('btn-detener')) this.$('btn-detener').disabled = !si;
  }

  leerValor() {
    const modo = this.$('tipo-arbol') ? this.$('tipo-arbol').value : 'numerico';
    const valInput = this.$('valor') ? this.$('valor').value : '';
    const r = ArbolBinario.parsear(valInput, modo);
    if (r.error) {
      mostrarToast(r.error);
      if (this.$('valor')) this.$('valor').focus();
      return null;
    }
    return r;
  }

  async insertar() {
    if (this.ocupado) return;
    const lectura = this.leerValor();
    if (!lectura) return;
    const v = lectura.valor;

    await this.ejecutar(`Insertar ${v}`, async () => {
      const ruta = this.arbol.buscarRuta(v);
      if (this.$('valor')) this.$('valor').value = '';
      reproducirSonido('insertar');

      if (this.arbol.estaVacio()) {
        this.log(`El árbol está vacío: ${v} será la raíz.`);
        await this.esperar(0.6);
      } else {
        this.vis.fantasma = { valor: v, color: Nodo.colorParaId(Nodo.contador + 1) };
        this.vis.puntero = true;
        for (const paso of ruta.pasos) {
          await this.vis.colocar('fantasma', paso.nodo);
          await this.vis.colocar('puntero', paso.nodo);
          this.vis.marcar(paso.nodo, 'actual');
          reproducirSonido('paso');
          this.log(`Comparando ${v} con ${paso.nodo.valor}`);
          await this.esperar();
          this.vis.marcar(paso.nodo, 'camino');
        }
        this.vis.quitar('puntero');
      }

      const nuevo = this.arbol.insertar(v);
      await this.vis.actualizar(this.arbol);
      this.vis.marcar(nuevo, 'encontrado');
      this.log(`Listo: ${v} insertado (admite repetidos).`, 'ok');
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
      for (const paso of ruta.pasos) {
        this.pilaNodos = [`buscar(${v}, actual: ${paso.nodo.valor})`];
        this.renderPila();
        await this.vis.colocar('puntero', paso.nodo);
        this.vis.marcar(paso.nodo, 'actual');
        reproducirSonido('paso');
        this.log(`Buscando ${v}, evaluando ${paso.nodo.valor}`);
        await this.esperar();
        if (paso.cmp === 0) break;
        this.vis.marcar(paso.nodo, 'camino');
      }

      this.pilaNodos = [];
      this.renderPila();

      if (ruta.encontrado) {
        this.vis.marcar(ruta.nodo, 'encontrado');
        reproducirSonido('insertar');
        this.log(`Encontrado: ${v} está en el árbol.`, 'ok');
      } else {
        this.log(`El valor ${v} no existe en el árbol.`, 'error');
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
      reproducirSonido('eliminar');
      this.arbol.eliminar(v);
      this.vis.limpiarEstados();
      await this.vis.actualizar(this.arbol);
      this.log(`Listo: ${v} eliminado.`, 'ok');
    });
  }

  async recorrer(tipo) {
    if (this.ocupado) return;
    if (this.arbol.estaVacio()) { mostrarToast('El árbol está vacío.'); return; }

    await this.ejecutar(`Recorrido ${tipo}`, async () => {
      this.consolaInicio(`${tipo}(raiz)`);
      const salida = [];
      this.vis.puntero = true;

      for (const ev of this.arbol.generarRecorrido(tipo)) {
        const n = ev.nodo;
        this.pilaNodos = ev.pila || [];
        this.renderPila();

        if (ev.t === 'entra') {
          this.vis.marcar(n, 'actual');
          await this.vis.colocar('puntero', n);
          reproducirSonido('paso');
          this.log(`Entrando al nodo ${n.valor} (${tipo})`);
          await this.esperar(0.5);
        } else if (ev.t === 'visita') {
          salida.push(n.valor);
          this.vis.marcar(n, 'visitado');
          this.consolaChip(n.valor);
          reproducirSonido('insertar');
          this.log(`Visitando nodo ${n.valor} -> agregado al resultado`, 'ok');
          await this.esperar();
        }
      }
      this.pilaNodos = [];
      this.renderPila();
      this.vis.quitar('puntero');
      this.consolaLinea(`Resultado: ${salida.join(', ')}`, 'res');
      this.log(`Recorrido terminado.`, 'ok');
    });
  }

  alClickNodoSimulador(nodo) {
    if (this.ocupado) return;
    this.vis.limpiarEstados();
    this.vis.marcar(nodo, 'encontrado');
    const info = this.arbol.infoNodo(nodo);
    const sub = this.arbol.contarSubarbolNodo(nodo);
    
    this.consolaInicio(`Nodo ${nodo.valor}`);
    this.consolaLinea(`Nivel: ${info.nivel} | Altura: ${info.altura} | Grado: ${info.grado}`);
    this.consolaLinea(`Subárbol Izquierdo: ${sub.izq} nodos`);
    this.consolaLinea(`Subárbol Derecho: ${sub.der} nodos`);
    this.log(`Nodo ${nodo.valor} seleccionado: Izq (${sub.izq} nodos), Der (${sub.der} nodos).`, 'ok');
  }

  _valoresAleatorios() {
    const modo = this.$('tipo-arbol') ? this.$('tipo-arbol').value : 'numerico';
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
      this.consolaInicio('Árbol listo.');
      this.log(mensaje, 'ok');
    });
  }

  consolaInicio(titulo) {
    const c = this.$('consola');
    if (!c) return;
    c.innerHTML = '';
    this.consolaLinea(`> ${titulo}`, 'cmd');
    this.salidaEl = document.createElement('div');
    this.salidaEl.className = 'salida';
    c.appendChild(this.salidaEl);
  }

  consolaLinea(texto, clase = '') {
    const c = this.$('consola');
    if (!c) return;
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
  }

  renderPila() {
    const ol = this.$('pila');
    if (!ol) return;
    ol.innerHTML = '';
    if (this.pilaNodos.length === 0) {
      ol.innerHTML = '<li class="vacia">vacía</li>';
      return;
    }
    this.pilaNodos.slice().reverse().forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      ol.appendChild(li);
    });
  }

  limpiarBitacora() { 
    if (this.$('bitacora')) this.$('bitacora').innerHTML = ''; 
  }
  log(texto, clase = '') {
    const ol = this.$('bitacora');
    if (!ol) return;
    const li = document.createElement('li');
    li.textContent = texto;
    if (clase) li.className = clase;
    ol.appendChild(li);
  }

  actualizarStats() {
    const modo = this.$('tipo-arbol') ? this.$('tipo-arbol').value : 'numerico';
    if (this.$('stat-tipo')) this.$('stat-tipo').textContent = modo === 'numerico' ? 'Enteros' : 'Letras';
    if (this.$('stat-nodos')) this.$('stat-nodos').textContent = this.arbol.tamano;
    if (this.$('stat-altura')) this.$('stat-altura').textContent = this.arbol.estaVacio() ? '–' : this.arbol.altura();
    if (this.$('stat-grado')) this.$('stat-grado').textContent = this.arbol.estaVacio() ? '–' : this.arbol.gradoMaximo();
  }
}