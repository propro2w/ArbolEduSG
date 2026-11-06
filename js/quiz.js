/* ==========================================================
   quiz.js · Módulo 3: Evaluador de competencias (Validación 5 a 20)
   ========================================================== */

class Quiz {
  constructor() {
    this.$ = (id) => document.getElementById(id);
    this.vis = new Visualizador(this.$('svg-quiz'));
    this.vis.duracion = 450;

    this.total = 5;
    this.indice = 0;
    this.aciertos = 0;
    this.resultados = [];
    this.actual = null;
    this.respondida = false;
    this._ficha = 0;

    this.$('quiz-empezar').addEventListener('click', () => this.empezar());
    this.$('quiz-comprobar').addEventListener('click', () => this.comprobar());
    this.$('quiz-siguiente').addEventListener('click', () => this.siguiente());
    this.$('quiz-reiniciar').addEventListener('click', () => this._mostrar('quiz-inicio'));
    this.$('quiz-respuesta').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (this.respondida) this.siguiente(); else this.comprobar();
    });
  }

  _mostrar(id) {
    ['quiz-inicio', 'quiz-pregunta', 'quiz-final'].forEach((p) => { this.$(p).hidden = p !== id; });
  }

  empezar() {
    let n = Number(this.$('quiz-n').value);
    if (isNaN(n) || n < 5 || n > 20) {
      mostrarToast('El número de preguntas debe ser un valor entre 5 y 20.');
      this.$('quiz-n').focus();
      return;
    }
    this.total = n;
    this.indice = 0;
    this.aciertos = 0;
    this.resultados = [];
    this._mostrar('quiz-pregunta');
    this.nuevaPregunta();
  }

  _arbolAleatorio() {
    const usarLetras = Math.random() < 0.25;
    const cantidad = aleatorioEntre(5, 8);
    let arbol;

    do {
      let pool;
      if (usarLetras) pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      else pool = Array.from({ length: 99 }, (_, i) => i + 1);

      arbol = new ArbolBinario();
      mezclar(pool).slice(0, cantidad).forEach((v) => arbol.insertar(v));
    } while (arbol.altura() > 4);

    return arbol;
  }

  nuevaPregunta() {
    const arbol = this._arbolAleatorio();
    const tipo = ['preorden', 'inorden', 'postorden'][aleatorioEntre(0, 2)];
    const esperado = arbol.recorrido(tipo).map(String);
    this.actual = { arbol, tipo, esperado };
    this.respondida = false;
    this._ficha++;

    this.indice++;
    this.$('quiz-progreso').textContent = `Pregunta ${this.indice} de ${this.total}`;
    this.$('quiz-aciertos').textContent = `Aciertos: ${this.aciertos}`;
    this.$('quiz-barra').style.width = `${((this.indice - 1) / this.total) * 100}%`;
    this.$('quiz-enunciado').textContent = `¿Cuál es el recorrido ${tipo.toUpperCase()} de este árbol?`;

    const entrada = this.$('quiz-respuesta');
    entrada.value = '';
    entrada.disabled = false;
    this.$('quiz-comprobar').disabled = false;
    this.$('quiz-feedback').hidden = true;
    this.$('quiz-siguiente').hidden = true;

    this.vis.limpiarEstados();
    this.vis.actualizar(arbol);
    entrada.focus();
  }

  _leerRespuesta(texto) {
    return texto.trim().split(/[\s,;>→]+/).filter((t) => t !== '').map((t) => t.toUpperCase());
  }

  comprobar() {
    if (this.respondida) return;
    const entrada = this.$('quiz-respuesta');
    const dada = this._leerRespuesta(entrada.value);
    if (dada.length === 0) { mostrarToast('Escribe tu respuesta antes de comprobar.'); entrada.focus(); return; }

    const esperado = this.actual.esperado.map((v) => v.toUpperCase());
    const correcta = dada.length === esperado.length && dada.every((v, i) => v === esperado[i]);
    const coinciden = dada.filter((v, i) => v === esperado[i]).length;

    this.respondida = true;
    if (correcta) this.aciertos++;
    this.resultados.push({
      tipo: this.actual.tipo,
      dada: dada.join(' '),
      esperada: this.actual.esperado.join(' '),
      correcta,
    });

    entrada.disabled = true;
    this.$('quiz-comprobar').disabled = true;
    this.$('quiz-aciertos').textContent = `Aciertos: ${this.aciertos}`;
    this.$('quiz-barra').style.width = `${(this.indice / this.total) * 100}%`;

    const fb = this.$('quiz-feedback');
    fb.hidden = false;
    fb.className = `feedback ${correcta ? 'bien' : 'mal'}`;
    fb.innerHTML = correcta
      ? '<strong>¡Correcto!</strong> Ese es el recorrido exacto.'
      : `<strong>No es correcto.</strong> Coincidiste en ${coinciden} de ${esperado.length} posiciones.<br>` +
        `Tu respuesta: <code>${escapar(dada.join(' '))}</code><br>` +
        `Respuesta correcta: <code>${escapar(this.actual.esperado.join(' '))}</code>`;

    const ultima = this.indice >= this.total;
    const sig = this.$('quiz-siguiente');
    sig.textContent = ultima ? 'Ver calificación' : 'Siguiente pregunta';
    sig.hidden = false;
    sig.focus();

    this._mostrarOrden();
  }

  async _mostrarOrden() {
    const ficha = this._ficha;
    const { arbol, tipo } = this.actual;
    const visitas = arbol.generarRecorrido(tipo).filter((e) => e.t === 'visita');
    for (const ev of visitas) {
      if (ficha !== this._ficha) return;
      this.vis.marcar(ev.nodo, 'visitado');
      await dormir(260);
    }
  }

  siguiente() {
    if (!this.respondida) return;
    if (this.indice >= this.total) this.finalizar();
    else this.nuevaPregunta();
  }

  finalizar() {
    this._ficha++;
    const calif = Math.round((this.aciertos / this.total) * 100);
    this.$('quiz-calif').textContent = calif;

    let mensaje;
    if (calif >= 90) mensaje = '¡Excelente! Dominas los recorridos de árboles binarios.';
    else if (calif >= 70) mensaje = 'Aprobado. Repasa las preguntas que fallaste para afianzar el tema.';
    else mensaje = 'Todavía te falta práctica. Repasa la teoría y practica con el simulador paso a paso.';
    this.$('quiz-mensaje').textContent = `${this.aciertos} de ${this.total} correctas. ${mensaje}`;

    const lista = this.$('quiz-resumen');
    lista.innerHTML = '';
    this.resultados.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = r.correcta ? 'bien' : 'mal';
      li.innerHTML = `<strong>${i + 1}. ${escapar(r.tipo)}</strong> ${r.correcta ? '✔' : '✘'}<br>` +
        `Tu respuesta: <code>${escapar(r.dada)}</code>` +
        (r.correcta ? '' : `<br>Correcta: <code>${escapar(r.esperada)}</code>`);
      lista.appendChild(li);
    });

    this._mostrar('quiz-final');
  }
}
