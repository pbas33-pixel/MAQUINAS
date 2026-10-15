const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Datos para plantilla_consumo.xlsx (Guía limpia)
const templateRows = [
  {
    machineId: 'M1',
    powerKw: 25.5,
    voltageV: 400.0,
    currentA: 38.2,
    timestamp: '2026-10-13 14:00:00'
  },
  {
    machineId: 'M2',
    powerKw: 32.0,
    voltageV: 401.5,
    currentA: 48.0,
    timestamp: '2026-10-13 14:00:00'
  },
  {
    machineId: 'M3',
    powerKw: 19.8,
    voltageV: 399.0,
    currentA: 29.5,
    timestamp: '2026-10-13 14:00:00'
  },
  {
    machineId: 'M4',
    powerKw: 44.2,
    voltageV: 402.0,
    currentA: 66.0,
    timestamp: '2026-10-13 14:00:00'
  }
];

const templateWs = XLSX.utils.json_to_sheet(templateRows);
const templateWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(templateWb, templateWs, 'PlantillaLecturas');
const templatePath = path.join(dataDir, 'plantilla_consumo.xlsx');
XLSX.writeFile(templateWb, templatePath);
console.log(`✅ Creado: ${templatePath}`);

// 2. Datos para consumo.xlsx (Lote con mediciones sucesivas y un sobreconsumo)
const consumoRows = [
  // Turno mañana
  { machineId: 'M1', powerKw: 24.0, voltageV: 400.0, currentA: 36.0, timestamp: '2026-10-13 08:00:00' },
  { machineId: 'M2', powerKw: 30.5, voltageV: 401.0, currentA: 45.8, timestamp: '2026-10-13 08:00:00' },
  { machineId: 'M3', powerKw: 18.2, voltageV: 399.5, currentA: 27.3, timestamp: '2026-10-13 08:00:00' },
  { machineId: 'M4', powerKw: 41.0, voltageV: 402.0, currentA: 61.5, timestamp: '2026-10-13 08:00:00' },
  
  // Turno mediodía
  { machineId: 'M1', powerKw: 28.5, voltageV: 399.0, currentA: 42.7, timestamp: '2026-10-13 12:00:00' },
  { machineId: 'M2', powerKw: 36.0, voltageV: 400.0, currentA: 54.0, timestamp: '2026-10-13 12:00:00' },
  { machineId: 'M3', powerKw: 22.0, voltageV: 398.5, currentA: 33.0, timestamp: '2026-10-13 12:00:00' },
  { machineId: 'M4', powerKw: 48.0, voltageV: 401.5, currentA: 72.0, timestamp: '2026-10-13 12:00:00' },

  // Turno tarde - Sobreconsumo en M1 (Torno CNC: umbral 35 kW -> 47.8 kW)
  { machineId: 'M1', powerKw: 47.8, voltageV: 404.0, currentA: 74.1, timestamp: '2026-10-13 15:30:00' },
  { machineId: 'M2', powerKw: 33.2, voltageV: 400.5, currentA: 49.8, timestamp: '2026-10-13 15:30:00' },
  { machineId: 'M3', powerKw: 20.5, voltageV: 399.0, currentA: 30.7, timestamp: '2026-10-13 15:30:00' },
  { machineId: 'M4', powerKw: 45.0, voltageV: 402.0, currentA: 67.5, timestamp: '2026-10-13 15:30:00' }
];

const consumoWs = XLSX.utils.json_to_sheet(consumoRows);
const consumoWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(consumoWb, consumoWs, 'RegistroConsumo');
const consumoPath = path.join(dataDir, 'consumo.xlsx');
XLSX.writeFile(consumoWb, consumoPath);
console.log(`✅ Creado: ${consumoPath}`);
