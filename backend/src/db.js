const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

const { generateInitialTelemetry, generateInitialAlerts } = require('./seedData');

// Memoria volátil para desarrollo / demo cuando DATABASE_URL no está configurada aún
const memoryStore = {
  machines: [
    { id: 'M1', name: 'Torno CNC Mazak QTN-200', location: 'Taller de Mecanizado', threshold_kw: 35.0, status: 'NORMAL' },
    { id: 'M2', name: 'Fresadora 5 Ejes Hermle C42', location: 'Taller de Mecanizado', threshold_kw: 42.0, status: 'NORMAL' },
    { id: 'M3', name: 'Compresor Atlas Copco GA-75', location: 'Sala de Compresores', threshold_kw: 28.0, status: 'NORMAL' },
    { id: 'M4', name: 'Horno Tratamiento Ipsen VFC', location: 'Planta Térmica', threshold_kw: 55.0, status: 'NORMAL' }
  ],
  readings: generateInitialTelemetry(),
  alerts: generateInitialAlerts()
};

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('usuario:password') || connectionString.includes('npg_xxxx')) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Neon DB] DATABASE_URL no está configurada o contiene valores de ejemplo. Usando almacenamiento en memoria seguro.');
    return null;
  }

  try {
    // pg parses SSL parameters from the URL after its explicit SSL options.
    // Enforce certificate verification even for Neon URLs using sslmode=require.
    const databaseUrl = new URL(connectionString);
    databaseUrl.searchParams.set('sslmode', 'verify-full');
    pool = new Pool({
      connectionString: databaseUrl.toString(),
      ssl: {
        rejectUnauthorized: true
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('❌ [Neon DB] Error inesperado en el pool de conexiones:', err.message);
    });

    return pool;
  } catch (err) {
    console.error('❌ [Neon DB] Error al crear pool de Neon:', err.message);
    throw err;
  }
}

async function query(text, params) {
  const currentPool = getPool();
  if (currentPool) {
    try {
      const start = Date.now();
      const res = await currentPool.query(text, params);
      const duration = Date.now() - start;
      return res;
    } catch (err) {
      console.error(`❌ [Neon DB Query Error]: ${err.message}`);
      throw err;
    }
  }

  // Fallback transparente a memoria si no hay Neon configurado todavía
  return simulateQueryInMemory(text, params);
}

function simulateQueryInMemory(text, params = []) {
  const queryStr = text.toLowerCase();

  // SELECT * FROM machines
  if (queryStr.includes('from machines') && queryStr.includes('select')) {
    if (queryStr.includes('where id = $1')) {
      const match = memoryStore.machines.find(m => m.id === params[0]);
      return { rows: match ? [match] : [] };
    }
    return { rows: [...memoryStore.machines] };
  }

  // INSERT INTO telemetry_readings
  if (queryStr.includes('insert into telemetry_readings')) {
    const reading = {
      id: memoryStore.readings.length + 1,
      machine_id: params[0],
      power_kw: parseFloat(params[1]),
      voltage_v: parseFloat(params[2]),
      current_a: parseFloat(params[3]),
      timestamp: new Date().toISOString()
    };
    memoryStore.readings.push(reading);
    if (memoryStore.readings.length > 500) memoryStore.readings.shift();
    return { rows: [reading] };
  }

  // SELECT ... FROM telemetry_readings
  if (queryStr.includes('from telemetry_readings')) {
    let filtered = [...memoryStore.readings];
    if (params && params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('M')) {
      filtered = filtered.filter(r => r.machine_id === params[0]);
    }
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limit = (params && params.find(p => typeof p === 'number')) || 100;
    return { rows: filtered.slice(0, limit) };
  }

  // INSERT INTO alert_logs
  if (queryStr.includes('insert into alert_logs')) {
    const alert = {
      id: memoryStore.alerts.length + 1,
      machine_id: params[0],
      power_kw: parseFloat(params[1]),
      threshold_kw: parseFloat(params[2]),
      email_sent: Boolean(params[3]),
      recipient_email: params[4],
      details: params[5] || '',
      created_at: new Date().toISOString()
    };
    memoryStore.alerts.unshift(alert);
    if (memoryStore.alerts.length > 100) memoryStore.alerts.pop();
    return { rows: [alert] };
  }

  // SELECT ... FROM alert_logs
  if (queryStr.includes('from alert_logs')) {
    return { rows: [...memoryStore.alerts] };
  }

  return { rows: [] };
}

module.exports = {
  getPool,
  query,
  memoryStore
};
