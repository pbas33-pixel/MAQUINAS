const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { query } = require('../db');
const { evaluateReading } = require('./alertEvaluator');

const DEFAULT_EXCEL_PATH = path.join(__dirname, '..', '..', '..', 'data', 'consumo.xlsx');

/**
 * Normaliza las cabeceras de columnas para aceptar tanto español como inglés
 */
function normalizeRow(raw) {
  const row = {};
  const keys = Object.keys(raw);

  for (const k of keys) {
    const cleanKey = k.trim().toLowerCase().replace(/[\s_\-]+/g, '');

    // Identificador de máquina
    if (['machineid', 'machine', 'maquina', 'idmaquina', 'id'].includes(cleanKey)) {
      row.machineId = String(raw[k]).trim().toUpperCase();
    }
    // Potencia en kW
    else if (['powerkw', 'power', 'potencia', 'potenciakw', 'kw'].includes(cleanKey)) {
      row.powerKw = parseFloat(raw[k]);
    }
    // Voltaje en V
    else if (['voltagev', 'voltage', 'voltaje', 'tension', 'v'].includes(cleanKey)) {
      row.voltageV = parseFloat(raw[k]);
    }
    // Corriente en A
    else if (['currenta', 'current', 'corriente', 'intensidad', 'a'].includes(cleanKey)) {
      row.currentA = parseFloat(raw[k]);
    }
    // Fecha y hora
    else if (['timestamp', 'fecha', 'hora', 'fechahora', 'date', 'datetime'].includes(cleanKey)) {
      row.timestamp = raw[k];
    }
  }

  return row;
}

/**
 * Parsea el archivo Excel especificado o por defecto y lo procesa contra Neon PostgreSQL
 */
async function importExcelData(customPath = null) {
  const filePath = customPath || DEFAULT_EXCEL_PATH;

  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo Excel no existe en la ruta: ${filePath}. Coloca el archivo 'consumo.xlsx' en la carpeta 'data/'.`);
  }

  // Leer libro Excel
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas de cálculo.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  if (rawRows.length === 0) {
    throw new Error('La hoja de cálculo está vacía.');
  }

  // Obtener máquinas registradas de la base de datos
  const machinesRes = await query('SELECT * FROM machines');
  const machinesMap = new Map();
  (machinesRes.rows || []).forEach(m => machinesMap.set(m.id, m));

  let rowsImported = 0;
  let alertsTriggeredCount = 0;
  const criticalMachines = new Set();
  const importSummary = [];

  for (const raw of rawRows) {
    const row = normalizeRow(raw);

    if (!row.machineId || isNaN(row.powerKw)) {
      continue; // Fila incompleta o de encabezado auxiliar
    }

    const machine = machinesMap.get(row.machineId);
    if (!machine) {
      console.warn(`[Excel Import] Máquina desconocida '${row.machineId}', saltando fila.`);
      continue;
    }

    const voltage = !isNaN(row.voltageV) ? row.voltageV : 400.0;
    const current = !isNaN(row.currentA) ? row.currentA : parseFloat((row.powerKw * 1.5).toFixed(2));
    const timestamp = row.timestamp ? new Date(row.timestamp) : new Date();

    // Insertar en Neon PostgreSQL
    const insertRes = await query(
      `INSERT INTO telemetry_readings (machine_id, power_kw, voltage_v, current_a, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [machine.id, row.powerKw, voltage, current, timestamp.toISOString()]
    );

    const savedReading = insertRes.rows && insertRes.rows.length > 0 
      ? insertRes.rows[0]
      : { machine_id: machine.id, power_kw: row.powerKw, voltage_v: voltage, current_a: current, timestamp: timestamp.toISOString() };

    // Evaluar sobreconsumo y alertas
    const evalResult = await evaluateReading(machine, savedReading);

    if (evalResult.alertTriggered) {
      alertsTriggeredCount++;
      criticalMachines.add(machine.id);
    }

    rowsImported++;
    importSummary.push({
      machineId: machine.id,
      powerKw: row.powerKw,
      status: evalResult.status,
      alert: evalResult.alertTriggered
    });
  }

  return {
    success: true,
    filePath,
    totalRowsRead: rawRows.length,
    rowsImported,
    alertsTriggeredCount,
    criticalMachines: Array.from(criticalMachines),
    message: `Se importaron ${rowsImported} lecturas con éxito desde Excel. Alertas detectadas: ${alertsTriggeredCount}.`
  };
}

module.exports = {
  importExcelData,
  normalizeRow
};
