const { query } = require('../db');
const { sendAlertEmail } = require('./emailService');
require('dotenv').config();

// Registro en memoria de la última alerta emitida por máquina para aplicar Cooldown
const lastAlertTimestampByMachine = new Map();

const DEFAULT_COOLDOWN_MS = (parseInt(process.env.ALERT_COOLDOWN_MINUTES, 10) || 5) * 60 * 1000;

/**
 * Evalúa si una lectura supera el umbral y gestiona el flujo de notificación y cooldown
 */
async function evaluateReading(machine, reading) {
  const power = parseFloat(reading.power_kw);
  const threshold = parseFloat(machine.threshold_kw);

  if (power <= threshold) {
    return {
      status: 'NORMAL',
      alertTriggered: false
    };
  }

  // Hay sobreconsumo
  const now = Date.now();
  const lastAlertTime = lastAlertTimestampByMachine.get(machine.id) || 0;
  const timeSinceLastAlert = now - lastAlertTime;
  const cooldownActive = timeSinceLastAlert < DEFAULT_COOLDOWN_MS;

  const excessKw = (power - threshold).toFixed(2);
  const excessPct = (((power - threshold) / threshold) * 100).toFixed(1);

  let emailResult = { success: false, message: 'Alerta suprimida por ventana de cooldown' };

  if (!cooldownActive) {
    // Despachar correo de alerta
    emailResult = await sendAlertEmail({ machine, reading });
    lastAlertTimestampByMachine.set(machine.id, now);
  } else {
    const remainingSeconds = Math.ceil((DEFAULT_COOLDOWN_MS - timeSinceLastAlert) / 1000);
    console.log(`⏱️  [Cooldown Activo] ${machine.id}: Sobreconsumo continuo detectado (+${excessKw} kW). Email suprimido por ${remainingSeconds}s.`);
  }

  // Persistir en tabla alert_logs
  try {
    const details = cooldownActive 
      ? `Sobreconsumo continuo (+${excessPct}%). Envío suprimido por cooldown.`
      : `Alerta emitida: Exceso de +${excessKw} kW (+${excessPct}% sobre umbral de ${threshold} kW).`;

    await query(
      `INSERT INTO alert_logs (machine_id, power_kw, threshold_kw, email_sent, recipient_email, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        machine.id,
        power,
        threshold,
        !cooldownActive && emailResult.success,
        emailResult.recipient || process.env.ALERT_RECIPIENT_EMAIL || 'N/A',
        details
      ]
    );
  } catch (err) {
    console.error('❌ Error al registrar log de alerta:', err.message);
  }

  return {
    status: 'CRITICAL',
    alertTriggered: true,
    cooldownActive,
    emailSent: !cooldownActive && emailResult.success,
    excessKw,
    excessPct
  };
}

function getCooldownStatus(machineId) {
  const lastAlertTime = lastAlertTimestampByMachine.get(machineId) || 0;
  const elapsed = Date.now() - lastAlertTime;
  const remaining = Math.max(0, DEFAULT_COOLDOWN_MS - elapsed);
  return {
    inCooldown: remaining > 0,
    remainingMs: remaining,
    remainingSeconds: Math.ceil(remaining / 1000)
  };
}

module.exports = {
  evaluateReading,
  getCooldownStatus,
  lastAlertTimestampByMachine
};
