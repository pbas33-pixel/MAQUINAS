# Spec Delta

## ADDED Requirements

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
