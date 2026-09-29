const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Wells
  getWells:       ()           => apiFetch('/api/wells'),
  getWell:        (id)         => apiFetch(`/api/wells/${id}`),
  createWell:     (data)       => apiFetch('/api/wells', { method: 'POST', body: JSON.stringify(data) }),
  getNearbyWells: (id, radius) => apiFetch(`/api/wells/${id}/nearby?radius=${radius}`),
  getTrajectory:  (id)         => apiFetch(`/api/wells/${id}/trajectory`),

  // Events
  getEvents: (wellId, filters = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([,v]) => v != null));
    return apiFetch(`/api/wells/${wellId}/events?${q}`);
  },
  getEvent: (id) => apiFetch(`/api/events/${id}`),

  // Formations
  getFormations:        ()       => apiFetch('/api/formations'),
  getWellFormations:    (wellId) => apiFetch(`/api/wells/${wellId}/formations`),

  // Parameters
  getParameters: (wellId, filters = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([,v]) => v != null));
    return apiFetch(`/api/wells/${wellId}/parameters?${q}`);
  },

  // Alerts
  getAlerts: (wellId, depth, radius = 10) =>
    apiFetch(`/api/wells/${wellId}/alerts?depth=${depth}&radius=${radius}`),

  // Comparison
  compareWells: (activeId, offsetId) =>
    apiFetch(`/api/wells/${activeId}/compare/${offsetId}`),
};
