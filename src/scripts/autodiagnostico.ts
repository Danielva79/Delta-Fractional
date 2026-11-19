// Autodiagnóstico financiero: navegación por pantallas, guardado progresivo y resultado.
// - Calcula el resultado con src/lib/autodiagnostico/cuestionario.ts (el mismo archivo que usa la
//   Edge Function, que lo recalcula antes de guardar).
// - Guarda la sesión al comenzar, al terminar cada sección, al ver el resultado y al salir de la
//   página (para medir el abandono). Sin PUBLIC_AUTODIAGNOSTICO_URL no envía nada.
// - Retoma la sesión si la página se recarga (sessionStorage; si el navegador lo bloquea, empieza de nuevo).
import { SECCIONES, VERSION_CUESTIONARIO, calcular, type Respuestas, type Resultado } from '../lib/autodiagnostico/cuestionario';

interface Config {
  url: string;
  llave: string;
  turnstile: string;
  version: string;
  versionAutorizacion: string;
  urlPolitica: string;
  agenda: string | null;
  textos: {
    progreso: string;
    errorPregunta: string;
    errorSeccion: string;
    puntos: string;
    semaforo: Record<'rojo' | 'amarillo' | 'verde', { etiqueta: string; texto: string }>;
    contacto: Record<string, string>;
  };
}
type Estado = 'iniciado' | 'en_curso' | 'resultado_visto' | 'contacto_enviado';
interface Sesion {
  token: string;
  empresa: string;
  respuestas: Respuestas;
  /** Última pantalla completada: 'inicio', id de sección o 'resultado'. */
  ultimoPaso: string;
  /** Pantalla visible. */
  pantalla: string;
  estado: Estado;
  inicio: number;
  utm: { source?: string; medium?: string; campaign?: string };
  referrer: string | null;
  origen: 'web' | 'curso';
}

const raiz = document.querySelector<HTMLElement>('[data-autodiagnostico]');
if (raiz) iniciar(raiz);

