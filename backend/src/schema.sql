-- Esquema Relacional de Monitorización de Consumo Energético en Neon PostgreSQL

CREATE TABLE IF NOT EXISTS machines (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100) DEFAULT 'Planta Principal',
  threshold_kw NUMERIC(8, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_readings (
  id BIGSERIAL PRIMARY KEY,
  machine_id VARCHAR(20) NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  power_kw NUMERIC(8, 2) NOT NULL,
  voltage_v NUMERIC(8, 2) NOT NULL,
  current_a NUMERIC(8, 2) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_machine_time 
  ON telemetry_readings(machine_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS alert_logs (
  id BIGSERIAL PRIMARY KEY,
  machine_id VARCHAR(20) NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  power_kw NUMERIC(8, 2) NOT NULL,
  threshold_kw NUMERIC(8, 2) NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  recipient_email VARCHAR(150),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
  ON alert_logs(created_at DESC);

-- Siembra de las 4 máquinas industriales base
INSERT INTO machines (id, name, location, threshold_kw)
VALUES 
  ('M1', 'Torno CNC Mazak QTN-200', 'Taller Mecanizado - Celda 1', 35.00),
  ('M2', 'Fresadora 5 Ejes Hermle C42', 'Taller Mecanizado - Celda 2', 42.00),
  ('M3', 'Compresor Atlas Copco GA-75', 'Sala de Fluidos y Compresores', 28.00),
  ('M4', 'Horno Tratamiento Ipsen VFC', 'Planta de Tratamiento Térmico', 55.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  threshold_kw = EXCLUDED.threshold_kw;
