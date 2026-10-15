import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  Database, 
  Mail, 
  CheckCircle2, 
  Layers, 
  Flame 
} from 'lucide-react';
import MachineCard from './components/MachineCard';
import TelemetryChart from './components/TelemetryChart';
import AlertsPanel from './components/AlertsPanel';
import SimulatorControls from './components/SimulatorControls';

const API_BASE = '/api';

export default function App() {
  const [machines, setMachines] = useState([]);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState({ neonConfigured: false, gmailConfigured: false });
  const [isSimulating, setIsSimulating] = useState(true);
  const [loading, setLoading] = useState(true);

  // Cargar estado inicial y refresco periódico
  const fetchData = async () => {
    try {
      const [resMachines, resHistory, resAlerts, resHealth] = await Promise.all([
        fetch(`${API_BASE}/machines`).then(r => r.json()),
        fetch(`${API_BASE}/telemetry/history?limit=60`).then(r => r.json()),
        fetch(`${API_BASE}/alerts?limit=20`).then(r => r.json()),
        fetch(`${API_BASE}/health`).then(r => r.json()).catch(() => ({ env: {} }))
      ]);

      if (resMachines.machines) setMachines(resMachines.machines);
      if (resHistory.readings) setHistory(resHistory.readings);
      if (resAlerts.alerts) setAlerts(resAlerts.alerts);
      if (resHealth.env) setHealth(resHealth.env);
      setLoading(false);
    } catch (err) {
      console.error('Error al sincronizar datos del dashboard:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Bucle del simulador de telemetría automática
  useEffect(() => {
    if (!isSimulating || machines.length === 0) return;

    const simInterval = setInterval(async () => {
      // Elegir aleatoriamente 1 o 2 máquinas para emitir lectura fluctuante normal (60% - 85% de su umbral)
      const randomMachine = machines[Math.floor(Math.random() * machines.length)];
      if (!randomMachine) return;

      const baseThreshold = randomMachine.thresholdKw;
      // Fluctuación entre el 55% y el 82% del umbral
      const randomFactor = 0.55 + Math.random() * 0.27;
      const powerKw = parseFloat((baseThreshold * randomFactor).toFixed(1));
      const voltageV = parseFloat((398 + Math.random() * 6).toFixed(1));
      const currentA = parseFloat((powerKw * 1.52).toFixed(1));

      try {
        await fetch(`${API_BASE}/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineId: randomMachine.id,
            powerKw,
            voltageV,
            currentA
          })
        });
      } catch (err) {
        console.warn('Simulador: fallo al enviar lectura periódica', err);
      }
    }, 3000);

    return () => clearInterval(simInterval);
  }, [isSimulating, machines]);

  // Actualizar umbral
  const handleUpdateThreshold = async (machineId, thresholdKw) => {
    try {
      await fetch(`${API_BASE}/machines/${machineId}/threshold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholdKw })
      });
      await fetchData();
    } catch (err) {
      console.error('Error al actualizar umbral:', err);
    }
  };

  // Disparar pico de sobreconsumo (forzar anomalía)
  const handleTriggerSpike = async (machineId, spikePower) => {
    try {
      await fetch(`${API_BASE}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId,
          powerKw: spikePower,
          voltageV: 405.0,
          currentA: parseFloat((spikePower * 1.55).toFixed(1))
        })
      });
      await fetchData();
    } catch (err) {
      console.error('Error al forzar pico de sobreconsumo:', err);
    }
  };

  // Importar lote de mediciones desde el archivo local data/consumo.xlsx
  const handleImportExcel = async () => {
    try {
      const res = await fetch(`${API_BASE}/telemetry/import-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al procesar archivo');
      }
      await fetchData();
      return data;
    } catch (err) {
      console.error('Error al importar Excel:', err);
      throw err;
    }
  };

  // Normalizar todas las máquinas
  const handleNormalizeAll = async () => {
    try {
      for (const m of machines) {
        const normalPower = parseFloat((m.thresholdKw * 0.65).toFixed(1));
        await fetch(`${API_BASE}/telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineId: m.id,
            powerKw: normalPower,
            voltageV: 400.0,
            currentA: parseFloat((normalPower * 1.5).toFixed(1))
          })
        });
      }
      await fetchData();
    } catch (err) {
      console.error('Error al normalizar máquinas:', err);
    }
  };

  // Probar alerta Gmail bajo demanda
  const handleTestEmail = async () => {
    const res = await fetch(`${API_BASE}/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: 'M1', powerKw: 50.0 })
    });
    const data = await res.json();
    await fetchData();
    return data;
  };

  // Estadísticas KPI agregadas
  const totalPower = machines.reduce((acc, m) => acc + (m.currentPowerKw || 0), 0).toFixed(1);
  const criticalCount = machines.filter(m => m.status === 'CRITICAL').length;
  const warningCount = machines.filter(m => m.status === 'WARNING').length;
  const normalCount = machines.filter(m => m.status === 'NORMAL').length;

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="brand-title">
              PowerPulse <span className="brand-badge">Industrial v1.0</span>
            </h1>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Monitorización Energética & Alertas Gmail • Neon PostgreSQL
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Base de Datos Neon Pill */}
          <div 
            className="system-status-pill"
            style={{ 
              backgroundColor: health.neonConfigured ? 'rgba(0, 242, 254, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: health.neonConfigured ? 'rgba(0, 242, 254, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              color: health.neonConfigured ? '#00f2fe' : '#fbbf24'
            }}
            title={health.neonConfigured ? 'Conectado a Neon PostgreSQL' : 'Modo local seguro (añade DATABASE_URL en .env para Neon en la nube)'}
          >
            <Database size={13} />
            <span>{health.neonConfigured ? 'Neon Postgres (Activo)' : 'Neon (Local Seguro)'}</span>
          </div>

          {/* Gmail Status Pill */}
          <div 
            className="system-status-pill"
            style={{ 
              backgroundColor: health.gmailConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: health.gmailConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              color: health.gmailConfigured ? '#34d399' : '#fbbf24'
            }}
            title={health.gmailConfigured ? 'Servicio Gmail SMTP listo' : 'Gmail en modo simulación (configura GMAIL_USER y GMAIL_APP_PASSWORD en .env)'}
          >
            <Mail size={13} />
            <span>{health.gmailConfigured ? 'Gmail SMTP (Listo)' : 'Gmail (Simulado)'}</span>
          </div>

          {/* Liveness Dot */}
          <div className="system-status-pill">
            <span className="status-dot" />
            <span>Telemetría En Vivo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* KPI Summary Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Potencia Total Activa</span>
              <div className="kpi-icon" style={{ color: '#00f2fe' }}><Zap size={16} /></div>
            </div>
            <div className="kpi-value">{totalPower} <span style={{ fontSize: '16px', color: '#94a3b8' }}>kW</span></div>
            <div className="kpi-subtext">Consumo sumado de las 4 celdas</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Estado de Celdas</span>
              <div className="kpi-icon" style={{ color: criticalCount > 0 ? '#ef4444' : '#10b981' }}><Layers size={16} /></div>
            </div>
            <div className="kpi-value" style={{ color: criticalCount > 0 ? '#ef4444' : '#10b981' }}>
              {normalCount}/4 <span style={{ fontSize: '15px', color: '#94a3b8' }}>Nominales</span>
            </div>
            <div className="kpi-subtext">
              {criticalCount > 0 ? `⚠️ ${criticalCount} celda(s) en sobreconsumo` : '✓ Todas las celdas en rango seguro'}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Incidentes Registrados</span>
              <div className="kpi-icon" style={{ color: '#f59e0b' }}><AlertTriangle size={16} /></div>
            </div>
            <div className="kpi-value">{alerts.length}</div>
            <div className="kpi-subtext">Histórico de alertas críticas</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Ventana de Cooldown</span>
              <div className="kpi-icon" style={{ color: '#38bdf8' }}><Activity size={16} /></div>
            </div>
            <div className="kpi-value" style={{ fontSize: '24px' }}>5 min</div>
            <div className="kpi-subtext">Control anti-saturación de Gmail</div>
          </div>
        </div>

        {/* Simulador Interactivo */}
        <SimulatorControls 
          isSimulating={isSimulating}
          onToggleSimulate={() => setIsSimulating(!isSimulating)}
          onTriggerSpike={handleTriggerSpike}
          onNormalizeAll={handleNormalizeAll}
          onImportExcel={handleImportExcel}
          machines={machines}
        />

        {/* 4 Machine Cards Grid */}
        <div className="section-title-wrap">
          <h2 className="section-title">
            <Layers size={18} style={{ color: '#00f2fe' }} />
            Supervisión Individual de las 4 Máquinas
          </h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Límite admisible programado por máquina
          </span>
        </div>

        <div className="machines-grid">
          {machines.map(machine => (
            <MachineCard 
              key={machine.id} 
              machine={machine} 
              onUpdateThreshold={handleUpdateThreshold}
            />
          ))}
        </div>

        {/* Lower Grid: Chart & Alerts */}
        <div className="dashboard-lower-grid">
          <TelemetryChart history={history} machines={machines} />
          <AlertsPanel alerts={alerts} onTestEmail={handleTestEmail} />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Industrial PowerPulse • Monitor de Consumo Eléctrico de 4 Máquinas • Neon Lakebase PostgreSQL & Nodemailer Gmail
        </p>
        <p style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
          Para activar envíos reales de correo: edita el archivo <code>.env</code> con tu <code>GMAIL_USER</code> y <code>GMAIL_APP_PASSWORD</code> (Contraseña de aplicación de 16 dígitos de Google).
        </p>
      </footer>
    </div>
  );
}
