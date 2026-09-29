/**
 * Rule-Based Alert Engine
 * ========================
 * Four deterministic rules — no ML/AI.
 */

import { config } from '../config.js';
import { db } from '../db/mockDb.js';
import { correlateDepthWithNearbyEvents } from './correlationService.js';
import { getFormationAtDepth } from './formationService.js';
import { getNearbyWells } from './wellService.js';

const SEV_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
function severityFromCount(n) { if (n >= 4) return 'CRITICAL'; if (n >= 3) return 'HIGH'; if (n >= 2) return 'MEDIUM'; return 'LOW'; }

function ruleHistoricalProximity(scoredEvents, currentDepth, depthWindow) {
  if (!scoredEvents.length) return null;
  const top = scoredEvents[0];
  const total = top.explanation.total;
  let severity = 'LOW';
  if (total >= 80) severity = 'CRITICAL';
  else if (total >= 60) severity = 'HIGH';
  else if (total >= 40) severity = 'MEDIUM';

  const relevant = scoredEvents.slice(0, 5).map(se => ({
    event_id:    se.event.id,
    well_id:     se.wellId,
    well_name:   se.wellName,
    event_type:  se.event.event_type,
    depth:       parseFloat(se.event.start_depth),
    severity:    se.event.severity,
    description: se.event.description,
    mitigation:  se.event.mitigation,
    distance_km: se.distanceKm,
    document_name: se.event.documents?.[0]?.document_name,
    page_number: se.event.documents?.[0]?.page_number
  }));

  return {
    alert_type: 'HISTORICAL_RISK', severity, title: 'Historical Risk Alert',
    message: `${scoredEvents.length} historical event(s) found within ±${depthWindow}m of current depth ${currentDepth.toFixed(0)}m. Highest relevance: ${top.event.event_type} at ${parseFloat(top.event.start_depth).toFixed(0)}m from ${top.wellName} (${top.distanceKm.toFixed(1)}km).`,
    current_depth: currentDepth, relevant_events: relevant, score: top.explanation,
    recommended_mitigation: top.event.mitigation,
  };
}

async function ruleFormationRisk(activeWellId, currentDepth, radiusKm) {
  const wf = await getFormationAtDepth(activeWellId, currentDepth);
  if (!wf) return null;

  const nearby = await getNearbyWells(activeWellId, radiusKm);
  if (!nearby.length) return null;
  const nearbyIds = nearby.map(w => w.id);

  const eventCounts = {};
  for (const ev of db.events) {
    if (nearbyIds.includes(ev.well_id)) {
      const wform = db.well_formations.find(f => f.well_id === ev.well_id && f.formation_id === wf.formation_id);
      if (wform && ev.start_depth >= wform.top_depth && ev.start_depth <= wform.bottom_depth) {
        eventCounts[ev.event_type] = (eventCounts[ev.event_type] || 0) + 1;
      }
    }
  }

  const rows = Object.entries(eventCounts).map(([type, cnt]) => ({ event_type: type, cnt })).sort((a,b) => b.cnt - a.cnt);
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + r.cnt, 0);
  if (total < 3) return null;

  const typeSummary = rows.map(r => `${r.event_type}: ${r.cnt}`).join(', ');
  return {
    alert_type: 'FORMATION_RISK', severity: severityFromCount(total), title: 'Formation Risk Alert',
    message: `Formation "${wf.formation_name}" has ${total} historical incidents across ${nearbyIds.length} nearby wells. Types: ${typeSummary}.`,
    current_depth: currentDepth, formation: wf.formation_name, relevant_events: [],
    recommended_mitigation: 'Increase monitoring frequency. Review formation-specific mud programme and weight schedule used in previous wells.',
  };
}

