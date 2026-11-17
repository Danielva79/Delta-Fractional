// =============================================================================
// Autodiagnóstico financiero: cuestionario, validación y cálculo.
//
// ARCHIVO COMPARTIDO. Hay dos copias que deben ser IDÉNTICAS (byte a byte):
//   - Sitio:     Danielva79/Delta-Fractional  src/lib/autodiagnostico/cuestionario.ts
//   - Servidor:  Danielva79/delta-bi          supabase/functions/autodiagnostico-guardar/cuestionario.ts
// El navegador calcula el resultado para mostrarlo; la Edge Function lo recalcula con
// este mismo código antes de guardarlo (nunca confía en el puntaje que manda el navegador).
// Comprobar: sha256sum de los dos archivos debe dar lo mismo (ver docs/autodiagnostico.md).
//
// Si cambia una pregunta, una opción o un puntaje, cree una VERSIÓN NUEVA (no edite la
// existente): las sesiones guardadas quedan con la versión con la que se respondieron.
// Sin dependencias ni APIs del navegador o de Deno: TypeScript puro.
// =============================================================================

export const VERSION_CUESTIONARIO = 'v1-2026-11';

export type IdDimension = 'control' | 'caja' | 'recurrencia' | 'costos' | 'gobierno';
export type Semaforo = 'rojo' | 'amarillo' | 'verde';

export interface Opcion {
  texto: string;
  /** Puntos de la opción (0 a 3). Las preguntas de calificación no tienen puntos. */
  puntos?: number;
  /** Bandera roja: se muestra aparte, sin importar el puntaje. */
  bandera?: boolean;
  /** "No aplica": la pregunta se excluye del cálculo. */
  noAplica?: boolean;
}

export interface Pregunta {
  id: string;
  /** Texto con {ANIO} (año en curso) y {ANIO_ANTERIOR}, que se reemplazan en el navegador. */
  texto: string;
  /** Aclaración corta bajo la pregunta (términos técnicos). */
  aclaracion?: string;
  /** Texto corto para la bandera roja de esta pregunta. */
  textoBandera?: string;
  opciones: Opcion[];
}

export interface Seccion {
  id: 'calificacion' | IdDimension;
  titulo: string;
  preguntas: Pregunta[];
}

const p = (texto: string, puntos: number, extra: Partial<Opcion> = {}): Opcion => ({ texto, puntos, ...extra });

