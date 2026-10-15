# telemetry-ingestion Specification

## Purpose
Permite capturar, validar y registrar en Neon PostgreSQL el consumo eléctrico y variables operativas de 4 máquinas industriales en tiempo real.

## Requirements

### Requirement: Registro de telemetría de máquinas
El sistema SHALL proveer un endpoint HTTP POST en `/api/telemetry` para recibir lecturas de potencia (kW), voltaje (V), corriente (A) y factor de potencia de cualquiera de las 4 máquinas industriales registradas.

#### Scenario: Ingestión exitosa de lectura de máquina
- **WHEN** un cliente o sensor envía una carga JSON válida con `machineId`, `powerKw`, `voltageV` y `currentA`
- **THEN** el sistema valida los valores, persiste la lectura en Neon PostgreSQL con marca de tiempo actual y responde con código HTTP 201 y los datos guardados

#### Scenario: Rechazo de lectura con máquina inválida
- **WHEN** se envía una lectura con un identificador de máquina que no pertenece a las 4 máquinas registradas
- **THEN** el sistema rechaza la solicitud con código HTTP 400 y un mensaje de error descriptivo

### Requirement: Consulta de estado actual de las 4 máquinas
El sistema SHALL exponer un endpoint GET en `/api/machines` que devuelva el listado de las 4 máquinas con su última lectura registrada, estado operativo y potencia actual en kW.

#### Scenario: Obtención del estado consolidado
- **WHEN** el frontend solicita la lista de máquinas en `/api/machines`
- **THEN** el sistema devuelve un arreglo con las 4 máquinas, indicando nombre, identificador, última potencia registrada, estado (ONLINE/WARNING/CRITICAL) y timestamp de la última lectura

### Requirement: Historial cronológico de consumo
El sistema SHALL permitir la consulta de lecturas históricas mediante GET `/api/telemetry/history` filtrando por máquina o rango temporal reciente.

#### Scenario: Consulta de datos históricos para gráficos
- **WHEN** se solicita el historial con parámetro `machineId` opcional y límite de registros
- **THEN** el sistema devuelve las lecturas ordenadas cronológicamente para alimentar gráficos de tendencia temporal

### Requirement: Importación de telemetría desde archivo Excel local
El sistema SHALL proveer un servicio para leer e importar lotes de mediciones energéticas desde un archivo Excel (`.xlsx`) ubicado en la carpeta `data/` del proyecto, validando cada fila, almacenando las lecturas en Neon PostgreSQL y evaluando posibles sobreconsumos.

#### Scenario: Ingestión exitosa de lote desde archivo Excel
- **WHEN** se ejecuta la importación con un archivo Excel que contiene filas válidas (`machineId`, `powerKw`, `voltageV`, `currentA`, `timestamp`)
- **THEN** el sistema procesa e inserta cada lectura en Neon PostgreSQL y retorna el número total de registros importados

#### Scenario: Detección de sobreconsumo en datos importados
- **WHEN** una o varias filas del archivo Excel contienen valores de potencia que exceden el umbral configurado de la máquina
- **THEN** el sistema registra el estado crítico de la máquina y activa la evaluación de alertas para el envío de correo por Gmail

#### Scenario: Manejo de archivo ausente o cabeceras inválidas
- **WHEN** el archivo `data/consumo.xlsx` no existe o no contiene las columnas requeridas
- **THEN** el sistema devuelve un mensaje de error claro especificando las cabeceras requeridas sin realizar inserciones parciales erróneas
