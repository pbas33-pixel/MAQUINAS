import React, { useState } from 'react';
import { Zap, AlertTriangle, ShieldCheck, Clock, Settings2 } from 'lucide-react';

export default function MachineCard({ machine, onUpdateThreshold }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newThreshold, setNewThreshold] = useState(machine.thresholdKw);

  const status = machine.status || 'OFFLINE';
  const loadPercentage = machine.loadPercentage || 0;
  const currentPower = machine.currentPowerKw !== undefined ? machine.currentPowerKw.toFixed(1) : '0.0';

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (onUpdateThreshold) {
      await onUpdateThreshold(machine.id, parseFloat(newThreshold));
    }
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'CRITICAL':
        return <AlertTriangle size={14} />;
      case 'WARNING':
        return <AlertTriangle size={14} />;
      case 'NORMAL':
        return <ShieldCheck size={14} />;
      default:
        return <Zap size={14} />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'CRITICAL':
        return 'Sobreconsumo';
      case 'WARNING':
        return 'Alerta Carga';
      case 'NORMAL':
        return 'Normal';
      default:
        return 'Sin Datos';
    }
  };

  return (
    <div className={`machine-card status-${status}`} id={`machine-card-${machine.id}`}>
      <div className="machine-header">
        <div className="machine-meta">
          <span className="machine-id-badge">{machine.id}</span>
          <h3 className="machine-name">{machine.name}</h3>
          <span className="machine-location">{machine.location}</span>
        </div>
        <div className={`status-badge ${status}`}>
          {getStatusIcon()}
          <span>{getStatusLabel()}</span>
        </div>
      </div>

      <div className="power-readout">
        <div>
          <span className="power-large">{currentPower}</span>
          <span className="power-unit">kW</span>
        </div>
        <div className="threshold-target">
          Umbral: <strong>{machine.thresholdKw} kW</strong>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '2px 6px', marginLeft: '6px', fontSize: '11px' }}
            onClick={() => setIsEditing(!isEditing)}
            title="Editar umbral"
          >
            <Settings2 size={12} />
          </button>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSaveThreshold} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input 
            type="number" 
            step="0.5" 
            value={newThreshold} 
            onChange={(e) => setNewThreshold(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              width: '80px',
              fontSize: '13px'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }}>
            Guardar
          </button>
        </form>
      )}

      {/* Progress Track */}
      <div className="progress-track" title={`Carga: ${loadPercentage}%`}>
        <div 
          className={`progress-fill ${status}`}
          style={{ width: `${Math.min(loadPercentage, 100)}%` }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
        <span>0 kW</span>
        <span>Carga: {loadPercentage}%</span>
        <span>{machine.thresholdKw} kW</span>
      </div>

      <div className="machine-stats-row">
        <div className="stat-item">
          <span>Tensión</span>
          <span className="val">{machine.lastReading ? `${machine.lastReading.voltageV} V` : '400.0 V'}</span>
        </div>
        <div className="stat-item">
          <span>Corriente</span>
          <span className="val">{machine.lastReading ? `${machine.lastReading.currentA} A` : '0.0 A'}</span>
        </div>
        <div className="stat-item">
          <span>Cooldown</span>
          <span className="val" style={{ color: machine.cooldown?.inCooldown ? '#f59e0b' : '#10b981' }}>
            {machine.cooldown?.inCooldown ? `${machine.cooldown.remainingSeconds}s` : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
}
