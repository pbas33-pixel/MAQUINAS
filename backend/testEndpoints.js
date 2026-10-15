const app = require('./src/server');
const http = require('http');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099';

  console.log('🚀 Servidor de prueba iniciado en puerto 5099');

  try {
    // 1. Test GET /api/machines
    console.log('\n--- 1. Testing GET /api/machines ---');
    const resMachines = await fetch(`${baseUrl}/api/machines`);
    const dataMachines = await resMachines.json();
    console.log(`Status: ${resMachines.status}, Machines count: ${dataMachines.count}`);
    if (dataMachines.count !== 4) throw new Error('Expected 4 machines');

    // 2. Test POST /api/telemetry (Normal reading)
    console.log('\n--- 2. Testing POST /api/telemetry (Normal reading M1) ---');
    const resTelem1 = await fetch(`${baseUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M1', powerKw: 24.5, voltageV: 400, currentA: 36.8 })
    });
    const dataTelem1 = await resTelem1.json();
    console.log(`Status: ${resTelem1.status}, Saved: ${dataTelem1.reading.machine_id}, Status: ${dataTelem1.evaluation.status}`);
    if (resTelem1.status !== 201) throw new Error('Expected 201 for valid telemetry');

    // 3. Test POST /api/telemetry (Invalid machine)
    console.log('\n--- 3. Testing POST /api/telemetry (Invalid machine M99) ---');
    const resInvalid = await fetch(`${baseUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M99', powerKw: 24.5 })
    });
    console.log(`Status: ${resInvalid.status} (Expected 400)`);
    if (resInvalid.status !== 400) throw new Error('Expected 400 for invalid machine');

    // 4. Test POST /api/telemetry (Overconsumption reading M2 -> triggers alert)
    console.log('\n--- 4. Testing POST /api/telemetry (Overconsumption M2: 52 kW > 42 kW) ---');
    const resCritical = await fetch(`${baseUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M2', powerKw: 52.0, voltageV: 405, currentA: 78.0 })
    });
    const dataCritical = await resCritical.json();
    console.log(`Status: ${resCritical.status}, Evaluation: ${dataCritical.evaluation.status}, AlertTriggered: ${dataCritical.evaluation.alertTriggered}`);
    if (!dataCritical.evaluation.alertTriggered) throw new Error('Expected alert triggered for overconsumption');

    // 5. Test GET /api/telemetry/history
    console.log('\n--- 5. Testing GET /api/telemetry/history ---');
    const resHist = await fetch(`${baseUrl}/api/telemetry/history`);
    const dataHist = await resHist.json();
    console.log(`Status: ${resHist.status}, History count: ${dataHist.count}`);

    // 6. Test GET /api/alerts
    console.log('\n--- 6. Testing GET /api/alerts ---');
    const resAlerts = await fetch(`${baseUrl}/api/alerts`);
    const dataAlerts = await resAlerts.json();
    console.log(`Status: ${resAlerts.status}, Alerts count: ${dataAlerts.count}`);

    // 7. Test POST /api/alerts/test (Task 3.3)
    console.log('\n--- 7. Testing POST /api/alerts/test ---');
    const resTestAlert = await fetch(`${baseUrl}/api/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M3', powerKw: 34.0 })
    });
    const dataTestAlert = await resTestAlert.json();
    console.log(`Status: ${resTestAlert.status}, Result: ${dataTestAlert.result.message}`);

    console.log('\n✅ ¡TODOS LOS TESTS DE ENDPOINTS COMPLETADOS CON ÉXITO!');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Error en tests:', err);
  process.exit(1);
});
