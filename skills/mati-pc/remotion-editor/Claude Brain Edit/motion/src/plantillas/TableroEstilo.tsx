import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ESTILOS, Estilo} from '../estilos';

// Tablero de una opción de estilo: 3 maquetas a tamaño real (reducidas al 50 %) + paleta y fuentes.
// Textos sacados del transcript del vídeo. Zonas seguras 16:9: 108 arriba, 130 abajo, 96 laterales.

const Marco: React.FC<{children: React.ReactNode; x: number; y: number; etiqueta: string}> = ({children, x, y, etiqueta}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 960, height: 540, overflow: 'hidden'}}>
    <div style={{width: 1920, height: 1080, transform: 'scale(0.5)', transformOrigin: '0 0', position: 'relative'}}>{children}</div>
    <div style={{position: 'absolute', left: 14, top: 12, font: '600 17px Helvetica Neue', color: '#fff', background: 'rgba(0,0,0,0.62)', padding: '5px 11px', borderRadius: 6}}>{etiqueta}</div>
  </div>
);

const Subtitulo: React.FC<{e: Estilo}> = ({e}) => {
  const base: React.CSSProperties = {
    fontFamily: e.fuente.subtitulos, fontWeight: e.peso.subtitulos, fontSize: 84, lineHeight: 1.12, color: e.color.textoSobreVideo,
    textShadow: '0 4px 28px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.6)', textAlign: 'center', letterSpacing: -0.5,
  };
  return (
    <AbsoluteFill>
      <Img src={staticFile('mock/cara_a.jpg')} style={{width: 1920, height: 1080}} />
      <div style={{position: 'absolute', left: 96, right: 96, bottom: 150, ...base}}>
        <div>hoy he dormido como el culo</div>
        <div>
          y estoy{' '}
          <span style={{background: e.color.acento, color: e.color.sobreAcento, padding: '2px 22px 6px', borderRadius: e.radio / 2, textShadow: 'none'}}>destrozado</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Tarjeta: React.FC<{e: Estilo}> = ({e}) => (
  <AbsoluteFill>
    <Img src={staticFile('mock/cara_b.jpg')} style={{width: 1920, height: 1080}} />
    <div
      style={{
        position: 'absolute', left: 96, top: 330, width: 'fit-content', minWidth: 560, padding: '44px 56px 46px 48px', background: e.color.fondo, borderRadius: e.radio,
        boxShadow: '0 40px 90px rgba(0,0,0,0.55)', border: `1.5px solid ${e.color.texto}22`,
      }}
    >
      <div style={{fontFamily: e.fuente.tarjetas, fontWeight: e.peso.tarjetas, fontSize: 34, letterSpacing: 3, textTransform: 'uppercase', color: e.color.metodo}}>Equipo comercial</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 22, marginTop: e.displayMayus ? 26 : 6, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: e.fuente.display, fontWeight: e.peso.display, fontSize: 230, lineHeight: 1, color: e.color.acento, letterSpacing: -4}}>70</span>
        <span style={{fontFamily: e.fuente.tarjetas, fontWeight: e.peso.tarjetas, fontSize: 52, color: e.color.texto}}>comerciales</span>
      </div>
      <div style={{height: 6, borderRadius: 3, background: `${e.color.texto}1F`, marginTop: 22}}>
        <div style={{width: '86%', height: 6, borderRadius: 3, background: e.color.metodo}} />
      </div>
    </div>
  </AbsoluteFill>
);

