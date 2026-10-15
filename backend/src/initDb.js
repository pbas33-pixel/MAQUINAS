const fs = require('fs');
const path = require('path');
const { getPool, memoryStore } = require('./db');

async function initializeDatabase() {
  const pool = getPool();

  if (!pool) {
    console.log('ℹ️  [DB Init] Inicializado modo almacenamiento seguro en memoria (4 máquinas listas para monitorización).');
    return true;
  }

  try {
    console.log('🔄 [Neon DB Init] Conectando a Neon Postgres y aplicando esquema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    await pool.query(schemaSql);
    console.log('✅ [Neon DB Init] Tablas machines, telemetry_readings y alert_logs listas en Neon.');

    // Comprobar si ya existen lecturas; si no, insertar las lecturas semilla
    const countRes = await pool.query('SELECT COUNT(*) as count FROM telemetry_readings');
    const count = parseInt(countRes.rows[0]?.count || 0, 10);
    if (count === 0) {
      console.log('🌱 [Neon DB Init] Sembrando historial de lecturas iniciales y alertas...');
      const { generateInitialTelemetry, generateInitialAlerts } = require('./seedData');
      const seedReadings = generateInitialTelemetry();
      for (const r of seedReadings) {
        await pool.query(
          'INSERT INTO telemetry_readings (machine_id, power_kw, voltage_v, current_a, timestamp) VALUES ($1, $2, $3, $4, $5)',
          [r.machine_id, r.power_kw, r.voltage_v, r.current_a, r.timestamp]
        );
      }
      const seedAlerts = generateInitialAlerts();
      for (const a of seedAlerts) {
        await pool.query(
          'INSERT INTO alert_logs (machine_id, power_kw, threshold_kw, email_sent, recipient_email, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [a.machine_id, a.power_kw, a.threshold_kw, a.email_sent, a.recipient_email, a.details, a.created_at]
        );
      }
      console.log(`✅ [Neon DB Init] Insertadas ${seedReadings.length} lecturas y ${seedAlerts.length} alertas en Neon.`);
    }

    return true;
  } catch (err) {
    console.warn(`⚠️  [Neon DB Init] No se pudo ejecutar el script en Neon (${err.message}). Continuando con almacenamiento local.`);
    return false;
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
