// Pruebas del cálculo del autodiagnóstico (src/lib/autodiagnostico/cuestionario.ts).
// Uso: node scripts/probar-cuestionario.mjs   (Node 24 quita los tipos de TypeScript solo)
import assert from 'node:assert/strict';
import { calcular, validarRespuestas, PREGUNTAS, VERSION_CUESTIONARIO } from '../src/lib/autodiagnostico/cuestionario.ts';

// Misma opción en todas las preguntas (sin pasarse de la última opción de cada una).
const base = (valor) => Object.fromEntries(PREGUNTAS.map((q) => [q.id, Math.min(valor, q.opciones.length - 1)]));
let n = 0;
const caso = (nombre, fn) => { fn(); n++; console.log('ok', nombre); };

caso('20 preguntas, 15 puntuadas en 5 dimensiones de 3', () => {
  assert.equal(PREGUNTAS.length, 20);
  assert.equal(VERSION_CUESTIONARIO, 'v1-2026-11');
});

caso('todo en la mejor opción: 45/45, verde, sin banderas, Base Esencial sin módulos', () => {
  const r = { ...base(3), C1: 0, C2: 0, C3: 3, C4: 0, C5: 0 };
  const x = calcular(r);
  assert.equal(x.puntos, 45); assert.equal(x.maximo, 45); assert.equal(x.porcentaje, 100);
  assert.equal(x.semaforo, 'verde'); assert.deepEqual(x.banderas, []);
  assert.deepEqual(x.ruta, { base: 'esencial', moduloA: false, moduloB: false });
  assert.equal(x.notaVentas, false);
  for (const d of x.dimensiones) { assert.equal(d.maximo, 9); assert.equal(d.puntos, 9); }
});

caso('todo en 0: rojo, cuatro banderas, Estándar con módulos A y B', () => {
  const r = { ...base(0), C2: 2, C4: 0 };
  const x = calcular(r);
  assert.equal(x.puntos, 0); assert.equal(x.semaforo, 'rojo');
  assert.deepEqual(x.banderas, ['P4', 'P6', 'P7', 'P9']);
  assert.deepEqual(x.ruta, { base: 'estandar', moduloA: true, moduloB: true });
  assert.equal(x.notaVentas, true); // C3 = Inferiores
});

caso('P12 no aplica: máximo 42, costos sobre 6, sin módulo B', () => {
  const r = { ...base(1), C2: 0, C4: 0, P12: 4 };
  const x = calcular(r);
  assert.equal(x.maximo, 42);
  const costos = x.dimensiones.find((d) => d.id === 'costos');
  assert.equal(costos.maximo, 6); assert.equal(costos.puntos, 2);
  assert.equal(x.ruta.moduloB, false);
  assert.equal(x.inventarioNoAplica, true);
});

caso('cortes del semáforo: 17/45 = 38 % rojo, 18/45 = 40 % amarillo, 31/45 = 69 % amarillo, 32/45 = 71 % verde', () => {
  // Suma exacta: 15 preguntas puntuadas; repartir puntos.
  const conPuntos = (total) => {
    const r = { ...base(0), C2: 0, C4: 0 };
    const ids = PREGUNTAS.filter((q) => q.id.startsWith('P')).map((q) => q.id);
    let resto = total;
    for (const id of ids) { const v = Math.min(3, resto); r[id] = v; resto -= v; }
    return calcular(r);
  };
  assert.equal(conPuntos(17).porcentaje, 38); assert.equal(conPuntos(17).semaforo, 'rojo');
  assert.equal(conPuntos(18).porcentaje, 40); assert.equal(conPuntos(18).semaforo, 'amarillo');
  assert.equal(conPuntos(31).porcentaje, 69); assert.equal(conPuntos(31).semaforo, 'amarillo');
  assert.equal(conPuntos(32).porcentaje, 71); assert.equal(conPuntos(32).semaforo, 'verde');
});

caso('ruta: "Prefiero no responder" y dos sedes van a Estándar; 500 a 1.500 millones y una sede, Esencial', () => {
  const mejor = { ...base(3), C3: 3 };
  assert.equal(calcular({ ...mejor, C2: 5, C4: 0 }).ruta.base, 'estandar');
  assert.equal(calcular({ ...mejor, C2: 1, C4: 1 }).ruta.base, 'estandar');
  assert.equal(calcular({ ...mejor, C2: 1, C4: 0 }).ruta.base, 'esencial');
  assert.equal(calcular({ ...mejor, C2: 2, C4: 0 }).ruta.base, 'estandar');
});

caso('módulo A por una sola bandera aunque caja y recurrencia estén altas', () => {
  const x = calcular({ ...base(3), C2: 0, C4: 0, C3: 3, P7: 0 }); // recurrencia = 6/9
  assert.deepEqual(x.banderas, ['P7']); assert.equal(x.ruta.moduloA, true);
});

caso('módulo A por caja 4/9 sin banderas; no con 5/9', () => {
  const r = { ...base(3), C2: 0, C4: 0, C3: 3, P4: 1, P5: 2, P6: 1 }; // 4
  assert.equal(calcular(r).ruta.moduloA, true);
  assert.equal(calcular({ ...r, P5: 3 }).ruta.moduloA, false); // 5
});

caso('validación: pregunta desconocida, opción fuera de rango, no entero, incompletas', () => {
  assert.ok(validarRespuestas({ X1: 0 }).length);
  assert.ok(validarRespuestas({ C4: 3 }).length);
  assert.ok(validarRespuestas({ P12: 5 }).length);
  assert.equal(validarRespuestas({ P12: 4 }).length, 0);
  assert.ok(validarRespuestas({ P1: 1.5 }).length);
  assert.ok(validarRespuestas({ P1: '1' }).length);
  assert.ok(validarRespuestas([]).length);
  assert.equal(calcular({ C1: 0 }), null);
});

console.log(`\n${n} casos OK`);
