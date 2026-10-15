import React from 'react';
import { Activity } from 'lucide-react';

const MACHINE_COLORS = {
  M1: '#00f2fe', // Cyan
  M2: '#a855f7', // Purple
  M3: '#f59e0b', // Amber
  M4: '#10b981'  // Emerald
};

export default function TelemetryChart({ history = [], machines = [] }) {
  const width = 760;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Organizar lecturas por máquina (últimos 15 puntos por cada una)
  const readingsByMachine = {
    M1: [],
    M2: [],
    M3: [],
    M4: []
  };

  // El historial viene ordenado desc por timestamp; lo revertimos para ver la línea temporal izq -> der
  const sortedHistory = [...history].reverse();
  sortedHistory.forEach(r => {
    if (readingsByMachine[r.machine_id]) {
      readingsByMachine[r.machine_id].push(r);
    }
  });

  const maxPoints = Math.max(
    ...Object.values(readingsByMachine).map(arr => arr.length),
    10
  );

  const maxPower = 70; // Escala máxima en kW

  // Función para convertir punto a coordenadas SVG
  const getCoordinates = (index, totalPoints, power) => {
    const x = padding.left + (index / (Math.max(totalPoints - 1, 1))) * chartWidth;
    const y = padding.top + chartHeight - (Math.min(power, maxPower) / maxPower) * chartHeight;
    return { x, y };
  };

  const generatePath = (readings) => {
    if (readings.length === 0) return '';
    return readings.map((r, i) => {
      const { x, y } = getCoordinates(i, readings.length, parseFloat(r.power_kw));
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="panel-card" id="telemetry-chart-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 className="section-title">
          <Activity size={18} style={{ color: '#00f2fe' }} />
          Tendencia de Consumo en Tiempo Real (kW)
        </h3>
        <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
          {machines.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: MACHINE_COLORS[m.id] || '#cbd5e1',
                boxShadow: `0 0 6px ${MACHINE_COLORS[m.id]}`
              }} />
              <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{m.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            {Object.entries(MACHINE_COLORS).map(([id, color]) => (
              <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines y marcas del eje Y */}
          {[0, 20, 40, 60].map(val => {
            const y = padding.top + chartHeight - (val / maxPower) * chartHeight;
            return (
              <g key={val}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  stroke="rgba(148, 163, 184, 0.1)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  fill="#64748b" 
                  fontSize="11" 
                  fontFamily="JetBrains Mono" 
                  textAnchor="end"
                >
                  {val}k
                </text>
              </g>
            );
          })}

          {/* Línea horizontal del eje X */}
          <line 
            x1={padding.left} 
            y1={padding.top + chartHeight} 
            x2={width - padding.right} 
            y2={padding.top + chartHeight} 
            stroke="rgba(148, 163, 184, 0.2)" 
          />

          {/* Líneas de potencia para cada máquina */}
          {['M1', 'M2', 'M3', 'M4'].map(machineId => {
            const readings = readingsByMachine[machineId];
            if (!readings || readings.length === 0) return null;
            const pathData = generatePath(readings);
            const color = MACHINE_COLORS[machineId];
            const lastPoint = readings[readings.length - 1];
            const lastCoord = getCoordinates(readings.length - 1, readings.length, parseFloat(lastPoint.power_kw));

            return (
              <g key={machineId}>
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                {/* Punto brillante actual */}
                <circle 
                  cx={lastCoord.x} 
                  cy={lastCoord.y} 
                  r="4.5" 
                  fill={color} 
                  stroke="#070a12" 
                  strokeWidth="1.5" 
                />
                <circle 
                  cx={lastCoord.x} 
                  cy={lastCoord.y} 
                  r="8" 
                  fill={color} 
                  opacity="0.3" 
                />
              </g>
            );
          })}

          {/* Eje de tiempo abajo */}
          <text 
            x={padding.left} 
            y={height - 10} 
            fill="#64748b" 
            fontSize="11" 
            fontFamily="JetBrains Mono"
          >
            ← Historial reciente
          </text>
          <text 
            x={width - padding.right} 
            y={height - 10} 
            fill="#00f2fe" 
            fontSize="11" 
            fontFamily="JetBrains Mono" 
            textAnchor="end"
          >
            En vivo • Ahora →
          </text>
        </svg>
      </div>
    </div>
  );
}
