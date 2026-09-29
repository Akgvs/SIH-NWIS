import { db } from '../db/mockDb.js';

function attachDocs(event) {
  const ed = db.event_documents.filter(d => d.event_id === event.id);
  const docs = ed.map(e => {
    const doc = db.documents.find(d => d.id === e.document_id);
    return { ...doc, page_number: e.page_number };
  });
  return { ...event, documents: docs.length ? docs : null };
}

export async function getEventsForWell(wellId, filters = {}) {
  let evs = db.events.filter(e => e.well_id === parseInt(wellId));
  if (filters.event_type) evs = evs.filter(e => e.event_type === filters.event_type);
  if (filters.severity) evs = evs.filter(e => e.severity === filters.severity);
  if (filters.min_depth != null) evs = evs.filter(e => e.start_depth >= filters.min_depth);
  if (filters.max_depth != null) evs = evs.filter(e => e.start_depth <= filters.max_depth);
  return evs.map(attachDocs).sort((a, b) => a.start_depth - b.start_depth);
}

export async function getEventById(eventId) {
  const ev = db.events.find(e => e.id === parseInt(eventId));
  return ev ? attachDocs(ev) : null;
}
