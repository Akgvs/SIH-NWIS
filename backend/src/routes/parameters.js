import { Router } from 'express';
import { getDrillingParameters } from '../services/parameterService.js';

const router = Router();

router.get('/wells/:id/parameters', async (req, res) => {
  try {
    const { start_depth, end_depth, start_time, end_time } = req.query;
    const params = await getDrillingParameters(req.params.id, {
      start_depth: start_depth ? parseFloat(start_depth) : undefined,
      end_depth:   end_depth   ? parseFloat(end_depth)   : undefined,
      start_time, end_time,
    });
    res.json(params);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
