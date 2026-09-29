import { Router } from 'express';
import { getAllWells, getWellById, createWell, getNearbyWells, getWellTrajectory } from '../services/wellService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const wells = await getAllWells();
    res.json(wells);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const well = await getWellById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    res.json(well);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const well = await createWell(req.body);
    res.status(201).json(well);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/nearby', async (req, res) => {
  try {
    const radius = parseFloat(req.query.radius) || 10;
    const wells = await getNearbyWells(req.params.id, radius);
    res.json(wells);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/trajectory', async (req, res) => {
  try {
    const traj = await getWellTrajectory(req.params.id);
    res.json(traj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
