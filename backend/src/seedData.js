/**
 * Generador de datos iniciales realistas para las 4 máquinas industriales
 */

function generateInitialTelemetry() {
  const readings = [];
  const now = Date.now();
  const stepMs = 5 * 60 * 1000; // cada 5 minutos

  const machineConfigs = [
    { id: 'M1', base: 26.0, variance: 5.0, threshold: 35.0 }, // Torno
    { id: 'M2', base: 34.0, variance: 6.0, threshold: 42.0 }, // Fresadora
    { id: 'M3', base: 20.0, variance: 4.0, threshold: 28.0 }, // Compresor
    { id: 'M4', base: 46.0, variance: 7.0, threshold: 55.0 }  // Horno
  ];

  // 15 lecturas por cada una de las 4 máquinas (últimos 75 minutos)
  for (let i = 14; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs).toISOString();

    for (const m of machineConfigs) {
      let power = parseFloat((m.base + (Math.sin(i * 0.8) * m.variance) + (Math.random() * 2 - 1)).toFixed(1));

      // Introducir un pico de sobreconsumo histórico en M1 en el punto i = 3
      if (m.id === 'M1' && i === 3) {
        power = 46.5;
      }
      // Introducir un pico de sobreconsumo histórico en M4 en el punto i = 7
      if (m.id === 'M4' && i === 7) {
        power = 66.8;
      }

      const voltage = parseFloat((400 + (Math.random() * 4 - 2)).toFixed(1));
      const current = parseFloat((power * 1.52).toFixed(1));

      readings.push({
        id: readings.length + 1,
        machine_id: m.id,
        power_kw: power,
        voltage_v: voltage,
        current_a: current,
        timestamp
      });
    }
  }

  return readings;
}

function generateInitialAlerts() {
  const now = Date.now();
  return [
    {
      id: 1,
      machine_id: 'M1',
      power_kw: 46.5,
      threshold_kw: 35.0,
      email_sent: true,
      recipient_email: 'responsable_mantenimiento@gmail.com',
      details: 'Alerta emitida: Exceso de +11.50 kW (+32.9% sobre umbral de 35 kW).',
      created_at: new Date(now - 15 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      machine_id: 'M4',
      power_kw: 66.8,
      threshold_kw: 55.0,
      email_sent: true,
      recipient_email: 'responsable_mantenimiento@gmail.com',
      details: 'Alerta emitida: Exceso de +11.80 kW (+21.5% sobre umbral de 55 kW).',
      created_at: new Date(now - 35 * 60 * 1000).toISOString()
    }
  ];
}

module.exports = {
  generateInitialTelemetry,
  generateInitialAlerts
};