export const SECCIONES: Seccion[] = [
  {
    id: 'calificacion',
    titulo: 'Su empresa',
    preguntas: [
      {
        id: 'C1',
        texto: '¿A qué actividad económica se dedica principalmente su empresa?',
        opciones: [{ texto: 'Comercio' }, { texto: 'Manufactura' }, { texto: 'Servicios' }, { texto: 'Agropecuaria' }, { texto: 'Otra' }],
      },
      {
        id: 'C2',
        texto: '¿Con qué valor aproximado de ventas estima usted que su empresa cerrará el año {ANIO}?',
        aclaracion: 'Incluya las ventas realizadas hasta hoy más las que espera facturar antes del 31 de diciembre.',
        opciones: [
          { texto: 'Menos de COP 500 millones' },
          { texto: '500 a 1.500 millones' },
          { texto: '1.500 a 5.000 millones' },
          { texto: '5.000 a 20.000 millones' },
          { texto: 'Más de 20.000 millones' },
          { texto: 'Prefiero no responder' },
        ],
      },
      {
        id: 'C3',
        texto: 'Frente a las ventas de {ANIO_ANTERIOR}, ¿cómo espera usted que cierren las ventas de {ANIO}?',
        opciones: [
          { texto: 'Inferiores' },
          { texto: 'Similares' },
          { texto: 'Superiores en menos del 15 %' },
          { texto: 'Superiores en 15 % o más' },
        ],
      },
      {
        id: 'C4',
        texto: '¿Cuántas sedes o líneas de negocio tiene su empresa?',
        opciones: [{ texto: 'Una' }, { texto: 'Dos o tres' }, { texto: 'Cuatro o más' }],
      },
      {
        id: 'C5',
        texto: '¿Qué cargo ocupa usted en la empresa?',
        opciones: [{ texto: 'Propietario o gerente' }, { texto: 'Director financiero o contador' }, { texto: 'Otro' }],
      },
    ],
  },
  {
    id: 'control',
    titulo: 'Control y reportes',
    preguntas: [
      {
        id: 'P1',
        texto: '¿Con qué periodicidad recibe usted los estados financieros de su empresa?',
        aclaracion: 'Estados financieros: balance general y estado de resultados, que muestran lo que la empresa tiene, debe, vende y gana.',
        opciones: [
          p('Solo al cierre anual', 0),
          p('Trimestralmente o cuando los solicito', 1),
          p('Mensualmente, después del día 20', 2),
          p('Mensualmente, antes del día 20', 3),
        ],
      },
      {
        id: 'P2',
        texto: '¿Están separados los recursos de los socios y los de la empresa?',
        aclaracion: 'Por ejemplo, si los gastos personales de los socios se pagan con las cuentas de la empresa.',
        opciones: [
          p('No, se manejan de forma conjunta', 0),
          p('Parcialmente', 1),
          p('Sí, en cuentas separadas', 2),
          p('Sí, y los socios reciben una remuneración fija', 3),
        ],
      },
      {
        id: 'P3',
        texto: '¿Revisa usted periódicamente un tablero con los indicadores clave de la empresa?',
        aclaracion: 'Indicadores clave: cifras que resumen la marcha del negocio, como ventas, margen, caja o cartera.',
        opciones: [
          p('No se utilizan indicadores', 0),
          p('Ocasionalmente', 1),
          p('Trimestralmente', 2),
          p('Mensualmente', 3),
        ],
      },
    ],
  },
  {
    id: 'caja',
    titulo: 'Caja y liquidez',
    preguntas: [
      {
        id: 'P4',
        texto: 'En los últimos seis meses, ¿ha tenido que aplazar pagos por falta de liquidez?',
        aclaracion: 'Liquidez: dinero disponible para pagar las obligaciones.',
        textoBandera: 'Se han aplazado pagos de nómina o impuestos por falta de liquidez.',
        opciones: [
          p('Sí, incluidos nómina o impuestos', 0, { bandera: true }),
          p('Sí, a proveedores', 1),
          p('En una ocasión aislada', 2),
          p('No', 3),
        ],
      },
      {
        id: 'P5',
        texto: '¿Con qué horizonte proyecta su empresa el flujo de caja?',
        aclaracion: 'Flujo de caja: estimación del dinero que entrará y saldrá de la empresa en las próximas semanas o meses.',
        opciones: [
          p('No se realiza proyección', 0),
          p('Menos de un mes', 1),
          p('Entre uno y tres meses', 2),
          p('Trece semanas o más, con actualización periódica', 3),
        ],
      },
      {
        id: 'P6',
        texto: '¿Cuántos meses de gastos fijos podría cubrir la empresa con su caja disponible?',
        aclaracion: 'Gastos fijos: los que se pagan aunque no se venda, como arriendo, nómina administrativa y servicios.',
        textoBandera: 'La caja disponible cubre menos de un mes de gastos fijos, o no se conoce.',
        opciones: [
          p('Menos de un mes o no lo sé', 0, { bandera: true }),
          p('Entre uno y dos meses', 1),
          p('Entre dos y tres meses', 2),
          p('Más de tres meses', 3),
        ],
      },
    ],
  },
  {
    id: 'recurrencia',
    titulo: 'Recurrencia y clientes',
    preguntas: [
      {
        id: 'P7',
        texto: '¿Qué porcentaje de las ventas representa su principal cliente?',
        aclaracion: 'Una dependencia alta de un solo cliente aumenta el riesgo si ese cliente se va o paga tarde.',
        textoBandera: 'El principal cliente representa más de la mitad de las ventas.',
        opciones: [
          p('Más del 50 %', 0, { bandera: true }),
          p('Entre el 25 % y el 50 %', 1),
          p('Entre el 10 % y el 25 %', 2),
          p('Menos del 10 %', 3),
        ],
      },
      {
        id: 'P8',
        texto: '¿Qué porcentaje de las ventas proviene de clientes recurrentes o contratos periódicos?',
        aclaracion: 'Clientes recurrentes: los que compran de forma repetida o tienen un contrato con pagos periódicos.',
        opciones: [
          p('No lo sé', 0),
          p('Menos del 30 %', 1),
          p('Entre el 30 % y el 60 %', 2),
          p('Más del 60 %', 3),
        ],
      },
      {
        id: 'P9',
        texto: '¿Cuál es el plazo promedio en que sus clientes pagan?',
        aclaracion: 'Días que pasan entre la factura y el pago del cliente.',
        textoBandera: 'Los clientes pagan en más de 90 días en promedio, o no se conoce el plazo.',
        opciones: [
          p('Más de 90 días o no lo sé', 0, { bandera: true }),
          p('Entre 61 y 90 días', 1),
          p('Entre 30 y 60 días', 2),
          p('De contado o menos de 30 días', 3),
        ],
      },
    ],
  },
  {
    id: 'costos',
    titulo: 'Costos e inventarios',
    preguntas: [
      {
        id: 'P10',
        texto: '¿Conoce usted el costo unitario de los productos o servicios que vende?',
        aclaracion: 'Costo unitario: lo que le cuesta a la empresa producir o prestar una unidad de lo que vende.',
        opciones: [
          p('No', 0),
          p('De forma aproximada', 1),
          p('Sí, para los principales', 2),
          p('Sí, para todos y se actualiza periódicamente', 3),
        ],
      },
      {
        id: 'P11',
        texto: '¿Sabe usted qué productos, servicios o clientes generan utilidad y cuáles generan pérdida?',
        aclaracion: 'Utilidad: lo que queda después de restar a las ventas todos los costos y gastos.',
        opciones: [
          p('No', 0),
          p('Lo percibo, pero no está medido', 1),
          p('Sí, a nivel general', 2),
          p('Sí, por producto o cliente, con revisión periódica', 3),
        ],
      },
      {
        id: 'P12',
        texto: '¿Cómo controla su empresa el inventario?',
        aclaracion: 'Días de rotación: tiempo promedio que la mercancía permanece en bodega antes de venderse.',
        opciones: [
          p('No se conoce con precisión', 0),
          p('Conteos ocasionales', 1),
          p('En unidades, con sistema', 2),
          p('En unidades, valor y días de rotación', 3),
          { texto: 'La empresa no maneja inventario', noAplica: true },
        ],
      },
    ],
  },
  {
    id: 'gobierno',
    titulo: 'Gobierno y planeación',
    preguntas: [
      {
        id: 'P13',
        texto: '¿Cuenta su empresa con un presupuesto anual y lo compara con los resultados reales?',
        aclaracion: 'Presupuesto: plan de ventas, costos y gastos esperados para el año.',
        opciones: [
          p('No se elabora presupuesto', 0),
          p('Se elabora, pero no se hace seguimiento', 1),
          p('Se compara ocasionalmente', 2),
          p('Se compara mensualmente', 3),
        ],
      },
      {
        id: 'P14',
        texto: '¿Con qué base se toman las decisiones importantes de inversión, contratación o endeudamiento?',
        aclaracion: 'Análisis de escenarios: proyectar qué pasaría con la caja y los resultados si las ventas o los costos cambian.',
        opciones: [
          p('Por criterio del propietario', 0),
          p('Con información contable histórica', 1),
          p('Con proyecciones financieras', 2),
          p('Con proyección de caja y análisis de escenarios', 3),
        ],
      },
      {
        id: 'P15',
        texto: '¿Con qué periodicidad se reúne la dirección exclusivamente para revisar los resultados financieros?',
        opciones: [
          p('Nunca', 0),
          p('Cuando surge un problema', 1),
          p('Trimestralmente', 2),
          p('Mensualmente, con acta y compromisos', 3),
        ],
      },
    ],
  },
];

