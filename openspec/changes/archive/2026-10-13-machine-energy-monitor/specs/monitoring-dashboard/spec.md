# Spec Delta

## Purpose

Proporciona un panel de control interactivo para monitorizar en tiempo real el consumo de las 4 máquinas, analizar tendencias históricas y ajustar umbrales de alerta.

## ADDED Requirements

### Requirement: Panel visual de estado de las 4 máquinas
La interfaz web SHALL presentar tarjetas individuales para cada una de las 4 máquinas (ejemplo: Torno CNC, Fresadora, Compresor y Horno) mostrando su potencia actual en kW, tensión, corriente, barra de porcentaje de carga y badge de estado (Normal, Alerta, Crítico).

#### Scenario: Actualización de estado en tiempo real
- **WHEN** el usuario visualiza el dashboard
- **THEN** los indicadores y métricas de cada máquina se actualizan periódicamente reflejando las lecturas más recientes

### Requirement: Gráficos de consumo energético y tendencias
La aplicación web SHALL renderizar gráficos interactivos que comparen el consumo en kW en el tiempo de las 4 máquinas simultáneamente frente a sus líneas de umbral crítico.

#### Scenario: Visualización de picos de consumo
- **WHEN** una máquina presenta variaciones de consumo
- **THEN** la curva temporal resalta los puntos que superan el umbral con código de color de advertencia

### Requirement: Registro visual de alertas e incidentes
La aplicación SHALL incluir una vista o panel de alertas recientes donde se muestren los incidentes de consumo excesivo, hora del suceso, máquina afectada y estado de la notificación por Gmail.

#### Scenario: Notificación visual en pantalla
- **WHEN** el backend registra una alerta crítica
- **THEN** el dashboard muestra una notificación visual inmediata en pantalla además de añadir el registro a la lista de incidencias

### Requirement: Controles del simulador de telemetría
El frontend SHALL proporcionar un panel de control del simulador para activar el envío automático de telemetría periódica o forzar manualmente un pico de sobreconsumo en cualquiera de las máquinas para pruebas.

#### Scenario: Disparo manual de prueba de sobreconsumo
- **WHEN** el operador pulsa el botón de simulación de sobreconsumo para una máquina específica
- **THEN** el simulador envía una lectura superior al umbral al backend y el dashboard refleja el cambio de estado y la generación de la alerta
