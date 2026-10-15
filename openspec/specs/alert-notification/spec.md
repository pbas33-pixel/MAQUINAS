# alert-notification Specification

## Purpose
Supervisa de forma continua las mediciones energéticas frente a límites de tolerancia y notifica de inmediato al responsable técnico mediante correo Gmail ante anomalías de sobreconsumo.

## Requirements

### Requirement: Detección y evaluación de consumo elevado
El sistema SHALL comparar cada lectura de potencia entrante (`powerKw`) contra el umbral máximo fijado para la máquina correspondiente para determinar si existe una condición de consumo elevado.

#### Scenario: Detección de lectura sobre el umbral
- **WHEN** la potencia registrada supera el umbral configurado (ejemplo: 45.0 kW en un umbral de 40.0 kW)
- **THEN** el sistema califica el estado de la máquina como CRITICAL y dispara el flujo de notificación de alerta

#### Scenario: Lectura dentro de los límites normales
- **WHEN** la potencia registrada es menor o igual al umbral configurado
- **THEN** el sistema mantiene el estado NORMAL y no emite alertas

### Requirement: Notificación por correo electrónico vía Gmail
El sistema SHALL enviar un correo electrónico formateado a través de Gmail SMTP cuando se verifique una incidencia de sobreconsumo en cualquiera de las máquinas.

#### Scenario: Envío de alerta con detalles técnicos
- **WHEN** se genera una alerta por potencia excesiva en la máquina
- **THEN** el sistema envía un correo a la dirección configurada conteniendo nombre de máquina, potencia registrada, umbral superado, porcentaje de exceso y marca temporal del evento

### Requirement: Cooldown para control de saturación de correos
El sistema SHALL aplicar un período de enfriamiento (cooldown, por defecto 5 minutos) por máquina entre alertas sucesivas para evitar inundación de correos en la bandeja de entrada.

#### Scenario: Supresión de envíos durante período de cooldown
- **WHEN** se produce una nueva lectura con sobreconsumo pero la última alerta de esa máquina ocurrió dentro de la ventana de cooldown
- **THEN** el sistema registra la anomalía en la base de datos pero omite el envío del correo electrónico repetido

### Requirement: Registro de auditoría de alertas
El sistema SHALL persistir cada evento de alerta generado en la tabla `alert_logs` de Neon PostgreSQL con información de la máquina, potencia registrada y estado de entrega del correo.

#### Scenario: Consulta de bitácora de alertas
- **WHEN** un cliente consulta el endpoint GET `/api/alerts`
- **THEN** el sistema retorna las alertas recientes ordenadas de más reciente a más antigua indicando si el correo fue despachado exitosamente