export const PREGUNTAS: Pregunta[] = SECCIONES.flatMap((s) => s.preguntas);
const PREGUNTA_POR_ID = new Map(PREGUNTAS.map((q) => [q.id, q]));
const DIMENSIONES = SECCIONES.filter((s) => s.id !== 'calificacion') as (Seccion & { id: IdDimension })[];

/** Respuestas: id de pregunta → índice de la opción elegida (0 = primera). */
export type Respuestas = Record<string, number>;

/** Valida forma y valores. Devuelve la lista de errores (vacía si todo está bien). */
export function validarRespuestas(r: unknown): string[] {
  if (typeof r !== 'object' || r === null || Array.isArray(r)) return ['respuestas debe ser un objeto'];
  const errores: string[] = [];
  for (const [id, v] of Object.entries(r as Record<string, unknown>)) {
    const q = PREGUNTA_POR_ID.get(id);
    if (!q) errores.push(`pregunta desconocida: ${id}`);
    else if (!Number.isInteger(v) || (v as number) < 0 || (v as number) >= q.opciones.length) errores.push(`opción no válida en ${id}`);
  }
  return errores;
}

/** true si están respondidas las 20 preguntas. */
export const respuestasCompletas = (r: Respuestas) => PREGUNTAS.every((q) => Number.isInteger(r[q.id]));

