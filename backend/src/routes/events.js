import { Router } from 'express';
import { getEventsForWell, getEventById } from '../services/eventService.js';

const router = Router();

// GET /api/wells/:id/events
router.get('/wells/:id/events', async (req, res) => {
  try {
    const { event_type, severity, min_depth, max_depth } = req.query;
    const events = await getEventsForWell(req.params.id, {
      event_type, severity,
      min_depth: min_depth ? parseFloat(min_depth) : undefined,
      max_depth: max_depth ? parseFloat(max_depth) : undefined,
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id
router.get('/events/:id', async (req, res) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
