const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./initDb');
const telemetryRouter = require('./routes/telemetry');
const machinesRouter = require('./routes/machines');
const alertsRouter = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logger simple para peticiones entrantes
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Rutas de la API
app.use('/api/telemetry', telemetryRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/alerts', alertsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Industrial PowerPulse Telemetry API',
    timestamp: new Date().toISOString(),
    env: {
      neonConfigured: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('usuario:password')),
      gmailConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && !process.env.GMAIL_APP_PASSWORD.includes('xxxx'))
    }
  });
});

// Inicio del servidor e inicialización de BD
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`⚡ Industrial PowerPulse API ejecutándose en http://localhost:${PORT}`);
      console.log(`📡 Endpoints disponibles:`);
      console.log(`   - POST http://localhost:${PORT}/api/telemetry (Ingestión)`);
      console.log(`   - GET  http://localhost:${PORT}/api/machines (Estado de 4 máquinas)`);
      console.log(`   - GET  http://localhost:${PORT}/api/telemetry/history (Historial)`);
      console.log(`   - GET  http://localhost:${PORT}/api/alerts (Alertas)`);
      console.log(`   - POST http://localhost:${PORT}/api/alerts/test (Prueba de correo)`);
      console.log('================================================================');
    });
  } catch (err) {
    console.error('❌ Error fatal al iniciar el servidor:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
