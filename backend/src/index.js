import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';

// Routes
import wellsRouter      from './routes/wells.js';
import eventsRouter     from './routes/events.js';
import formationsRouter from './routes/formations.js';
import parametersRouter from './routes/parameters.js';
import alertsRouter     from './routes/alerts.js';
import comparisonRouter from './routes/comparison.js';

// WebSocket simulation
import { startSimulation } from './services/ertmacService.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// ── REST API ──────────────────────────────────────────────────────
app.use('/api/wells',      wellsRouter);
app.use('/api',            eventsRouter);
app.use('/api',            formationsRouter);
app.use('/api',            parametersRouter);
app.use('/api',            alertsRouter);
app.use('/api',            comparisonRouter);

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── HTTP + WebSocket Server ───────────────────────────────────────
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

// Track active simulations per well
const simulations = new Map();

wss.on('connection', (ws, req) => {
  // Extract well_id from path: /ws/well/:id
  const match = req.url.match(/\/ws\/well\/(\d+)/);
  const wellId = match ? parseInt(match[1]) : null;

  if (!wellId) {
    ws.close(1008, 'well_id required — connect to /ws/well/{id}');
    return;
  }

  console.log(`[WS] Client connected — well ${wellId}`);

  ws.on('message', (msg) => {
    try {
      const { action } = JSON.parse(msg.toString());
      if (action === 'START') {
        if (simulations.has(wellId)) simulations.get(wellId)(); // stop existing
        const stop = startSimulation(ws, wellId);
        simulations.set(wellId, stop);
        ws.send(JSON.stringify({ type: 'SIMULATION_STARTED', well_id: wellId }));
      }
      if (action === 'STOP') {
        if (simulations.has(wellId)) {
          simulations.get(wellId)();
          simulations.delete(wellId);
          ws.send(JSON.stringify({ type: 'SIMULATION_STOPPED' }));
        }
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'ERROR', message: e.message }));
    }
  });

  ws.on('close', () => {
    if (simulations.has(wellId)) {
      simulations.get(wellId)();
      simulations.delete(wellId);
    }
    console.log(`[WS] Client disconnected — well ${wellId}`);
  });
});

// WebSocket server also handles path-based connections
wss.on('connection', () => {});

server.listen(config.port, () => {
  console.log(`\n🛢  NWIS Backend running at http://localhost:${config.port}`);
  console.log(`🔌  WebSocket at ws://localhost:${config.port}/ws/well/{id}`);
});
