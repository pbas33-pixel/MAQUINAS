# Tasks

## 1. Configuración del Proyecto y Estructura Base (Estimación: ~45 min, máx. 4h)

- [x] 1.1 Crear la estructura de carpetas raíz para `backend/` y `frontend/` junto con archivos `.gitignore`, `.env.example` y scripts de conveniencia, y verificar que las rutas queden accesibles
- [x] 1.2 Inicializar el `package.json` de `backend/` e instalar dependencias (`express`, `cors`, `dotenv`, `pg`, `@neondatabase/serverless`, `nodemailer`), y verificar la instalación mediante `npm list`
- [x] 1.3 Inicializar el proyecto `frontend/` con Vite + React e instalar dependencias de interfaz, y verificar que `npm run build` o compilación inicial finalice con código de salida 0

## 2. Base de Datos Neon y Modelado de Datos (Estimación: ~45 min, máx. 4h)

- [x] 2.1 Desarrollar el conector a Neon PostgreSQL en `backend/src/db.js` con soporte para conexión pooled y fallback seguro, y verificar la instanciación del cliente de base de datos
- [x] 2.2 Diseñar el esquema SQL e inicializador automático en `backend/src/initDb.js` para crear tablas `machines`, `telemetry_readings` y `alert_logs` e insertar las 4 máquinas base (Torno CNC, Fresadora, Compresor, Horno), y verificar su ejecución idempotente

## 3. Servicio de Alertas y Notificación con Gmail (Estimación: ~45 min, máx. 4h)

- [x] 3.1 Crear el módulo de correo electrónico en `backend/src/services/emailService.js` utilizando Nodemailer configurado para Gmail SMTP (App Password) con plantilla HTML de alerta industrial, y verificar la generación del contenido del correo
- [x] 3.2 Implementar el evaluador de sobreconsumo con ventana de cooldown (5 minutos) por máquina en `backend/src/services/alertEvaluator.js`, y verificar que registre incidencias en `alert_logs` suprimiendo envíos redundantes en ráfaga
- [x] 3.3 Crear endpoint de prueba `POST /api/alerts/test` para comprobar la conectividad del servicio de correo bajo demanda y verificar su respuesta HTTP

## 4. Endpoints de la API Backend (Estimación: ~45 min, máx. 4h)

- [x] 4.1 Desarrollar el endpoint `POST /api/telemetry` para ingestión de telemetría (validación de máquina, potencia en kW, tensión, corriente), persistencia en Neon y disparo de evaluación de alerta, y verificar respuestas HTTP 201 y 400
- [x] 4.2 Desarrollar los endpoints `GET /api/machines`, `GET /api/telemetry/history` y `GET /api/alerts` para servir datos al dashboard, y verificar que devuelvan respuestas JSON estructuradas
- [x] 4.3 Integrar el servidor Express en `backend/src/server.js` conectando middleware CORS, JSON parser y rutas, y verificar que el servidor inicie en el puerto configurado

## 5. Frontend Dashboard (Vite + React) (Estimación: ~1h 15 min, máx. 4h)

- [x] 5.1 Implementar el sistema de diseño visual en Vanilla CSS (`frontend/src/index.css`) con tema oscuro industrial, tokens de diseño, efectos de glassmorphism y microanimaciones de estado
- [x] 5.2 Construir los componentes de tarjeta para las 4 máquinas (`MachineCard.jsx`) con visualización de potencia actual en kW, indicador de porcentaje del umbral y badge de estado reactivo
- [x] 5.3 Desarrollar el componente de gráficos de telemetría (`TelemetryChart.jsx`) con curvas de consumo temporal y líneas de umbral crítico
- [x] 5.4 Construir el panel de auditoría de alertas (`AlertsPanel.jsx`) con listado de incidencias y estado de la entrega por Gmail
- [x] 5.5 Implementar el simulador de telemetría interactivo (`SimulatorControls.jsx`) para enviar lecturas automáticas o forzar manualmente sobreconsumos de prueba en cualquiera de las 4 máquinas

## 6. Verificación Integral y Pruebas End-to-End (Estimación: ~30 min, máx. 4h)

- [x] 6.1 Ejecutar prueba de ingestión continua desde el simulador y verificar que el dashboard refleje en tiempo real las métricas de las 4 máquinas
- [x] 6.2 Provocar un pico de sobreconsumo en una máquina y verificar la transición a estado crítico en el dashboard, la persistencia en `alert_logs` y la activación del envío de correo por Gmail