const Completa: React.FC<{e: Estilo}> = ({e}) => (
  <AbsoluteFill style={{background: e.color.fondo, justifyContent: 'center', alignItems: 'center'}}>
    <div style={{fontFamily: e.fuente.tarjetas, fontWeight: e.peso.tarjetas, fontSize: 44, color: e.color.metodo, letterSpacing: 2, textTransform: 'uppercase'}}>Lo que le falla a la mayoría</div>
    {e.fuente.premium ? (
      <div style={{fontFamily: e.fuente.premium, fontStyle: 'italic', fontSize: 250, color: e.color.texto, lineHeight: 1.05, marginTop: 10}}>
        la <span style={{color: e.color.acento}}>consistencia</span>
      </div>
    ) : (
      <div style={{fontFamily: e.fuente.display, fontWeight: e.peso.display, fontSize: 300, color: e.color.texto, lineHeight: 1, marginTop: 34, textTransform: 'uppercase', letterSpacing: 2}}>
        <span style={{background: e.color.acento, color: e.color.sobreAcento, padding: '26px 40px 0'}}>consistencia</span>
      </div>
    )}
    <div style={{display: 'flex', gap: 18, marginTop: 70, alignItems: 'center', fontFamily: e.fuente.tarjetas, fontWeight: e.peso.tarjetas, fontSize: 40, color: e.color.texto}}>
      {['1 mes', '3 meses', '5 años'].map((t, i) => (
        <React.Fragment key={t}>
          {i > 0 && <div style={{width: 130 + i * 110, height: 4, background: `${e.color.texto}33`}} />}
          <div style={{padding: '10px 26px', borderRadius: e.radio, border: `2px solid ${i === 2 ? e.color.metodo : e.color.texto + '44'}`, color: i === 2 ? e.color.metodo : e.color.texto, textDecoration: i < 2 ? 'line-through' : 'none', textDecorationColor: e.color.semantico}}>{t}</div>
        </React.Fragment>
      ))}
    </div>
  </AbsoluteFill>
);

const Ficha: React.FC<{e: Estilo}> = ({e}) => {
  const roles: [string, string][] = [['Fondo', e.color.fondo], ['Texto', e.color.texto], ['Método', e.color.metodo], ['Acento', e.color.acento], ['Semántico', e.color.semantico]];
  return (
    <div style={{position: 'absolute', left: 960, top: 540, width: 960, height: 540, background: '#1B1B1E', color: '#F2F2F2', fontFamily: 'Helvetica Neue', padding: '34px 44px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 46, fontWeight: 700}}>Opción {e.id} · {e.nombre}</div>
      <div style={{fontSize: 23, opacity: 0.75, marginTop: 6, lineHeight: 1.3}}>{e.idea}</div>
      <div style={{display: 'flex', gap: 16, marginTop: 26}}>
        {roles.map(([n, c]) => (
          <div key={n} style={{width: 160}}>
            <div style={{height: 92, background: c, borderRadius: 10, border: '1px solid #ffffff33'}} />
            <div style={{fontSize: 21, fontWeight: 600, marginTop: 8}}>{n}</div>
            <div style={{fontSize: 19, opacity: 0.65, fontFamily: 'Menlo'}}>{c}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 26, fontSize: 23, lineHeight: 1.55}}>
        <div><span style={{opacity: 0.6}}>Titulares · </span><span style={{fontFamily: e.fuente.display, fontWeight: e.peso.display, fontSize: 30}}>{e.fuente.display}</span></div>
        <div><span style={{opacity: 0.6}}>Subtítulos · </span><span style={{fontFamily: e.fuente.subtitulos, fontWeight: e.peso.subtitulos, fontSize: 28}}>{e.fuente.subtitulos} Bold</span></div>
        <div><span style={{opacity: 0.6}}>Tarjetas · </span><span style={{fontFamily: e.fuente.tarjetas, fontWeight: e.peso.tarjetas, fontSize: 28}}>{e.fuente.tarjetas}</span></div>
        <div><span style={{opacity: 0.6}}>Toque premium · </span>{e.fuente.premium ? <span style={{fontFamily: e.fuente.premium, fontStyle: 'italic', fontSize: 32}}>{e.fuente.premium} cursiva</span> : <span>ninguno</span>}</div>
      </div>
    </div>
  );
};

export const TableroEstilo: React.FC<{estilo: string}> = ({estilo}) => {
  const e = ESTILOS[estilo];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Marco x={0} y={0} etiqueta="Subtítulo de énfasis (palabra a palabra)"><Subtitulo e={e} /></Marco>
      <Marco x={960} y={0} etiqueta="Tarjeta sobre el plano (cifra)"><Tarjeta e={e} /></Marco>
      <Marco x={0} y={540} etiqueta="Gráfico a pantalla completa (concepto)"><Completa e={e} /></Marco>
      <Ficha e={e} />
      <div style={{position: 'absolute', left: 959, top: 0, width: 2, height: 1080, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, top: 539, width: 1920, height: 2, background: '#000'}} />
    </AbsoluteFill>
  );
};
