const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') : null;

  if (!user || !pass || pass.includes('xxxx')) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user,
        pass
      }
    });
  }

  return transporter;
}

function generateAlertHtml({ machine, reading, excessPercentage }) {
  const now = new Date(reading.timestamp || Date.now()).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  const excessKw = (reading.power_kw - machine.threshold_kw).toFixed(2);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; margin: 0; }
      .container { max-width: 600px; margin: 0 auto; background: #131b2e; border: 1px solid #ef4444; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.2); }
      .header { background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px; }
      .header p { margin: 6px 0 0; color: #fee2e2; font-size: 14px; }
      .content { padding: 28px; }
      .metric-badge { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; }
      .metric-badge .value { font-size: 36px; font-weight: bold; color: #ef4444; }
      .metric-badge .label { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
      .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      .details-table td { padding: 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
      .details-table td.label { color: #94a3b8; width: 40%; font-weight: 500; }
      .details-table td.value { color: #f8fafc; font-weight: 600; }
      .actions { background: #1e293b; border-radius: 8px; padding: 16px; font-size: 13px; color: #cbd5e1; }
      .actions ul { margin: 8px 0 0 20px; padding: 0; }
      .footer { padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #0f172a; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚠️ ALERTA DE SOBRECONSUMO CRÍTICO</h1>
        <p>Industrial PowerPulse • Monitorización en Tiempo Real</p>
      </div>
      <div class="content">
        <div class="metric-badge">
          <div class="value">${reading.power_kw} kW</div>
          <div class="label">Potencia Registrada (${excessPercentage > 0 ? '+' + excessPercentage + '%' : ''} sobre el umbral)</div>
        </div>

        <table class="details-table">
          <tr>
            <td class="label">Máquina Afectada:</td>
            <td class="value">${machine.name} (${machine.id})</td>
          </tr>
          <tr>
            <td class="label">Ubicación de Planta:</td>
            <td class="value">${machine.location || 'Planta Principal'}</td>
          </tr>
          <tr>
            <td class="label">Umbral Permitido:</td>
            <td class="value" style="color: #38bdf8;">${machine.threshold_kw} kW</td>
          </tr>
          <tr>
            <td class="label">Exceso Energético:</td>
            <td class="value" style="color: #ef4444;">+${excessKw} kW</td>
          </tr>
          <tr>
            <td class="label">Tensión / Corriente:</td>
            <td class="value">${reading.voltage_v || 400} V / ${reading.current_a || (reading.power_kw * 1.5).toFixed(1)} A</td>
          </tr>
          <tr>
            <td class="label">Fecha y Hora:</td>
            <td class="value">${now}</td>
          </tr>
        </table>

        <div class="actions">
          <strong>Protocolo sugerido de respuesta:</strong>
          <ul>
            <li>Inspeccionar la máquina visualmente en planta inmediatamente.</li>
            <li>Verificar posible sobrecarga mecánica, bloqueo de husillo o recalentamiento.</li>
            <li>Consultar el historial de telemetría en el Dashboard industrial.</li>
          </ul>
        </div>
      </div>
      <div class="footer">
        Este mensaje ha sido emitido automáticamente por el sistema de monitorización Industrial PowerPulse.
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendAlertEmail({ machine, reading }) {
  const recipient = process.env.ALERT_RECIPIENT_EMAIL || process.env.GMAIL_USER;
  const excess = (reading.power_kw - machine.threshold_kw);
  const excessPercentage = ((excess / machine.threshold_kw) * 100).toFixed(1);

  const mailOptions = {
    from: `"PowerPulse Industrial" <${process.env.GMAIL_USER || 'alerts@powerpulse.io'}>`,
    to: recipient,
    subject: `🚨 ALERTA CRÍTICA: Sobreconsumo en ${machine.name} (${reading.power_kw} kW)`,
    text: `ALERTA DE SOBRECONSUMO: La máquina ${machine.name} (${machine.id}) ha alcanzado ${reading.power_kw} kW (umbral: ${machine.threshold_kw} kW, exceso: +${excessPercentage}%). Fecha: ${new Date().toISOString()}`,
    html: generateAlertHtml({ machine, reading, excessPercentage })
  };

  const transport = getTransporter();

  if (!transport) {
    console.log('\x1b[33m%s\x1b[0m', `📧 [Alerta Gmail Simulada] Destinatario: ${recipient} | Máquina: ${machine.name} | Potencia: ${reading.power_kw} kW (Configura GMAIL_USER y GMAIL_APP_PASSWORD en .env para envíos reales)`);
    return {
      success: true,
      simulated: true,
      recipient,
      message: 'Correo simulado correctamente (credenciales de Gmail no configuradas en .env)'
    };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('\x1b[32m%s\x1b[0m', `✅ [Gmail Alerta Enviada] ID: ${info.messageId} a ${recipient}`);
    return {
      success: true,
      simulated: false,
      recipient,
      messageId: info.messageId
    };
  } catch (err) {
    console.error('❌ [Error al enviar correo por Gmail]:', err.message);
    return {
      success: false,
      simulated: false,
      error: err.message
    };
  }
}

async function verifyEmailConfig() {
  const transport = getTransporter();
  if (!transport) {
    return { configured: false, message: 'GMAIL_USER o GMAIL_APP_PASSWORD ausentes en .env' };
  }
  try {
    await transport.verify();
    return { configured: true, message: 'Conexión SMTP con Gmail verificada exitosamente' };
  } catch (err) {
    return { configured: false, message: `Fallo de autenticación con Gmail: ${err.message}` };
  }
}

module.exports = {
  sendAlertEmail,
  verifyEmailConfig,
  generateAlertHtml
};
