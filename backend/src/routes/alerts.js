const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { sendAlertEmail, verifyEmailConfig } = require('../services/emailService');

// Obtener registro histórico de alertas
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const result = await query(
      `SELECT a.*, m.name as machine_name 
       FROM alert_logs a
       LEFT JOIN machines m ON a.machine_id = m.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.json({
      count: result.rows.length,
      alerts: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/alerts:', err);
    return res.status(500).json({ error: 'Error al consultar alertas', details: err.message });
  }
});

// Comprobar estado de configuración de Gmail
router.get('/status', async (req, res) => {
  try {
    const status = await verifyEmailConfig();
    return res.json({
      gmailUser: process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      recipient: process.env.ALERT_RECIPIENT_EMAIL || process.env.GMAIL_USER || null,
      configured: status.configured,
      message: status.message
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint de prueba para enviar correo bajo demanda (Task 3.3)
router.post('/test', async (req, res) => {
  try {
    const { machineId = 'M1', powerKw = 48.5 } = req.body;

    const machineRes = await query('SELECT * FROM machines WHERE id = $1', [machineId]);
    const machine = machineRes.rows && machineRes.rows.length > 0
      ? machineRes.rows[0]
      : { id: 'M1', name: 'Torno CNC Mazak QTN-200', location: 'Taller Mecanizado', threshold_kw: 35.0 };

    const fakeReading = {
      machine_id: machine.id,
      power_kw: parseFloat(powerKw),
      voltage_v: 400.0,
      current_a: (parseFloat(powerKw) * 1.5).toFixed(1),
      timestamp: new Date().toISOString()
    };

    const emailResult = await sendAlertEmail({
      machine,
      reading: fakeReading
    });

    return res.json({
      message: 'Prueba de envío de alerta ejecutada',
      machine,
      reading: fakeReading,
      result: emailResult
    });
  } catch (err) {
    console.error('Error en POST /api/alerts/test:', err);
    return res.status(500).json({ error: 'Error al enviar prueba de alerta', details: err.message });
  }
});

module.exports = router;