/** Porcentaje entero y semáforo: rojo 0–39 %, amarillo 40–69 %, verde 70 % o más. */
export const porcentaje = (puntos: number, maximo: number) => (maximo > 0 ? Math.round((puntos / maximo) * 100) : 0);
export const semaforoDe = (pct: number): Semaforo => (pct >= 70 ? 'verde' : pct >= 40 ? 'amarillo' : 'rojo');

export interface ResultadoDimension {
  id: IdDimension;
  titulo: string;
  puntos: number;
  maximo: number;
  porcentaje: number;
  semaforo: Semaforo;
}

export interface Ruta {
  base: 'esencial' | 'estandar';
  moduloA: boolean;
  moduloB: boolean;
}

export interface Resultado {
  version: string;
  puntos: number;
  maximo: number;
  porcentaje: number;
  semaforo: Semaforo;
  dimensiones: ResultadoDimension[];
  /** Ids de las preguntas con bandera roja, en el orden del cuestionario. */
  banderas: string[];
  ruta: Ruta;
  /** C3 = Inferiores o Similares: se muestra una nota prudente. */
  notaVentas: boolean;
  /** P12 = la empresa no maneja inventario. */
  inventarioNoAplica: boolean;
}

/** Calcula el resultado. Devuelve null si faltan respuestas o alguna no es válida. */
export function calcular(r: Respuestas): Resultado | null {
  if (validarRespuestas(r).length || !respuestasCompletas(r)) return null;
  const opcion = (id: string) => PREGUNTA_POR_ID.get(id)!.opciones[r[id]];

  const dimensiones: ResultadoDimension[] = DIMENSIONES.map((d) => {
    let puntos = 0;
    let maximo = 0;
    for (const q of d.preguntas) {
      const o = opcion(q.id);
      if (o.noAplica) continue;
      puntos += o.puntos ?? 0;
      maximo += 3;
    }
    const pct = porcentaje(puntos, maximo);
    return { id: d.id, titulo: d.titulo, puntos, maximo, porcentaje: pct, semaforo: semaforoDe(pct) };
  });

  const puntos = dimensiones.reduce((s, d) => s + d.puntos, 0);
  const maximo = dimensiones.reduce((s, d) => s + d.maximo, 0); // 45, o 42 si P12 no aplica
  const pct = porcentaje(puntos, maximo);
  const banderas = PREGUNTAS.filter((q) => opcion(q.id).bandera).map((q) => q.id);
  const dim = (id: IdDimension) => dimensiones.find((d) => d.id === id)!;
  const inventarioNoAplica = Boolean(opcion('P12').noAplica);

  // Base Esencial: ventas de hasta COP 1.500 millones (C2 opción 0 o 1) y una sola sede o línea (C4 = Una).
  // "Prefiero no responder" (C2 opción 5) va a Estándar.
  const esencial = r.C2 <= 1 && r.C4 === 0;
  const ruta: Ruta = {
    base: esencial ? 'esencial' : 'estandar',
    moduloA: dim('caja').puntos <= 4 || dim('recurrencia').puntos <= 4 || banderas.length > 0,
    moduloB: !inventarioNoAplica && dim('costos').puntos <= 4,
  };

  return {
    version: VERSION_CUESTIONARIO,
    puntos,
    maximo,
    porcentaje: pct,
    semaforo: semaforoDe(pct),
    dimensiones,
    banderas,
    ruta,
    notaVentas: r.C3 === 0 || r.C3 === 1,
    inventarioNoAplica,
  };
}
