import { db } from '../db/mockDb.js';

export async function getDrillingParameters(wellId, filters = {}) {
  let params = db.drilling_parameters.filter(p => p.well_id === parseInt(wellId));
  if (filters.start_depth != null) params = params.filter(p => p.depth >= filters.start_depth);
  if (filters.end_depth != null) params = params.filter(p => p.depth <= filters.end_depth);
  if (filters.start_time) params = params.filter(p => new Date(p.timestamp) >= new Date(filters.start_time));
  if (filters.end_time) params = params.filter(p => new Date(p.timestamp) <= new Date(filters.end_time));
  return params.sort((a, b) => a.depth - b.depth).slice(0, 2000);
}
