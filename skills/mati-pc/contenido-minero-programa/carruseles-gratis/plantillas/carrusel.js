// carrusel.js · el carrusel de este proyecto. Una entrada por slide en la tabla de CARRUSEL.monta.
// Tipos listos en el motor (slides.js): S.regla · S.lista · S.giro · S.cta. Para un slide propio, escribe una función (q) => { … }
// que monte el lienzo, defina window.seek(t) y registre la duración y los golpes con M.slide({ indice, duracion, golpes }).
(function () {
  const M = window.MOTOR, V = window.V, S = window.S;
  const { linea, gigante } = V;
  // TU MARCA: cámbialo por tus datos (sale en la cabecera, el pie y el último slide)
  M.marca({ usuario: '@tucuenta', lema: 'tu tema · tu estilo', nombre: 'Tu Nombre', cabecera: 'TU MARCA' });

  // ejemplo de slide propio: portada tipográfica que se enfoca letra a letra y la cruza un brillo
  function portada(q) {
    const c = V.fondo(q, 'noche', 1); c.tema = 'noche'; V.cab(q, c, M.MARCA.cabecera, 'TEMA DEL CARRUSEL');
    const l1 = linea(q, 'raj', 'La frase pequeña de arriba', { x: 72, base: 520, fs: 80 }, { color: c.tx });
    const big = gigante(q, 'ant', 'PALABRA', 420, 936, { x: 66, base: 860 }, { color: c.acento });
    const esc = V.escena(q, { tema: 'noche', dur: 8, semilla: 1, bokeh: 8 });
    const brillo = V.brillo(big);
    const w1 = V.partir(l1, 'word'), letras = V.partir(big, 'char');
    esc.alFrente();
    window.seek = (t) => {
      esc.dibuja(t);
      V.revela(w1, t, { a: 0.5, paso: 0.07, estilo: 'sube', blur: 14, y: 26 });
      V.revela(letras, t, { a: 0.9, paso: 0.06, dur: 1.1, estilo: 'sube', blur: 22, y: 60 });
      brillo.at(t, 2.0, 1.2);
      return true;
    };
    M.slide({ indice: 1, duracion: 8, golpes: [{ t: 0.5, tipo: 'barrido', que: 'entra el texto' }, { t: 2.0, tipo: 'brillo', que: 'brillo en la palabra' }] });
  }

  window.CARRUSEL = {
    monta: S.monta({
      1: portada,
      // 2: (q) => S.regla(q, 2, { tema: 'lavanda', numero: 1, estilo: 'sube', gesto: 'halo', et: '…', pill: 'PASO 1', palabra: '…', def: '…', cuerpo: '…',
      //        mal: ['RÓTULO', 'nota', 'título de la ventana', 'comando', 'salida'], bien: [ … ], fecho: '…' }),
      // 7: (q) => S.giro(q, { indice: 7, palabras: [ … ], l1: '…', l2: '…', l3: '…', grande: '…', cuerpo: ['…', '…'] }),
      // 8: (q) => S.cta(q, { indice: 8, kw: 'PALABRA', pre: 'y te mando…', items: ['…', '…', '…'] }),
    }),
  };
})();