function iniciar(raiz: HTMLElement) {
  const cfg: Config = JSON.parse(document.getElementById('ad-config')!.textContent!);
  const CLAVE = 'df-autodiagnostico';
  const pantallas = [...raiz.querySelectorAll<HTMLElement>('[data-pantalla]')];
  const orden = pantallas.map((p) => p.dataset.pantalla!);
  const track = (e: string, p: Record<string, string | number | boolean> = {}) => window.track?.(e, p);
  let s: Sesion | null = null;

  // ---------- Año en curso (zona de Bogotá) ----------
  const anio = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric' }).format(new Date()));
  raiz.querySelectorAll('[data-anio]').forEach((e) => (e.textContent = String(anio)));
  raiz.querySelectorAll('[data-anio-anterior]').forEach((e) => (e.textContent = String(anio - 1)));

  // ---------- Persistencia local ----------
  const guardarLocal = () => {
    try { if (s) sessionStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  };
  const leerLocal = (): Sesion | null => {
    try {
      const v = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
      return v && v.token && v.empresa && v.estado ? v : null;
    } catch { return null; }
  };

  // ---------- Envío a la Edge Function ----------
  const duracion = () => (s ? Math.min(604800, Math.max(0, Math.round((Date.now() - s.inicio) / 1000))) : 0);
  const dispositivo = () => (matchMedia('(max-width: 767px), (pointer: coarse)').matches ? 'movil' : 'escritorio');
  async function enviar(cuerpo: Record<string, unknown>, keepalive = false): Promise<Response | null> {
    if (!cfg.url) return null; // vista previa sin función configurada
    return fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cfg.llave ? { apikey: cfg.llave } : {}) },
      body: JSON.stringify(cuerpo),
      keepalive,
    });
  }
  // Los guardados van en fila (uno después del otro): así llegan en orden y el contacto puede
  // esperar a que el resultado esté guardado (en producción cada guardado tarda 1 a 3 s).
  let guardadoPendiente: Promise<unknown> = Promise.resolve();
  function guardarSesion(estado: Estado, keepalive = false): Promise<unknown> {
    if (!s) return Promise.resolve();
    const cuerpo = {
      accion: 'guardar', session_token: s.token, version: VERSION_CUESTIONARIO, empresa: s.empresa,
      estado, ultimo_paso: estado === 'resultado_visto' ? 'resultado' : s.ultimoPaso, respuestas: s.respuestas,
      duracion_segundos: duracion(), utm: s.utm, referrer: s.referrer, origen: s.origen, dispositivo: dispositivo(),
    };
    // Al salir de la página no se espera la fila: keepalive debe salir ya.
    if (keepalive) return enviar(cuerpo, true).catch(() => {});
    guardadoPendiente = guardadoPendiente
      .then(() => enviar(cuerpo))
      .catch(() => { /* el autodiagnóstico sigue aunque no se guarde */ });
    return guardadoPendiente;
  }

  // ---------- Pantallas ----------
  const cabecera = raiz.querySelector<HTMLElement>('[data-cabecera]')!;
  function mostrar(id: string, enfocar = true) {
    for (const p of pantallas) p.hidden = p.dataset.pantalla !== id;
    cabecera.classList.toggle('oculta', id !== 'inicio');
    if (s) { s.pantalla = id; guardarLocal(); }
    const visible = pantallas.find((p) => p.dataset.pantalla === id)!;
    if (enfocar) {
      const titulo = id === 'inicio' ? cabecera.querySelector<HTMLElement>('h1') : visible.querySelector<HTMLElement>('[data-titulo]');
      raiz.scrollIntoView({ block: 'start' });
      titulo?.focus({ preventScroll: true });
    }
  }

  // ---------- Inicio ----------
  const formInicio = raiz.querySelector<HTMLFormElement>('[data-form-inicio]')!;
  const inputEmpresa = formInicio.querySelector<HTMLInputElement>('#ad-empresa')!;
  const errorEmpresa = document.getElementById('ad-empresa-error')!;
  formInicio.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const empresa = inputEmpresa.value.trim().replace(/\s+/g, ' ');
    if (!empresa) {
      errorEmpresa.textContent = errorEmpresa.dataset.errorTexto!;
      inputEmpresa.setAttribute('aria-invalid', 'true');
      inputEmpresa.focus();
      return;
    }
    errorEmpresa.textContent = '';
    inputEmpresa.setAttribute('aria-invalid', 'false');
    if (!s) {
      const p = new URLSearchParams(location.search);
      const utm = { source: p.get('utm_source') ?? undefined, medium: p.get('utm_medium') ?? undefined, campaign: p.get('utm_campaign') ?? undefined };
      let referrer: string | null = null;
      try { referrer = document.referrer ? new URL(document.referrer).origin : null; } catch { /* sin referrer */ }
      s = {
        token: crypto.randomUUID(), empresa, respuestas: {}, ultimoPaso: 'inicio', pantalla: 'inicio', estado: 'iniciado',
        inicio: Date.now(), utm, referrer, origen: p.get('origen') === 'curso' || utm.source === 'curso' ? 'curso' : 'web',
      };
      guardarSesion('iniciado');
      track('autodiagnostico_inicio', { origen: s.origen });
    } else {
      s.empresa = s.estado === 'iniciado' || s.estado === 'en_curso' ? empresa : s.empresa;
    }
    mostrar(SECCIONES[0].id);
  });

  // ---------- Secciones ----------
  raiz.querySelectorAll<HTMLFormElement>('form[data-indice]').forEach((form) => {
    const i = Number(form.dataset.indice);
    const seccion = SECCIONES[i];
    const errorSeccion = form.querySelector<HTMLElement>('[data-error-seccion]')!;

    form.addEventListener('change', (ev) => {
      const r = ev.target as HTMLInputElement;
      if (r.type !== 'radio' || !s) return;
      s.respuestas[r.name] = Number(r.value);
      const fs = r.closest<HTMLElement>('fieldset')!;
      fs.removeAttribute('data-invalida');
      document.getElementById(`ad-${r.name}-error`)!.textContent = '';
      if (!form.querySelector('fieldset[data-invalida]')) errorSeccion.textContent = '';
      guardarLocal();
    });

    form.querySelector('[data-anterior]')!.addEventListener('click', () => {
      mostrar(i === 0 ? 'inicio' : SECCIONES[i - 1].id);
    });

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!s) { mostrar('inicio'); return; }
      const faltan = seccion.preguntas.filter((q) => !Number.isInteger(s!.respuestas[q.id]));
      for (const q of seccion.preguntas) {
        const fs = form.querySelector<HTMLElement>(`fieldset[data-pregunta="${q.id}"]`)!;
        const falta = faltan.includes(q);
        fs.toggleAttribute('data-invalida', falta);
        document.getElementById(`ad-${q.id}-error`)!.textContent = falta ? cfg.textos.errorPregunta : '';
      }
      if (faltan.length) {
        errorSeccion.textContent = cfg.textos.errorSeccion;
        form.querySelector<HTMLInputElement>(`fieldset[data-pregunta="${faltan[0].id}"] input`)!.focus();
        return;
      }
      errorSeccion.textContent = '';
      if (orden.indexOf(s.ultimoPaso) < orden.indexOf(seccion.id)) s.ultimoPaso = seccion.id;
      track('autodiagnostico_seccion', { seccion: seccion.id });

      if (i < SECCIONES.length - 1) {
        if (s.estado === 'iniciado') s.estado = 'en_curso';
        guardarSesion('en_curso');
        mostrar(SECCIONES[i + 1].id);
        return;
      }
      const r = calcular(s.respuestas);
      if (!r) return;
      s.estado = 'resultado_visto';
      s.ultimoPaso = 'resultado';
      guardarSesion('resultado_visto');
      pintarResultado(r);
      mostrar('resultado');
      track('autodiagnostico_resultado', { semaforo: r.semaforo, porcentaje: r.porcentaje });
    });
  });

  // ---------- Resultado ----------
  function pintarResultado(r: Resultado) {
    const q = <T extends HTMLElement>(sel: string) => raiz.querySelector<T>(sel)!;
    const nivel = cfg.textos.semaforo[r.semaforo];
    q('[data-r-empresa]').textContent = s!.empresa;
    q('[data-r-porcentaje]').textContent = `${r.porcentaje} %`;
    q('[data-r-puntos]').textContent = cfg.textos.puntos.replace('{puntos}', String(r.puntos)).replace('{maximo}', String(r.maximo));
    q('[data-r-total]').dataset.sem = r.semaforo;
    q('[data-r-semaforo-etiqueta]').textContent = nivel.etiqueta;
    q('[data-r-semaforo-texto]').textContent = nivel.texto;
    for (const d of r.dimensiones) {
      const li = q(`[data-r-dimension="${d.id}"]`);
      li.dataset.sem = d.semaforo;
      li.querySelector('[data-r-dim-puntos]')!.textContent = cfg.textos.puntos.replace('{puntos}', String(d.puntos)).replace('{maximo}', String(d.maximo));
      li.querySelector('[data-r-dim-semaforo]')!.textContent = cfg.textos.semaforo[d.semaforo].etiqueta;
      li.querySelector<HTMLElement>('[data-r-dim-barra]')!.style.width = `${d.porcentaje}%`;
    }
    const sinInv = raiz.querySelector<HTMLElement>('[data-r-sin-inventario]');
    if (sinInv) sinInv.hidden = !r.inventarioNoAplica;
    q('[data-r-banderas]').hidden = r.banderas.length === 0;
    raiz.querySelectorAll<HTMLElement>('[data-r-bandera]').forEach((li) => (li.hidden = !r.banderas.includes(li.dataset.rBandera!)));
    const ruta: Record<string, boolean> = { esencial: r.ruta.base === 'esencial', estandar: r.ruta.base === 'estandar', moduloA: r.ruta.moduloA, moduloB: r.ruta.moduloB };
    raiz.querySelectorAll<HTMLElement>('[data-r-ruta]').forEach((li) => (li.hidden = !ruta[li.dataset.rRuta!]));
    q('[data-r-nota-ventas]').hidden = !r.notaVentas;
    if (cfg.agenda) {
      const a = q<HTMLAnchorElement>('[data-r-agenda]');
      a.href = cfg.agenda;
      a.target = '_blank';
      a.rel = 'noopener';
    }
    if (s!.estado === 'contacto_enviado') mostrarExito(false);
    cargarTurnstile();
  }

  // ---------- Contacto ----------
  const formC = raiz.querySelector<HTMLFormElement>('[data-form-contacto]')!;
  const tc = cfg.textos.contacto;
  const boton = formC.querySelector<HTMLButtonElement>('[data-c-enviar]')!;
  const estadoC = formC.querySelector<HTMLElement>('[data-c-estado]')!;
  const resumen = formC.querySelector<HTMLElement>('[data-c-resumen]')!;
  const errorTurnstile = formC.querySelector<HTMLElement>('[data-c-turnstile-error]')!;
  const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const limpiarTel = (v: string) => v.replace(/[\s().-]/g, '');
  const campos = ['nombre', 'correo', 'whatsapp', 'ciudad', 'autorizacion'].map((n) => formC.elements.namedItem(n) as HTMLInputElement);

  const validarCampo = (c: HTMLInputElement): string => {
    if (c.type === 'checkbox') return c.checked ? '' : tc.errorAutorizacion;
    const v = c.value.trim();
    if (!v) return tc.errorRequerido;
    if (c.name === 'correo' && !CORREO.test(v)) return tc.errorCorreo;
    if (c.name === 'whatsapp' && !/^\+?[0-9]{7,15}$/.test(limpiarTel(v))) return tc.errorWhatsapp;
    return '';
  };
  const marcar = (c: HTMLInputElement, e: string) => {
    document.getElementById(`${c.id}-error`)!.textContent = e;
    c.setAttribute('aria-invalid', e ? 'true' : 'false');
  };
  campos.forEach((c) => c.addEventListener('blur', () => { if (c.value || c.type === 'checkbox') marcar(c, validarCampo(c)); }));

  let turnstileId: string | undefined;
  function cargarTurnstile() {
    if (!cfg.turnstile || document.getElementById('cf-turnstile-script')) return;
    (window as unknown as { alCargarTurnstile: () => void }).alCargarTurnstile = () => {
      const w = window as unknown as { turnstile: { render: (el: HTMLElement, o: object) => string } };
      turnstileId = w.turnstile.render(formC.querySelector<HTMLElement>('[data-c-turnstile]')!, {
        sitekey: cfg.turnstile, language: 'es', theme: 'light', action: 'autodiagnostico_contacto',
      });
    };
    const sc = document.createElement('script');
    sc.id = 'cf-turnstile-script';
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=alCargarTurnstile';
    sc.async = true;
    sc.defer = true;
    document.head.appendChild(sc);
  }
  const tokenTurnstile = (): string => {
    const w = window as unknown as { turnstile?: { getResponse: (id?: string) => string | undefined } };
    const campo = formC.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
    return (turnstileId !== undefined && w.turnstile?.getResponse(turnstileId)) || campo?.value || '';
  };
  const reiniciarTurnstile = () => {
    const w = window as unknown as { turnstile?: { reset: (id?: string) => void } };
    if (turnstileId !== undefined) w.turnstile?.reset(turnstileId);
  };

  function mostrarExito(enfocar = true) {
    formC.hidden = true;
    const ok = raiz.querySelector<HTMLElement>('[data-c-exito]')!;
    ok.hidden = false;
    if (enfocar) ok.focus();
  }

  formC.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!s) return;
    let primero: HTMLInputElement | null = null;
    for (const c of campos) {
      const e = validarCampo(c);
      marcar(c, e);
      if (e && !primero) primero = c;
    }
    const necesitaTurnstile = Boolean(cfg.url && cfg.turnstile);
    const tokenTs = tokenTurnstile();
    errorTurnstile.textContent = necesitaTurnstile && !tokenTs ? tc.errorVerificacion : '';
    if (primero || errorTurnstile.textContent) {
      resumen.textContent = tc.resumenErrores;
      (primero ?? formC.querySelector<HTMLElement>('[data-c-turnstile]'))?.focus();
      return;
    }
    resumen.textContent = '';
    if (!cfg.url) {
      estadoC.textContent = tc.noDisponible;
      raiz.querySelector<HTMLElement>('[data-c-whatsapp]')!.hidden = false;
      return;
    }
    boton.disabled = true;
    boton.textContent = tc.enviando;
    estadoC.textContent = '';
    const v = (n: string) => (formC.elements.namedItem(n) as HTMLInputElement).value.trim();
    try {
      const datos = {
        accion: 'contacto', session_token: s.token, version: VERSION_CUESTIONARIO,
        nombre: v('nombre'), correo: v('correo'), whatsapp: limpiarTel(v('whatsapp')), ciudad: v('ciudad'),
        consentimiento: (formC.elements.namedItem('autorizacion') as HTMLInputElement).checked,
        consentimiento_version: cfg.versionAutorizacion, consentimiento_url: cfg.urlPolitica,
        turnstile_token: tokenTs, sitio_web: v('sitio_web'),
      };
      // El servidor exige que el resultado ya esté guardado: esperar los guardados en curso.
      await guardadoPendiente;
      let r = await enviar(datos);
      let error = r && !r.ok ? String(((await r.clone().json().catch(() => ({}))) as { error?: string }).error ?? '') : '';
      // Si el resultado no alcanzó a guardarse (p. ej. una sesión retomada), guardarlo y reintentar una vez.
      if (r?.status === 409 && /no ha llegado al resultado/.test(error)) {
        await guardarSesion('resultado_visto');
        r = await enviar(datos);
        error = r && !r.ok ? String(((await r.clone().json().catch(() => ({}))) as { error?: string }).error ?? '') : '';
      }
      if (r && r.ok) {
        s.estado = 'contacto_enviado';
        s.ultimoPaso = 'contacto';
        guardarLocal();
        track('autodiagnostico_contacto');
        mostrarExito();
        return;
      }
      const yaEnviado = r?.status === 409 && /ya envió/.test(error);
      estadoC.textContent = yaEnviado ? tc.errorYaEnviado : tc.error;
      if (yaEnviado) { s.estado = 'contacto_enviado'; guardarLocal(); }
    } catch {
      estadoC.textContent = tc.error;
    }
    raiz.querySelector<HTMLElement>('[data-c-whatsapp]')!.hidden = false;
    reiniciarTurnstile();
    boton.disabled = false;
    boton.textContent = tc.enviar;
  });

  // ---------- Al salir de la página: guardar lo respondido (para medir el abandono) ----------
  const alSalir = () => {
    if (s && (s.estado === 'iniciado' || s.estado === 'en_curso') && Object.keys(s.respuestas).length) {
      guardarSesion(s.estado === 'iniciado' ? 'iniciado' : 'en_curso', true);
    }
  };
  addEventListener('pagehide', alSalir);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') alSalir(); });

  // ---------- Retomar una sesión de esta pestaña ----------
  const previa = leerLocal();
  if (previa && previa.token) {
    s = previa;
    inputEmpresa.value = s.empresa;
    for (const [id, k] of Object.entries(s.respuestas)) {
      const r = raiz.querySelector<HTMLInputElement>(`input[name="${id}"][value="${k}"]`);
      if (r) r.checked = true;
    }
    if (s.estado === 'resultado_visto' || s.estado === 'contacto_enviado') {
      const r = calcular(s.respuestas);
      if (r) { pintarResultado(r); mostrar('resultado', false); return; }
    }
    if (orden.includes(s.pantalla) && s.pantalla !== 'resultado') mostrar(s.pantalla, false);
  }
}
