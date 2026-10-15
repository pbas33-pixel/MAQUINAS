const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { getCooldownStatus } = require('../services/alertEvaluator');

// Obtener las 4 máquinas con su última lectura y estado actual
router.get('/', async (req, res) => {
  try {
    const machinesRes = await query('SELECT * FROM machines ORDER BY id ASC');
    const machines = machinesRes.rows || [];

    // Enriquecer cada máquina con su última lectura
    const enrichedMachines = await Promise.all(
      machines.map(async (m) => {
        const lastReadingRes = await query(
          'SELECT * FROM telemetry_readings WHERE machine_id = $1 ORDER BY timestamp DESC LIMIT 1',
          [m.id]
        );
        const lastReading = lastReadingRes.rows && lastReadingRes.rows.length > 0 ? lastReadingRes.rows[0] : null;
        const threshold = parseFloat(m.threshold_kw);

        let status = 'OFFLINE';
        let currentPower = 0;
        let loadPercentage = 0;

        if (lastReading) {
          currentPower = parseFloat(lastReading.power_kw);
          loadPercentage = Math.round((currentPower / threshold) * 100);

          if (currentPower > threshold) {
            status = 'CRITICAL';
          } else if (currentPower > threshold * 0.85) {
            status = 'WARNING';
          } else {
            status = 'NORMAL';
          }
        }

        return {
          id: m.id,
          name: m.name,
          location: m.location,
          thresholdKw: threshold,
          currentPowerKw: currentPower,
          loadPercentage,
          status,
          cooldown: getCooldownStatus(m.id),
          lastReading: lastReading
            ? {
                powerKw: parseFloat(lastReading.power_kw),
                voltageV: parseFloat(lastReading.voltage_v),
                currentA: parseFloat(lastReading.current_a),
                timestamp: lastReading.timestamp
              }
            : null
        };
      })
    );

    return res.json({
      count: enrichedMachines.length,
      machines: enrichedMachines
    });
  } catch (err) {
    console.error('Error en GET /api/machines:', err);
    return res.status(500).json({ error: 'Error al obtener máquinas', details: err.message });
  }
});

// Actualizar umbral de potencia de una máquina
router.put('/:id/threshold', async (req, res) => {
  try {
    const { id } = req.params;
    const { thresholdKw } = req.body;

    const val = parseFloat(thresholdKw);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({ error: 'El umbral debe ser un número positivo' });
    }

    await query('UPDATE machines SET threshold_kw = $1 WHERE id = $2', [val, id]);

    return res.json({
      message: `Umbral de ${id} actualizado a ${val} kW`,
      machineId: id,
      newThresholdKw: val
    });
  } catch (err) {
    console.error('Error en PUT /api/machines/:id/threshold:', err);
    return res.status(500).json({ error: 'Error al actualizar umbral', details: err.message });
  }
});

module.exports = router;
