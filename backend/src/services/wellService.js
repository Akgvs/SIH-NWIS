import { db } from '../db/mockDb.js';

function haversine(lat1, lon1, lat2, lon2) {
  const p = Math.PI / 180, c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); 
}

export async function getAllWells() {
  return [...db.wells].sort((a, b) => a.well_name.localeCompare(b.well_name));
}

export async function getWellById(id) {
  return db.wells.find(w => w.id === parseInt(id)) || null;
}

export async function createWell(data) {
  const newWell = { id: db.wells.length + 1, ...data };
  db.wells.push(newWell);
  return newWell;
}

export async function getNearbyWells(wellId, radiusKm) {
  const ref = await getWellById(wellId);
  if (!ref) return [];
  return db.wells
    .filter(w => w.id !== ref.id)
    .map(w => ({ ...w, distance_km: haversine(w.latitude, w.longitude, ref.latitude, ref.longitude).toFixed(3) }))
    .filter(w => parseFloat(w.distance_km) <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

export async function getWellTrajectory(wellId) {
  return db.well_trajectory
    .filter(t => t.well_id === parseInt(wellId))
    .sort((a, b) => a.measured_depth - b.measured_depth);
}
