# Tasks

## 1. Dependencias y Carpeta de Datos (Estimación: ~20 min, máx. 4h)

- [x] 1.1 Instalar la librería `xlsx` en `backend/package.json` y verificar su correcta instalación mediante `npm list xlsx`
- [x] 1.2 Crear el directorio `data/` y generar los archivos `data/consumo.xlsx` y `data/plantilla_consumo.xlsx` con datos de ejemplo estructurados para las 4 máquinas, y verificar su existencia física

## 2. Servicio de Parseo y Procesamiento de Excel (Estimación: ~40 min, máx. 4h)

- [x] 2.1 Desarrollar el módulo `backend/src/services/excelImporter.js` con normalización flexible de cabeceras en español/inglés y conversión de fechas de Excel, y verificar su capacidad de parseo
- [x] 2.2 Conectar el importador a la base de datos Neon PostgreSQL y al evaluador de alertas por sobreconsumo, y verificar la persistencia y detección de anomalías

## 3. Endpoints y Comandos de Ejecución (Estimación: ~30 min, máx. 4h)

- [x] 3.1 Implementar el endpoint `POST /api/telemetry/import-excel` en `backend/src/routes/telemetry.js`, y verificar su respuesta HTTP 200 con el conteo de filas importadas
- [x] 3.2 Crear el script ejecutable `backend/scripts/importExcel.js` y añadir el script `npm run import:excel` en los `package.json`, y verificar su ejecución desde la línea de comandos

## 4. Integración en el Dashboard Frontend y Verificación (Estimación: ~30 min, máx. 4h)

- [x] 4.1 Integrar el botón de acción "Cargar Archivo Excel" en el Dashboard (`frontend/src/App.jsx` y `SimulatorControls.jsx`), y verificar la recarga inmediata de métricas tras la importación
- [x] 4.2 Ejecutar la importación de un archivo Excel con sobreconsumo simulado y verificar la transición visual del Dashboard y el despacho de alerta por Gmail
