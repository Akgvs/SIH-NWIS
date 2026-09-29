import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Topbar  from './components/Layout/Topbar';
import Dashboard         from './pages/Dashboard';
import NearbyWells       from './pages/NearbyWells';
import WellDetails       from './pages/WellDetails';
import EventsIntelligence from './pages/EventsIntelligence';
import Comparison        from './pages/Comparison';
import Alerts            from './pages/Alerts';
import Settings          from './pages/Settings';
import { api }           from './services/api';

function App() {
  const [activeWell, setActiveWell] = useState(null);
  const [wsStatus, setWsStatus]     = useState('disconnected');
  const [alertCount, setAlertCount] = useState(0);

  // Load active well for topbar context
  useEffect(() => {
    api.getWells().then(wells => {
      const active = wells.find(w => w.status === 'ACTIVE');
      if (active) setActiveWell(active);
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Sidebar alertCount={alertCount} />
      <Topbar activeWell={activeWell} wsStatus={wsStatus} alertCount={alertCount} />

      <main
        className="overflow-y-auto"
        style={{
          paddingLeft: 220,
          paddingTop: 56,
          minHeight: '100vh',
        }}
      >
        <div className="p-5 max-w-screen-2xl mx-auto min-h-[calc(100vh-56px)]">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/nearby"     element={<NearbyWells />} />
            <Route path="/well"       element={<WellDetails />} />
            <Route path="/events"     element={<EventsIntelligence />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/alerts"     element={<Alerts />} />
            <Route path="/documents"  element={<WellDetails />} />
            <Route path="/settings"   element={<Settings />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}

export default App;
