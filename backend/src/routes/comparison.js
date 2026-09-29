import { Router } from 'express';
import { getFormationsForWell } from '../services/formationService.js';
import { getEventsForWell } from '../services/eventService.js';
import { getDrillingParameters } from '../services/parameterService.js';
import { getWellById } from '../services/wellService.js';

const router = Router();

function haversine(lat1, lon1, lat2, lon2) {
  const p = Math.PI / 180, c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); 
}

router.get('/wells/:activeId/compare/:offsetId', async (req, res) => {
  try {
    const { activeId, offsetId } = req.params;

    const [activeWell, offsetWell] = await Promise.all([
      getWellById(activeId), getWellById(offsetId),
    ]);
    if (!activeWell || !offsetWell) return res.status(404).json({ error: 'One or both wells not found' });

    const distanceKm = haversine(activeWell.latitude, activeWell.longitude, offsetWell.latitude, offsetWell.longitude).toFixed(3);

    const [activeFormations, offsetFormations, activeEvents, offsetEvents, activeParams, offsetParams] =
      await Promise.all([
        getFormationsForWell(activeId), getFormationsForWell(offsetId),
        getEventsForWell(activeId), getEventsForWell(offsetId),
        getDrillingParameters(activeId, { start_depth: 2000, end_depth: 4000 }),
        getDrillingParameters(offsetId, { start_depth: 2000, end_depth: 4000 }),
      ]);

    res.json({
      active_well: activeWell, offset_well: offsetWell, distance_km: distanceKm,
      active: { formations: activeFormations, events: activeEvents, parameters: activeParams.slice(0, 500) },
      offset: { formations: offsetFormations, events: offsetEvents, parameters: offsetParams.slice(0, 500) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
