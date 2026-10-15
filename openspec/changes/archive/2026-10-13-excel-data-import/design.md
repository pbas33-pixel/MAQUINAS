# Design

## Context

El usuario desea alimentar y registrar los datos de consumo de las 4 máquinas industriales utilizando un archivo Excel local. Se diseñará un módulo en el backend capaz de leer hojas de cálculo `.xlsx` desde `data/consumo.xlsx`, validar sus registros, persistirlos en Neon PostgreSQL y evaluar alertas.

## Goals / Non-Goals

**Goals:**
- Añadir la dependencia `xlsx` (SheetJS) al backend para lectura y parseo eficiente de hojas de cálculo.
- Crear el directorio `data/` en la raíz con una plantilla lista `data/plantilla_consumo.xlsx` y un archivo `data/consumo.xlsx` precargado con datos de ejemplo para las 4 máquinas.
- Desarrollar el servicio `excelImporter.js` con mapeo flexible de cabeceras (acepta tanto inglés como español: `machineId`/`maquina`, `powerKw`/`potencia`, `voltageV`/`voltaje`, `currentA`/`corriente`, `timestamp`/`fecha`).
- Implementar el endpoint `POST /api/telemetry/import-excel` y el comando de consola `npm run import:excel`.
- Conectar la funcionalidad al Dashboard con un botón visible para recargar/importar el archivo Excel en vivo.

**Non-Goals:**
- Modificación estructural de la base de datos (se reutilizan las tablas existentes `telemetry_readings` y `alert_logs`).
- Conversión a formatos propietarios externos más allá de `.xlsx` / `.xls` / `.csv`.

## Decisions

### Decisión 1: Biblioteca `xlsx` (SheetJS)
- **Elección**: Uso del paquete npm `xlsx`.
- **Razón**: Permite leer y parsear libros Excel de forma síncrona/asíncrona en Node.js puro sin dependencias de Python o binarios del sistema.

### Decisión 2: Normalización flexible de cabeceras
- **Elección**: Mapear automáticamente nombres de columnas comunes:
  - `machineId`, `machine`, `maquina`, `id_maquina` -> `machine_id`
  - `powerKw`, `power`, `potencia`, `potencia_kw`, `kw` -> `power_kw`
  - `voltageV`, `voltage`, `voltaje`, `tension`, `v` -> `voltage_v`
  - `currentA`, `current`, `corriente`, `intensidad`, `a` -> `current_a`
  - `timestamp`, `fecha`, `hora`, `date` -> `timestamp`
- **Razón**: Evita frustraciones al usuario si titula las columnas en español o con mayúsculas.

### Decisión 3: Interfaz dual (CLI + API + Dashboard)
- **Elección**: Permitir la importación tanto ejecutando un comando (`npm run import:excel`) como pulsando un botón en el Dashboard que invoque `POST /api/telemetry/import-excel`.
- **Razón**: Brinda máxima comodidad al usuario ya sea trabajando desde la terminal o desde el navegador.

## Risks / Trade-offs

- **[Riesgo] Formato de fecha de Excel**: Excel almacena fechas como números de serie flotantes (ej. 45213.6).
  → **Mitigación**: `excelImporter.js` convertirá automáticamente números de serie de fecha de Excel a objetos `Date` válidos en JavaScript o usará la fecha actual si la celda está vacía.
- **[Riesgo] Disparo de múltiples alertas consecutivas en importación masiva**: Si un Excel contiene 50 filas con sobreconsumo.
  → **Mitigación**: El evaluador de alertas existente con ventana de *cooldown* de 5 minutos suprime correos redundantes enviando solo una notificación por máquina.
