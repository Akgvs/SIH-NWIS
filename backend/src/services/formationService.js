import { db } from '../db/mockDb.js';

export async function getAllFormations() {
  return [...db.formations].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFormationsForWell(wellId) {
  return db.well_formations
    .filter(wf => wf.well_id === parseInt(wellId))
    .map(wf => {
      const f = db.formations.find(f => f.id === wf.formation_id);
      return { ...wf, formation_name: f.name, description: f.description };
    })
    .sort((a, b) => a.top_depth - b.top_depth);
}

export async function getFormationAtDepth(wellId, depth) {
  const forms = await getFormationsForWell(wellId);
  return forms.find(f => f.top_depth <= depth && f.bottom_depth >= depth) || null;
}
