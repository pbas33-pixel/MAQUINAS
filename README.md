# Industrial PowerPulse ⚡
### Sistema Desacoplado de Monitorización Energética de 4 Máquinas Industriales con Neon PostgreSQL, Dashboard y Alertas por Gmail

Este proyecto recoge en tiempo real los datos de consumo eléctrico (potencia en kW, tensión en V y corriente en A) de 4 máquinas industriales críticas, visualiza las métricas en un Dashboard reactivo y envía automáticamente correos electrónicos de alerta vía Gmail ante sobreconsumos.

---

## 🏗️ Arquitectura del Sistema

- **Backend API (`backend/`)**: Desarrollado en Node.js y Express. Provee endpoints REST para ingestión de telemetría (`POST /api/telemetry`), consulta del estado de las máquinas (`GET /api/machines`), historial de curvas de carga y auditoría de incidentes.
- **Base de Datos Neon (`backend/src/schema.sql`)**: PostgreSQL en la nube (Neon Lakebase Postgres) con soporte para conexiones agrupadas (*connection pooling*) y almacenamiento en memoria seguro para desarrollo previo al enlace.
- **Servicio de Alertas Gmail (`backend/src/services/emailService.js`)**: Integración con Google Gmail SMTP mediante Nodemailer con plantillas HTML industriales y **mecanismo de cooldown de 5 minutos** para evitar saturación de correo.
- **Frontend Dashboard (`frontend/`)**: Construido con Vite + React y Vanilla CSS con estética *Cyber-Industrial Dark Glassmorphism*, visualización gráfica en tiempo real y simulador de telemetría IoT integrado.

---

## ⚙️ Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz o en la carpeta `backend/` basándote en `.env.example`:

```env
# Puerto del servidor backend
PORT=5000

# 1. Base de Datos Neon (PostgreSQL)
# Obtén tu connection string en https://console.neon.tech
DATABASE_URL=postgresql://usuario:password@ep-ejemplo.aws.neon.tech/neondb?sslmode=require

# 2. Configuración de Alertas por Gmail
GMAIL_USER=tu_correo@gmail.com
# Contraseña de aplicación de 16 letras generada en Google (no tu contraseña normal)
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Destinatario que recibirá los correos de alerta
ALERT_RECIPIENT_EMAIL=responsable_mantenimiento@gmail.com

# Minutos de espera entre alertas repetidas de la misma máquina
ALERT_COOLDOWN_MINUTES=5
```

### 📌 ¿Cómo generar la contraseña de aplicación de Gmail?
1. Ve a tu cuenta de Google: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Activa la **Verificación en 2 pasos** (si aún no la tienes activa).
3. En el buscador de la cuenta escribe **Contraseñas de aplicaciones** (*App Passwords*).
4. Crea una contraseña con el nombre "IndustrialMonitor".
5. Copia el código de 16 caracteres y pégalo en `GMAIL_APP_PASSWORD`.

---

## 🚀 Cómo Iniciar el Proyecto

### 1. Iniciar el Backend (Terminal 1)
```powershell
npm run start:backend
# o para modo desarrollo con recarga automática:
npm run dev:backend
```
El servidor backend se iniciará en `http://localhost:5000`.

### 3. Cargar Datos desde Archivo Excel
Puedes alimentar las mediciones de las máquinas directamente desde una hoja de cálculo:
- Coloca tus datos en [`data/consumo.xlsx`](file:///c:/Users/Pakote/Antigravity/data/consumo.xlsx) (o utiliza la plantilla [`data/plantilla_consumo.xlsx`](file:///c:/Users/Pakote/Antigravity/data/plantilla_consumo.xlsx)).
- Las columnas aceptadas son: `machineId` (o `maquina`), `powerKw` (o `potencia`), `voltageV` (o `voltaje`), `currentA` (o `corriente`), `timestamp` (o `fecha`).
- **Desde la terminal:** ejecuta `npm run import:excel`.
- **Desde el Dashboard:** haz clic en el botón verde **"Cargar data/consumo.xlsx"** para procesarlo inmediatamente.

---

## 🏭 Máquinas Industriales Monitorizadas

| ID | Nombre de Máquina | Ubicación | Umbral Máximo |
|---|---|---|---|
| **M1** | Torno CNC Mazak QTN-200 | Taller Mecanizado - Celda 1 | **35.0 kW** |
| **M2** | Fresadora 5 Ejes Hermle C42 | Taller Mecanizado - Celda 2 | **42.0 kW** |
| **M3** | Compresor Atlas Copco GA-75 | Sala de Fluidos y Compresores | **28.0 kW** |
| **M4** | Horno Tratamiento Ipsen VFC | Planta de Tratamiento Térmico | **55.0 kW** |

*(Los umbrales se pueden ajustar en cualquier momento directamente desde el Dashboard).*

---

## 🧪 Pruebas y Simulación Integrada

El Dashboard incluye en su parte superior un **Simulador de Telemetría IoT en Vivo**:
1. **Simulación automática**: Envía lecturas de fluctuación normales a intervalos periódicos para ver las curvas del gráfico en tiempo real.
2. **Inyección de Picos de Sobreconsumo**: Botones dedicados para inyectar un consumo excesivo (+35% sobre el umbral) en cualquiera de las 4 máquinas para verificar:
   - Transición visual de la tarjeta a color rojo carmesí y badge **Sobreconsumo**.
   - Registro instantáneo en la bitácora de alertas.
   - Activación del envío del correo electrónico por Gmail.
   - Activación del contador de *Cooldown* (5 min) para prevenir notificaciones spam.
3. **Botón "Probar Alerta Gmail"**: Permite enviar un correo de prueba bajo demanda para comprobar que las credenciales de Google funcionen correctamente.
