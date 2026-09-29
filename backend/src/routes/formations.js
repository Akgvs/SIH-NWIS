import { Router } from 'express';
import { getAllFormations, getFormationsForWell } from '../services/formationService.js';

const router = Router();

router.get('/formations', async (req, res) => {
  try {
    res.json(await getAllFormations());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/wells/:id/formations', async (req, res) => {
  try {
    res.json(await getFormationsForWell(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
