# Design

## Context

El sistema se implementa siguiendo una arquitectura desacoplada elegida por el usuario: un backend independiente en Node.js/Express para la lógica de ingestión, persistencia y alertas, y un frontend SPA en Vite + React para la visualización en tiempo real. La persistencia se gestiona en Neon PostgreSQL (Lakebase Postgres) y las alertas se despachan mediante Gmail SMTP (Nodemailer).

## Goals / Non-Goals

**Goals:**
- Estructurar el repositorio en dos directorios independientes: `backend/` y `frontend/`.
- Proveer esquema de base de datos relacional para 4 máquinas industriales (`M1: Torno CNC`, `M2: Fresadora Industrial`, `M3: Compresor de Aire`, `M4: Horno de Tratamiento Térmico`) con inicialización automática de tablas en Neon.
- Integrar `@neondatabase/serverless` / `pg` con soporte para pooling y reconexión robusta.
- Implementar el despachador de correo Gmail con Nodemailer, soporte para Contraseña de Aplicación (Google App Password), plantillas HTML atractivas de alerta y control de cooldown (5 minutos) para evitar saturación de la bandeja.
- Desarrollar un dashboard frontend premium con tema oscuro industrial, indicadores de estado por máquina, gráficos de consumo y simulador de telemetría interactivo para pruebas inmediatas.

**Non-Goals:**
- Control remoto físico o parada de emergencia de máquinas (control de potencia bidireccional SCADA).
- Gestión multi-inquilino o autenticación de usuarios compleja en esta primera versión.

## Decisions

### Decisión 1: Estructura desacoplada `backend/` y `frontend/`
- **Elección**: Separación clara de repositorios en el mismo workspace con scripts independientes en `package.json`.
- **Razón**: Permite arrancar y desplegar el servicio de telemetría de forma autónoma a la interfaz de usuario, manteniendo alta cohesión y bajo acoplamiento.
- **Alternativas consideradas**: Monolito con renderizado en servidor (Next.js), descartado a favor de la preferencia explícita del usuario por arquitectura desacoplada.

### Decisión 2: Conexión a Neon PostgreSQL mediante `@neondatabase/serverless` / `pg`
- **Elección**: Conexión estándar mediante `DATABASE_URL` compatible tanto con entornos locales como serverless.
- **Razón**: Permite ejecutar consultas SQL parametrizadas limpias, manejar migraciones iniciales de forma idempotente (`CREATE TABLE IF NOT EXISTS`) y sembrar las 4 máquinas base si no existen.
- **Alternativas consideradas**: ORMs pesados (Prisma / TypeORM), descartados para mantener el backend ligero, rápido y sin capas adicionales de compilación.

### Decisión 3: Servicio de Alertas con Nodemailer y Cooldown en Memoria/DB
- **Elección**: Servicio dedicado `emailService.js` que verifica el umbral de potencia (`powerKw > thresholdKw`) y el tiempo transcurrido desde la última alerta de esa máquina (`lastAlertTime`).
- **Razón**: Evita el envío masivo de cientos de correos si una máquina permanece en sobreconsumo durante varios minutos consecutivos.
- **Modo seguro**: Si las credenciales de Gmail no están configuradas aún o fallan, el sistema registra la alerta en la base de datos y consola con aviso detallado sin interrumpir la ingestión de telemetría.

### Decisión 4: Frontend con Vite + React y Vanilla CSS con estética industrial premium
- **Elección**: Interfaz diseñada con CSS personalizado (variables de diseño, glassmorphism, paleta oscura industrial con acentos cian, ámbar y carmesí de alerta).
- **Razón**: Cumple estrictamente con las directrices de diseño sin dependencias innecesarias de Tailwind, ofreciendo animaciones fluidas, métricas visuales y visualización gráfica interactiva (Canvas/SVG).

## Risks / Trade-offs

- **[Riesgo] Configuración de autenticación de Gmail**: Google requiere una "Contraseña de Aplicación" (App Password) de 16 caracteres y no permite la contraseña regular de la cuenta.
  → **Mitigación**: Documentar claramente la generación del App Password en el archivo `.env.example` y README, e incluir un endpoint `/api/alerts/test` para verificar el envío de correo de prueba en cualquier momento.
- **[Riesgo] Ausencia temporal de conectividad a Neon**: Si la URL de conexión de Neon no está configurada inicialmente.
  → **Mitigación**: El backend comprueba la presencia de `DATABASE_URL`; si no está definida o falla la conexión, provee logs explicativos y modo de almacenamiento seguro en memoria para pruebas locales inmediatas.
- **[Riesgo] Frecuencia de envío de telemetría**: Múltiples lecturas por segundo podrían saturar la base de datos si no se indexan.
  → **Mitigación**: Creación de índices en `machine_id` y `timestamp` en la tabla de lecturas.
