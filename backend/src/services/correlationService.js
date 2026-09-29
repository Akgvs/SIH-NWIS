/**
 * Depth & Formation Correlation Engine
 * ======================================
 * Deterministic scoring — no ML/AI.
 */

import { db } from '../db/mockDb.js';
import { getNearbyWells } from './wellService.js';
import { getFormationAtDepth } from './formationService.js';

const SCORE = {
  SAME_FORMATION:        50,
  DEPTH_WITHIN_10:       40,
  DEPTH_WITHIN_25:       25,
  DEPTH_WITHIN_50:       10,
  WELL_WITHIN_5KM:       20,
  WELL_WITHIN_10KM:      10,
  REL_DEPTH_WITHIN_20:   30,
  REL_DEPTH_WITHIN_50:   15,
};

function scoreEvent({ eventDepth, currentDepth, currentFormationId, offsetFormationId,
                       currentFormationTop, offsetFormationTop, distanceKm }) {
  let sameFormation = 0, depthProximity = 0, wellDistance = 0;
  const details = [];

  if (currentFormationId && offsetFormationId && currentFormationId === offsetFormationId) {
    sameFormation = SCORE.SAME_FORMATION; details.push(`Same formation (+${SCORE.SAME_FORMATION})`);
  }

  const absDiff = Math.abs(currentDepth - eventDepth);
  if (absDiff <= 10) { depthProximity = SCORE.DEPTH_WITHIN_10; details.push(`Depth diff ${absDiff.toFixed(1)}m ≤ 10m (+${SCORE.DEPTH_WITHIN_10})`); }
  else if (absDiff <= 25) { depthProximity = SCORE.DEPTH_WITHIN_25; details.push(`Depth diff ${absDiff.toFixed(1)}m ≤ 25m (+${SCORE.DEPTH_WITHIN_25})`); }
  else if (absDiff <= 50) { depthProximity = SCORE.DEPTH_WITHIN_50; details.push(`Depth diff ${absDiff.toFixed(1)}m ≤ 50m (+${SCORE.DEPTH_WITHIN_50})`); }

  if (currentFormationTop != null && offsetFormationTop != null) {
    const currentRel = currentDepth - currentFormationTop;
    const eventRel   = eventDepth   - offsetFormationTop;
    const relDiff    = Math.abs(currentRel - eventRel);
    if (relDiff <= 20) { depthProximity = Math.min(depthProximity + SCORE.REL_DEPTH_WITHIN_20, 70); details.push(`Same rel. formation depth ${relDiff.toFixed(1)}m ≤ 20m (+${SCORE.REL_DEPTH_WITHIN_20})`); }
    else if (relDiff <= 50) { depthProximity = Math.min(depthProximity + SCORE.REL_DEPTH_WITHIN_50, 70); details.push(`Same rel. formation depth ${relDiff.toFixed(1)}m ≤ 50m (+${SCORE.REL_DEPTH_WITHIN_50})`); }
  }

  if (distanceKm <= 5) { wellDistance = SCORE.WELL_WITHIN_5KM; details.push(`Well ${distanceKm.toFixed(1)}km ≤ 5km (+${SCORE.WELL_WITHIN_5KM})`); }
  else if (distanceKm <= 10) { wellDistance = SCORE.WELL_WITHIN_10KM; details.push(`Well ${distanceKm.toFixed(1)}km ≤ 10km (+${SCORE.WELL_WITHIN_10KM})`); }

  const total = sameFormation + depthProximity + wellDistance;
  return { total, sameFormation, depthProximity, wellDistance, details };
}

function attachDocs(event) {
  const ed = db.event_documents.filter(d => d.event_id === event.id);
  const docs = ed.map(e => {
    const doc = db.documents.find(d => d.id === e.document_id);
    return { ...doc, page_number: e.page_number };
  });
  return { ...event, documents: docs.length ? docs : null };
}

export async function correlateDepthWithNearbyEvents({
  activeWellId, currentDepth, radiusKm = 10, depthWindow = 50, minScore = 10,
}) {
  const currentWf = await getFormationAtDepth(activeWellId, currentDepth);
  const currentFormationId  = currentWf?.formation_id  ?? null;
  const currentFormationTop = currentWf?.top_depth     ?? null;

  const nearbyWells = await getNearbyWells(activeWellId, radiusKm);
  const scored = [];

  for (const nearbyWell of nearbyWells) {
    const distanceKm = parseFloat(nearbyWell.distance_km);

    const events = db.events
      .filter(e => e.well_id === nearbyWell.id && e.start_depth >= currentDepth - depthWindow && e.start_depth <= currentDepth + depthWindow)
      .map(attachDocs);

    for (const event of events) {
      let offsetFormationId = null, offsetFormationTop = null;
      if (currentFormationId) {
        const offsetWf = db.well_formations.find(wf => wf.well_id === nearbyWell.id && wf.formation_id === currentFormationId);
        if (offsetWf) { offsetFormationId = offsetWf.formation_id; offsetFormationTop = parseFloat(offsetWf.top_depth); }
      }

      const explanation = scoreEvent({
        eventDepth: parseFloat(event.start_depth), currentDepth, currentFormationId, offsetFormationId,
        currentFormationTop, offsetFormationTop, distanceKm,
      });

      if (explanation.total >= minScore) {
        scored.push({
          event, wellName: nearbyWell.well_name, wellId: nearbyWell.id, distanceKm,
          score: explanation.total, explanation,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
