const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { evaluateReading } = require('../services/alertEvaluator');
const { importExcelData } = require('../services/excelImporter');

// Ingestión masiva desde archivo Excel local
router.post('/import-excel', async (req, res) => {
  try {
    const { filePath } = req.body || {};
    const result = await importExcelData(filePath);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error en POST /api/telemetry/import-excel:', err.message);
    return res.status(400).json({
      error: 'Error al procesar el archivo Excel',
      message: err.message
    });
  }
});

// Ingestión de nueva lectura de telemetría
router.post('/', async (req, res) => {
  try {
    const { machineId, powerKw, voltageV, currentA } = req.body;

    if (!machineId || powerKw === undefined || powerKw === null) {
      return res.status(400).json({
        error: 'machineId y powerKw son campos obligatorios',
        received: req.body
      });
    }

    const power = parseFloat(powerKw);
    if (isNaN(power) || power < 0) {
      return res.status(400).json({
        error: 'powerKw debe ser un número positivo'
      });
    }

    // Verificar existencia de la máquina
    const machineRes = await query('SELECT * FROM machines WHERE id = $1', [machineId]);
    if (!machineRes.rows || machineRes.rows.length === 0) {
      return res.status(400).json({
        error: `Máquina inválida '${machineId}'. Las máquinas válidas son M1, M2, M3, M4.`,
        validMachines: ['M1', 'M2', 'M3', 'M4']
      });
    }

    const machine = machineRes.rows[0];
    const voltage = parseFloat(voltageV) || 400.0;
    const current = parseFloat(currentA) || parseFloat((power * 1.5).toFixed(2));

    // Persistir lectura en Neon
    const insertRes = await query(
      `INSERT INTO telemetry_readings (machine_id, power_kw, voltage_v, current_a)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [machine.id, power, voltage, current]
    );

    const savedReading = insertRes.rows && insertRes.rows.length > 0
      ? insertRes.rows[0]
      : { machine_id: machine.id, power_kw: power, voltage_v: voltage, current_a: current, timestamp: new Date().toISOString() };

    // Evaluar sobreconsumo y alertar si aplica
    const evaluation = await evaluateReading(machine, savedReading);

    return res.status(201).json({
      message: 'Telemetría registrada correctamente',
      reading: savedReading,
      evaluation
    });
  } catch (err) {
    console.error('Error en POST /api/telemetry:', err);
    return res.status(500).json({ error: 'Error interno al procesar telemetría', details: err.message });
  }
});

// Historial cronológico de telemetría para gráficos
router.get('/history', async (req, res) => {
  try {
    const { machineId, limit } = req.query;
    const maxRecords = Math.min(parseInt(limit, 10) || 100, 500);

    let queryText = 'SELECT * FROM telemetry_readings';
    let params = [];

    if (machineId) {
      queryText += ' WHERE machine_id = $1 ORDER BY timestamp DESC LIMIT $2';
      params = [machineId, maxRecords];
    } else {
      queryText += ' ORDER BY timestamp DESC LIMIT $1';
      params = [maxRecords];
    }

    const result = await query(queryText, params);
    return res.json({
      count: result.rows.length,
      readings: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/telemetry/history:', err);
    return res.status(500).json({ error: 'Error al consultar historial', details: err.message });
  }
});

module.exports = router;
