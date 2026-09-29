import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8000'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nwis_db',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),

  // Alert thresholds
  alertTorqueThreshold: parseFloat(process.env.ALERT_TORQUE_THRESHOLD || '95'),
  alertEcdThreshold: parseFloat(process.env.ALERT_ECD_THRESHOLD || '1.25'),
  alertRopDropThreshold: parseFloat(process.env.ALERT_ROP_DROP_THRESHOLD || '30'),
  alertDepthWindow: parseFloat(process.env.ALERT_DEPTH_WINDOW || '50'),

  // Simulation
  simulationIntervalMs: parseInt(process.env.SIMULATION_INTERVAL_MS || '2000'),
  simulationDepthIncrement: parseFloat(process.env.SIMULATION_DEPTH_INCREMENT || '5'),
  simulationStartDepth: parseFloat(process.env.SIMULATION_START_DEPTH || '2800'),
  simulationEndDepth: parseFloat(process.env.SIMULATION_END_DEPTH || '3200'),
};
