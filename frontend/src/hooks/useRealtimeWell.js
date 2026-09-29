import { useState, useEffect, useRef, useCallback } from 'react';
import { WellWebSocket } from '../services/websocket';

import { api } from '../services/api';

/**
 * useRealtimeWell — manages WebSocket connection + simulation state for a well.
 *
 * Returns:
 *   liveData     — latest drilling parameter reading
 *   alerts       — current active alerts from the engine
 *   wsStatus     — 'disconnected' | 'connected' | 'simulating' | 'complete'
 *   startSim     — fn to start drilling simulation
 *   stopSim      — fn to stop
 *   history      — last N readings (for sparklines)
 */
export function useRealtimeWell(wellId, { historyLength = 60 } = {}) {
  const [liveData, setLiveData]   = useState(null);
  const [alerts, setAlerts]       = useState([]);
  const [wsStatus, setWsStatus]   = useState('disconnected');
  const [history, setHistory]     = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!wellId) return;

    // Fetch initial dummy data history
    api.getParameters(wellId).then(data => {
      if (data && data.length > 0) {
        setHistory(data.slice(-historyLength));
        setLiveData(data[data.length - 1]);
      }
    }).catch(console.error);

    const ws = new WellWebSocket(wellId, {
      onData: (data) => {
        setLiveData(data);
        setHistory(prev => {
          const next = [...prev, data];
          return next.slice(-historyLength);
        });
      },
      onAlerts: (newAlerts) => {
        setAlerts(newAlerts);
      },
      onStatus: setWsStatus,
      onError:  (msg) => console.error('[WS]', msg),
    });

    ws.connect();
    wsRef.current = ws;

    return () => ws.disconnect();
  }, [wellId]);

  const startSim = useCallback(() => {
    wsRef.current?.startSimulation();
  }, []);

  const stopSim = useCallback(() => {
    wsRef.current?.stopSimulation();
  }, []);

  return { liveData, alerts, wsStatus, startSim, stopSim, history };
}
