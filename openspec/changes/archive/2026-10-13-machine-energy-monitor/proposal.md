# Proposal

## Why

Las instalaciones industriales requieren supervisión continua del consumo energético de su maquinaria para optimizar costes, detectar anomalías de operación de forma temprana y prevenir sobrecargas. Este proyecto implementa una solución desacoplada (Backend API Node.js/Express + Base de Datos Neon PostgreSQL + Frontend Dashboard Vite/React) orientada a monitorizar en tiempo real 4 máquinas industriales, visualizarlas en un dashboard intuitivo y enviar alertas por Gmail cuando se detecten excesos de consumo.

## What Changes

- **Backend API (Node.js + Express)**: Creación de endpoints para ingestión de telemetría (`POST /api/telemetry`), consulta de estado actual de las 4 máquinas (`GET /api/machines`), historial de métricas (`GET /api/telemetry/history`) y gestión de alertas.
- **Persistencia en Neon PostgreSQL**: Esquema relacional optimizado con tablas para `machines`, `telemetry_readings` y `alert_logs`.
- **Módulo de Notificación por Gmail**: Evaluación automática de umbrales de potencia en kW en cada lectura y despacho de correos de alerta mediante Nodemailer (Gmail SMTP) con política de cooldown para prevenir spam de notificaciones.
- **Dashboard Web (Vite + React)**: Interfaz de usuario industrial moderna con visualización del consumo individual y agregado, indicadores de estado (Normal, Alerta, Crítico), gráficos históricos interactivos y panel de configuración de umbrales.
- **Simulador de Telemetría**: Generador de datos simulados configurable para probar el flujo de datos y provocar sobreconsumos de prueba directamente desde la interfaz o script.

## Capabilities

### New Capabilities
- `telemetry-ingestion`: Ingestión, validación y almacenamiento en Neon Postgres de lecturas de potencia (kW), tensión (V) y corriente (A) para las 4 máquinas.
- `alert-notification`: Monitorización en tiempo de ingestión frente a límites de potencia y emisión de alertas por correo electrónico vía Gmail SMTP con control de frecuencia.
- `monitoring-dashboard`: Interfaz web para consultar métricas en tiempo real, gráficos de tendencia, estado de salud de cada máquina y registro de incidentes.

### Modified Capabilities

## Impact

- **Arquitectura**: Separación limpia entre API backend (`backend/`) y cliente frontend (`frontend/`).
- **Dependencias Backend**: `express`, `cors`, `@neondatabase/serverless` (o `pg`), `nodemailer`, `dotenv`.
- **Dependencias Frontend**: `react`, `react-dom`, `lucide-react` (iconos), `chart.js` o SVG interactivo/Canvas para visualización gráfica.
- **Variables de Entorno**: `DATABASE_URL` (Neon), `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ALERT_RECIPIENT_EMAIL`, `PORT`.
