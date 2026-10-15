const app = require('./src/server');
const http = require('http');

async function testE2E() {
  console.log('⚡ Iniciando pruebas de Integración End-to-End (Fase 6)...');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5188, resolve));
  const baseUrl = 'http://localhost:5188';

  try {
    // Paso 1: Ingestión normal para las 4 máquinas
    console.log('\n--- Paso 6.1: Ingestión para las 4 máquinas ---');
    const machines = [
      { id: 'M1', power: 22.4, v: 400, a: 34 },
      { id: 'M2', power: 31.0, v: 401, a: 47 },
      { id: 'M3', power: 18.5, v: 399, a: 28 },
      { id: 'M4', power: 42.0, v: 402, a: 63 }
    ];

    for (const m of machines) {
      const res = await fetch(`${baseUrl}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId: m.id, powerKw: m.power, voltageV: m.v, currentA: m.a })
      });
      const data = await res.json();
      console.log(`✓ ${m.id} Telemetría: ${data.reading.power_kw} kW - Estado: ${data.evaluation.status}`);
      if (res.status !== 201) throw new Error(`Fallo en ingestión de ${m.id}`);
    }

    // Verificar estado consolidado en /api/machines
    const resSummary = await fetch(`${baseUrl}/api/machines`);
    const summaryData = await resSummary.json();
    console.log(`✓ Total máquinas verificadas: ${summaryData.count}`);
    const allNormal = summaryData.machines.every(m => m.status === 'NORMAL');
    console.log(`✓ ¿Todas en estado NORMAL?: ${allNormal}`);
    if (!allNormal) throw new Error('Se esperaba estado NORMAL en todas las máquinas');

    // Paso 2: Provocar pico de sobreconsumo en M4 (Horno: umbral 55 kW -> enviar 74 kW)
    console.log('\n--- Paso 6.2: Provocando pico de sobreconsumo en M4 (Horno) ---');
    const resSpike = await fetch(`${baseUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M4', powerKw: 74.5, voltageV: 405, currentA: 115 })
    });
    const spikeData = await resSpike.json();
    console.log(`✓ M4 Estado tras pico: ${spikeData.evaluation.status}`);
    console.log(`✓ Alerta disparada: ${spikeData.evaluation.alertTriggered} (Exceso: +${spikeData.evaluation.excessPct}%)`);
    if (spikeData.evaluation.status !== 'CRITICAL' || !spikeData.evaluation.alertTriggered) {
      throw new Error('M4 debía disparar estado CRITICAL y alerta');
    }

    // Comprobar que /api/machines refleja M4 como CRITICAL
    const resUpdated = await fetch(`${baseUrl}/api/machines`);
    const updatedData = await resUpdated.json();
    const m4 = updatedData.machines.find(m => m.id === 'M4');
    console.log(`✓ M4 Estado en /api/machines: ${m4.status} (Carga: ${m4.loadPercentage}%, Cooldown activo: ${m4.cooldown.inCooldown})`);
    if (m4.status !== 'CRITICAL') throw new Error('M4 debía figurar como CRITICAL');

    // Comprobar que /api/alerts contiene el registro de M4
    const resAlerts = await fetch(`${baseUrl}/api/alerts`);
    const alertsData = await resAlerts.json();
    const lastAlert = alertsData.alerts[0];
    console.log(`✓ Última alerta en auditoría: [${lastAlert.machine_id}] ${lastAlert.power_kw} kW - ${lastAlert.details}`);
    if (lastAlert.machine_id !== 'M4') throw new Error('La última alerta debe pertenecer a M4');

    // Probar segundo sobreconsumo inmediato para verificar cooldown
    console.log('\n--- Verificación de Cooldown anti-spam ---');
    const resCooldown = await fetch(`${baseUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M4', powerKw: 75.0, voltageV: 404, currentA: 116 })
    });
    const cdData = await resCooldown.json();
    console.log(`✓ Segundo pico en M4 - Cooldown activo: ${cdData.evaluation.cooldownActive}`);
    if (!cdData.evaluation.cooldownActive) throw new Error('Cooldown debía estar activo para M4');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS END-TO-END DE LA FASE 6 COMPLETADAS CON ÉXITO!');
  } finally {
    server.close();
  }
}

testE2E().catch(err => {
  console.error('❌ Error en pruebas E2E:', err);
  process.exit(1);
});
