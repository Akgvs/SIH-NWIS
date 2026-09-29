import { Router } from 'express';
import { runAlertEngine } from '../services/alertService.js';

const router = Router();

router.get('/wells/:id/alerts', async (req, res) => {
  try {
    const { depth, radius } = req.query;
    if (!depth) return res.status(400).json({ error: 'depth query param required' });
    const alerts = await runAlertEngine({
      activeWellId: parseInt(req.params.id),
      currentDepth: parseFloat(depth),
      radiusKm: radius ? parseFloat(radius) : 10,
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
