# Proposal

## Why

En plantas industriales, muchos registradores de energía y analizadores de redes exportan registros en hojas de cálculo (Excel / `.xlsx`). Los operadores requieren una forma directa de cargar datos históricos o lotes de mediciones depositando un archivo Excel en una carpeta designada (`data/consumo.xlsx`) para que el sistema procese e ingeste automáticamente las lecturas en la base de datos Neon, refleje las métricas en el dashboard y dispare alertas por Gmail si se detectan excesos de potencia.

## What Changes

- **Servicio de Importación de Excel**: Módulo en el backend para leer y parsear archivos Excel (`.xlsx`) desde la carpeta local `data/`.
- **Plantilla de Hoja de Cálculo**: Generación y suministro de una plantilla de ejemplo (`data/plantilla_consumo.xlsx` y `data/consumo.xlsx`) con las columnas requeridas: `machineId`, `powerKw`, `voltageV`, `currentA`, `timestamp`.
- **Endpoint y Comando de Procesamiento**: Endpoint `POST /api/telemetry/import-excel` y script CLI `npm run import:excel` para ejecutar la carga en cualquier momento o procesarla automáticamente.
- **Procesamiento de Alertas en Lote**: Integración con el evaluador de sobreconsumo para que cada fila del Excel que exceda el umbral de la máquina active las alertas por correo y su registro correspondiente.

## Capabilities

### New Capabilities

### Modified Capabilities
- `telemetry-ingestion`: Se incorpora el requerimiento de ingestión y procesamiento de mediciones a partir de archivos Excel locales.

## Impact

- **Backend**: Instalación de la librería `xlsx` (SheetJS) en `backend/package.json`.
- **Estructura**: Creación de la carpeta `data/` en la raíz con el archivo de datos y plantilla.
- **API**: Nuevo endpoint `POST /api/telemetry/import-excel`.
- **Base de Datos y Alertas**: Las lecturas del Excel se almacenan en Neon PostgreSQL y activan alertas si alguna fila excede los umbrales.
