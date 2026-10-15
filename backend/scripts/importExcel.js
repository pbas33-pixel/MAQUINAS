const path = require('path');
const { importExcelData } = require('../src/services/excelImporter');

async function main() {
  const customPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
  console.log('================================================================');
  console.log('📊 INDUSTRIAL POWERPULSE - IMPORTADOR DE ARCHIVO EXCEL');
  console.log('================================================================');

  try {
    const res = await importExcelData(customPath);
    console.log('✅ Importación procesada con éxito:');
    console.log(`   📁 Archivo: ${res.filePath}`);
    console.log(`   📄 Filas leídas en Excel: ${res.totalRowsRead}`);
    console.log(`   📥 Registros persistidos en BD: ${res.rowsImported}`);
    console.log(`   🚨 Alertas de sobreconsumo: ${res.alertsTriggeredCount}`);
    if (res.criticalMachines.length > 0) {
      console.log(`   ⚠️  Máquinas críticas: ${res.criticalMachines.join(', ')}`);
    }
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Error en importación:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