function ruleMultiWellCorrelation(scoredEvents, currentDepth, minWells = 2) {
  const byType = {};
  for (const se of scoredEvents) {
    const t = se.event.event_type;
    if (!byType[t]) byType[t] = [];
    byType[t].push(se);
  }

  const alerts = [];
  for (const [etype, events] of Object.entries(byType)) {
    const uniqueWells = new Set(events.map(e => e.wellId));
    if (uniqueWells.size < minWells) continue;
    const top = events[0];
    alerts.push({
      alert_type: 'MULTI_WELL_CORRELATION', severity: severityFromCount(uniqueWells.size), title: `Multi-Well Correlation: ${etype}`,
      message: `${uniqueWells.size} nearby wells experienced ${etype} within ±50m of current depth ${currentDepth.toFixed(0)}m. This is a confirmed high-risk interval.`,
      current_depth: currentDepth,
      relevant_events: events.slice(0, 5).map(se => ({
        event_id: se.event.id, well_id: se.wellId, well_name: se.wellName, event_type: se.event.event_type,
        depth: parseFloat(se.event.start_depth), severity: se.event.severity, description: se.event.description,
        mitigation: se.event.mitigation, distance_km: se.distanceKm,
      })),
      recommended_mitigation: top.event.mitigation,
    });
  }
  return alerts;
}

function ruleParameterThreshold(params, currentDepth) {
  if (!params) return [];
  const { torque, ecd, rop, prev_rop } = params;
  const alerts = [];

  if (torque >= config.alertTorqueThreshold) {
    alerts.push({
      alert_type: 'THRESHOLD_ALERT', severity: 'HIGH', title: 'Threshold Alert: High Torque',
      message: `Torque ${torque.toFixed(1)} kN·m exceeds threshold ${config.alertTorqueThreshold} kN·m at ${currentDepth.toFixed(0)}m. Historical evidence: torque spikes in this interval have preceded stuck-pipe events.`,
      current_depth: currentDepth, relevant_events: [], recommended_mitigation: 'Reduce WOB, back-ream if torque persists. Check for formation change.',
    });
  }

  if (ecd >= config.alertEcdThreshold) {
    alerts.push({
      alert_type: 'THRESHOLD_ALERT', severity: 'MEDIUM', title: 'Threshold Alert: ECD Elevated',
      message: `ECD ${ecd.toFixed(3)} SG exceeds threshold ${config.alertEcdThreshold} SG at ${currentDepth.toFixed(0)}m.`,
      current_depth: currentDepth, relevant_events: [], recommended_mitigation: 'Reduce flow rate and check annular loading. Review mud programme.',
    });
  }

  if (prev_rop != null && prev_rop > 0) {
    const drop = ((prev_rop - rop) / prev_rop) * 100;
    if (drop >= config.alertRopDropThreshold) {
      alerts.push({
        alert_type: 'THRESHOLD_ALERT', severity: 'MEDIUM', title: 'Threshold Alert: ROP Drop',
        message: `ROP dropped ${drop.toFixed(0)}% from ${prev_rop.toFixed(1)} to ${rop.toFixed(1)} m/hr at ${currentDepth.toFixed(0)}m.`,
        current_depth: currentDepth, relevant_events: [], recommended_mitigation: 'Check WOB, assess formation change, consider wiper trip.',
      });
    }
  }

  return alerts;
}

export async function runAlertEngine({ activeWellId, currentDepth, radiusKm = 10, currentParams = null }) {
  const depthWindow = config.alertDepthWindow;
  const scoredEvents = await correlateDepthWithNearbyEvents({ activeWellId, currentDepth, radiusKm, depthWindow });

  const alerts = [];
  const hist = ruleHistoricalProximity(scoredEvents, currentDepth, depthWindow);
  if (hist) alerts.push(hist);

  const form = await ruleFormationRisk(activeWellId, currentDepth, radiusKm);
  if (form) alerts.push(form);

  alerts.push(...ruleMultiWellCorrelation(scoredEvents, currentDepth));
  if (currentParams) alerts.push(...ruleParameterThreshold(currentParams, currentDepth));

  const seen = {};
  for (const a of alerts) {
    const key = `${a.alert_type}:${a.title}`;
    if (!seen[key] || SEV_ORDER[a.severity] > SEV_ORDER[seen[key].severity]) seen[key] = a;
  }
  return Object.values(seen);
}
