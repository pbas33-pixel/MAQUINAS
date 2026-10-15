import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AlertsPanel({ alerts = [], onTestEmail }) {
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await onTestEmail();
      setTestResult(res);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="panel-card" id="alerts-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 className="section-title">
          <Bell size={18} style={{ color: '#ef4444' }} />
          Bitácora de Alertas e Incidentes ({alerts.length})
        </h3>
        <button 
          className="btn btn-secondary" 
          onClick={handleTest} 
          disabled={testingEmail}
          style={{ fontSize: '11px', padding: '5px 10px' }}
          id="btn-test-alert-email"
        >
          {testingEmail ? <RefreshCw size={12} className="spin" /> : <Send size={12} />}
          <span>Probar Alerta Gmail</span>
        </button>
      </div>

      {testResult && (
        <div style={{ 
          background: testResult.result?.simulated ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${testResult.result?.simulated ? '#f59e0b' : '#10b981'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {testResult.result?.simulated ? <AlertCircle size={14} color="#f59e0b" /> : <CheckCircle2 size={14} color="#10b981" />}
          <span>{testResult.result?.message || testResult.message || 'Prueba de alerta procesada'}</span>
        </div>
      )}

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '13px' }}>
          <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 8px', opacity: 0.8 }} />
          <p>No se han registrado incidencias de sobreconsumo.</p>
          <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Todas las máquinas operan bajo sus límites nominales.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert, idx) => {
            const timeStr = new Date(alert.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={alert.id || idx} className="alert-item">
                <div>
                  <div className="alert-item-title">
                    {alert.machine_id}: {alert.power_kw} kW 
                    <span style={{ color: '#ef4444', marginLeft: '6px', fontSize: '12px' }}>
                      (Umbral: {alert.threshold_kw} kW)
                    </span>
                  </div>
                  <div className="alert-item-meta">
                    {alert.details || 'Sobreconsumo crítico detectado'} • {timeStr}
                  </div>
                </div>
                <div>
                  {alert.email_sent ? (
                    <span className="email-pill">Gmail Enviado ✓</span>
                  ) : (
                    <span className="email-pill simulated">Simulado / Cooldown</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
