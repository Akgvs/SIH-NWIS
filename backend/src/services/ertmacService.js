/**
 * eRTMAC Data Provider Abstraction
 * ==================================
 * Future hook:
 *   ERTMACDataProvider (abstract)
 *       ↑
 *   MockERTMACDataProvider   ← this file
 *   (future) LiveERTMACDataProvider
 */

import { config } from '../config.js';
import { runAlertEngine } from './alertService.js';

function gaussian() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const g = (mean, std) => mean + gaussian() * std;

function baseROP(depth) {
  let base = 18 - (depth - 2800) * 0.005;
  if (depth >= 2840 && depth <= 2920) base *= 0.65;
  return Math.max(base, 2);
}

function generateReading(wellId, depth, prevRop) {
  const rop       = parseFloat((baseROP(depth) + g(0, 0.5)).toFixed(2));
  const wob       = parseFloat((16 + (depth - 2800) * 0.003 + g(0, 0.3)).toFixed(2));
  const rpm       = parseFloat((115 + g(0, 3)).toFixed(1));
  const torqueBase = 75 + (depth - 2800) * 0.008;
  const torqueSpike = (depth >= 2860 && depth <= 2890) ? g(14, 4) : 0;
  const torque    = parseFloat((torqueBase + torqueSpike + g(0, 1.5)).toFixed(2));
  const spp       = parseFloat((2050 + (depth - 2800) * 0.15 + g(0, 20)).toFixed(1));
  const flow_rate = parseFloat((450 + g(0, 5)).toFixed(1));
  const mud_weight = parseFloat((depth > 2850 ? 1.18 : 1.16 + g(0, 0.002)).toFixed(4));
  const ecd       = parseFloat((mud_weight + 0.02 + (depth - 2800) * 0.000015 + g(0, 0.003)).toFixed(4));

  return {
    well_id: wellId,
    timestamp: new Date().toISOString(),
    depth: parseFloat(depth.toFixed(1)),
    rop, wob, rpm, torque, spp, flow_rate, mud_weight, ecd,
    prev_rop: prevRop,
  };
}

/**
 * Start a drilling simulation for a well.
 * Sends JSON messages to the WebSocket client.
 * Also runs the alert engine at each depth step.
 *
 * @param {WebSocket} ws       The connected client
 * @param {number}    wellId   Active well id
 * @param {object}    db       Not needed — using pool directly
 */
export function startSimulation(ws, wellId) {
  let depth = config.simulationStartDepth;
  const endDepth = config.simulationEndDepth;
  let prevRop = null;
  let running = true;

  const send = (data) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  };

  const tick = async () => {
    if (!running || depth > endDepth) {
      send({ type: 'SIMULATION_COMPLETE', depth });
      return;
    }

    const reading = generateReading(wellId, depth, prevRop);
    prevRop = reading.rop;

    // Run alert engine for this depth step
    try {
      const alerts = await runAlertEngine({
        activeWellId: wellId,
        currentDepth: depth,
        radiusKm: 10,
        currentParams: { torque: reading.torque, ecd: reading.ecd, rop: reading.rop, prev_rop: prevRop },
      });

      send({ type: 'DRILLING_DATA', data: reading });
      if (alerts.length > 0) {
        send({ type: 'ALERTS', depth, alerts });
      }
    } catch (err) {
      console.error(`Alert engine error at depth ${depth}:`, err.message);
      send({ type: 'DRILLING_DATA', data: reading });
    }

    depth += config.simulationDepthIncrement;
    setTimeout(tick, config.simulationIntervalMs);
  };

  // Allow external stop
  const stop = () => { running = false; };

  tick();
  return stop;
}
