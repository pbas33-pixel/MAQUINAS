import React, { useState } from 'react';
import { Play, Pause, Flame, RotateCcw, Cpu, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SimulatorControls({ 
  isSimulating, 
  onToggleSimulate, 
  onTriggerSpike, 
  onNormalizeAll,
  onImportExcel,
  machines = []
}) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await onImportExcel();
      setImportResult({
        success: true,
        message: res.message || `Importadas ${res.rowsImported} lecturas desde data/consumo.xlsx`
      });
      setTimeout(() => setImportResult(null), 6000);
    } catch (err) {
      setImportResult({
        success: false,
        message: err.message || 'Error al importar archivo Excel'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="simulator-panel" id="simulator-controls-panel">
      <div className="sim-header">
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} style={{ color: '#00f2fe' }} />
            Simulador de Telemetría IoT & Carga Excel
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Importa registros desde <code>data/consumo.xlsx</code>, genera telemetría periódica o provoca sobreconsumos para probar alertas.
          </p>
        </div>

        <div className="sim-buttons-group">
          {/* Botón Importar Excel */}
          <button 
            className="btn"
            style={{ 
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
            }}
            onClick={handleImport}
            disabled={importing}
            id="btn-import-excel"
            title="Lee y procesa las lecturas del archivo data/consumo.xlsx"
          >
            <FileSpreadsheet size={15} />
            <span>{importing ? 'Procesando Excel...' : 'Cargar data/consumo.xlsx'}</span>
          </button>

          <button 
            className={`btn ${isSimulating ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onToggleSimulate}
            id="btn-toggle-auto-sim"
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Pausar Simulación' : 'Simulación en Vivo'}</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={onNormalizeAll}
            id="btn-normalize-all"
            title="Devuelve todas las máquinas a consumos normales"
          >
            <RotateCcw size={14} />
            <span>Normalizar</span>
          </button>
        </div>
      </div>

      {importResult && (
        <div style={{
          background: importResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${importResult.success ? '#10b981' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: importResult.success ? '#34d399' : '#f87171'
        }}>
          {importResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{importResult.message}</span>
        </div>
      )}

      <div style={{ marginTop: '14px' }}>
        <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
          Forzar Inyección de Sobreconsumo Manual (Disparo de Alerta y Correo Gmail):
        </span>
        
        <div className="spikes-grid">
          {machines.map(m => {
            const spikePower = Math.round(m.thresholdKw * 1.35); // 35% por encima del umbral
            return (
              <div key={m.id} className="spike-card">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>{m.id} - {m.name.split(' ')[0]}</div>
                  <div style={{ fontSize: '11px', color: '#ef4444' }}>Inyectar: {spikePower} kW</div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 10px', fontSize: '11px' }}
                  onClick={() => onTriggerSpike(m.id, spikePower)}
                  id={`btn-spike-${m.id}`}
                >
                  <Flame size={12} />
                  <span>Pico</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
