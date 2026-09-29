const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export class WellWebSocket {
  constructor(wellId, { onData, onAlerts, onStatus, onError }) {
    this.wellId = wellId;
    this.onData = onData;
    this.onAlerts = onAlerts;
    this.onStatus = onStatus;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnects = 3;
  }

  connect() {
    const url = `${WS_BASE}/ws/well/${this.wellId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatus?.('connected');
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        switch (msg.type) {
          case 'DRILLING_DATA':      this.onData?.(msg.data);        break;
          case 'ALERTS':             this.onAlerts?.(msg.alerts, msg.depth); break;
          case 'SIMULATION_STARTED': this.onStatus?.('simulating');  break;
          case 'SIMULATION_STOPPED': this.onStatus?.('stopped');     break;
          case 'SIMULATION_COMPLETE':this.onStatus?.('complete');    break;
          default: break;
        }
      } catch (e) {
        this.onError?.(e.message);
      }
    };

    this.ws.onerror = (ev) => this.onError?.('WebSocket error');

    this.ws.onclose = () => {
      this.onStatus?.('disconnected');
    };
  }

  startSimulation()  { this._send({ action: 'START' }); }
  stopSimulation()   { this._send({ action: 'STOP'  }); }

  _send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.ws?.close();
  }
}
