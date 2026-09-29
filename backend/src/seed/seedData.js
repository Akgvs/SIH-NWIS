/**
 * NWIS Synthetic Seed Data
 * ========================
 * Generates realistic (but clearly synthetic) Oil India style data.
 * ~15 wells, 6 formations, ~200 events, thousands of drilling parameters.
 *
 * Well placement: Assam Basin area, clustered for nearby-well demo.
 * Critical zone: 2850–2920m has seeded mud loss, torque spike, stuck pipe
 * events across multiple wells — this drives the live alert demonstration.
 */

import { pool } from '../db/pool.js';

// ─────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────
const rnd = (min, max, dp = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dp));

const jitter = (val, range) => rnd(val - range, val + range);

function dateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────
// Wells — clustered around Assam Basin
// Centre: ~27.3°N, 95.3°E
// ─────────────────────────────────────────────────────────────────
const WELLS = [
  // Active well — the one we simulate drilling on
  { name: 'OIL-101', field: 'Assam Basin', status: 'ACTIVE',    lat: 27.4290, lon: 95.3410, spud: '2024-10-14', complete: null,       td: 3400 },
  // Historical wells clustered within 5–15km
  { name: 'OIL-103', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4665, lon: 95.3820, spud: '2021-03-05', complete: '2021-09-18', td: 3200 },
  { name: 'OIL-105', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4005, lon: 95.4120, spud: '2020-07-12', complete: '2021-02-20', td: 3150 },
  { name: 'OIL-107', field: 'Assam Basin', status: 'COMPLETED', lat: 27.3590, lon: 95.4490, spud: '2019-11-08', complete: '2020-06-15', td: 3100 },
  { name: 'OIL-098', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4020, lon: 95.3050, spud: '2018-04-22', complete: '2018-12-01', td: 2800 },
  { name: 'OIL-112', field: 'Assam Basin', status: 'COMPLETED', lat: 27.5120, lon: 95.2780, spud: '2022-06-30', complete: '2023-01-10', td: 2950 },
  { name: 'OIL-115', field: 'Assam Basin', status: 'SUSPENDED', lat: 27.3200, lon: 95.3780, spud: '2023-01-15', complete: null,       td: 2600 },
  { name: 'OIL-118', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4800, lon: 95.4650, spud: '2022-02-10', complete: '2022-11-05', td: 3300 },
  { name: 'OIL-120', field: 'Assam Basin', status: 'COMPLETED', lat: 27.3450, lon: 95.2410, spud: '2020-09-01', complete: '2021-05-20', td: 3050 },
  { name: 'OIL-122', field: 'Assam Basin', status: 'ABANDONED', lat: 27.5380, lon: 95.3990, spud: '2017-05-18', complete: '2017-08-22', td: 1800 },
  { name: 'OIL-125', field: 'Assam Basin', status: 'COMPLETED', lat: 27.2980, lon: 95.4780, spud: '2021-11-20', complete: '2022-07-14', td: 3180 },
  { name: 'OIL-128', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4540, lon: 95.2150, spud: '2019-08-03', complete: '2020-04-25', td: 3080 },
  { name: 'OIL-130', field: 'Assam Basin', status: 'COMPLETED', lat: 27.3780, lon: 95.5100, spud: '2023-04-12', complete: '2023-12-20', td: 3220 },
  { name: 'OIL-133', field: 'Assam Basin', status: 'ACTIVE',    lat: 27.5650, lon: 95.3200, spud: '2025-01-08', complete: null,       td: 3500 },
  { name: 'OIL-135', field: 'Assam Basin', status: 'COMPLETED', lat: 27.2550, lon: 95.3600, spud: '2022-09-18', complete: '2023-06-30', td: 3010 },
];

// ─────────────────────────────────────────────────────────────────
// Formations (Assam Basin style)
// ─────────────────────────────────────────────────────────────────
const FORMATIONS = [
  { name: 'Tipam Sandstone',     field: 'Assam Basin', desc: 'Upper Miocene fluvial sandstone. Generally good ROP, low risk.' },
  { name: 'Barail Sand',         field: 'Assam Basin', desc: 'Oligocene deltaic sandstone with interbedded shale. Formation pressure can be variable.' },
  { name: 'Barail Shale',        field: 'Assam Basin', desc: 'Oligocene shale sequence. Known for borehole instability and swelling.' },
  { name: 'Kopili Formation',    field: 'Assam Basin', desc: 'Eocene limestone and shale. High fracture gradient — mud loss risk zone.' },
  { name: 'Sylhet Limestone',    field: 'Assam Basin', desc: 'Eocene carbonate. Naturally fractured — significant mud loss events recorded.' },
  { name: 'Basement',            field: 'Assam Basin', desc: 'Pre-Cambrian basement. High torque, slow ROP, high WOB required.' },
];

// Formation depth ranges per well (same formation, different depths)
// Depth intervals shift ±200–400m between wells — realistic structural dip
const FORMATION_DEPTHS = {
  'OIL-101': [
    { f: 'Tipam Sandstone', top: 500,  bot: 1400 },
    { f: 'Barail Sand',     top: 1400, bot: 2100 },
    { f: 'Barail Shale',    top: 2100, bot: 2600 },
    { f: 'Kopili Formation',top: 2600, bot: 3050 },
    { f: 'Sylhet Limestone',top: 3050, bot: 3380 },
    { f: 'Basement',        top: 3380, bot: 3400 },
  ],
  'OIL-103': [
    { f: 'Tipam Sandstone', top: 480,  bot: 1350 },
    { f: 'Barail Sand',     top: 1350, bot: 2050 },
    { f: 'Barail Shale',    top: 2050, bot: 2520 },
    { f: 'Kopili Formation',top: 2520, bot: 2980 },
    { f: 'Sylhet Limestone',top: 2980, bot: 3180 },
    { f: 'Basement',        top: 3180, bot: 3200 },
  ],
  'OIL-105': [
    { f: 'Tipam Sandstone', top: 510,  bot: 1420 },
    { f: 'Barail Sand',     top: 1420, bot: 2130 },
    { f: 'Barail Shale',    top: 2130, bot: 2620 },
    { f: 'Kopili Formation',top: 2620, bot: 3060 },
    { f: 'Sylhet Limestone',top: 3060, bot: 3140 },
    { f: 'Basement',        top: 3140, bot: 3150 },
  ],
  'OIL-107': [
    { f: 'Tipam Sandstone', top: 460,  bot: 1310 },
    { f: 'Barail Sand',     top: 1310, bot: 2010 },
    { f: 'Barail Shale',    top: 2010, bot: 2490 },
    { f: 'Kopili Formation',top: 2490, bot: 2940 },
    { f: 'Sylhet Limestone',top: 2940, bot: 3090 },
    { f: 'Basement',        top: 3090, bot: 3100 },
  ],
  'OIL-098': [
    { f: 'Tipam Sandstone', top: 520,  bot: 1460 },
    { f: 'Barail Sand',     top: 1460, bot: 2180 },
    { f: 'Barail Shale',    top: 2180, bot: 2680 },
    { f: 'Kopili Formation',top: 2680, bot: 2780 },
    { f: 'Basement',        top: 2780, bot: 2800 },
  ],
  'OIL-112': [
    { f: 'Tipam Sandstone', top: 490,  bot: 1370 },
    { f: 'Barail Sand',     top: 1370, bot: 2080 },
    { f: 'Barail Shale',    top: 2080, bot: 2560 },
    { f: 'Kopili Formation',top: 2560, bot: 2930 },
    { f: 'Basement',        top: 2930, bot: 2950 },
  ],
  'OIL-115': [
    { f: 'Tipam Sandstone', top: 505,  bot: 1410 },
    { f: 'Barail Sand',     top: 1410, bot: 2100 },
    { f: 'Barail Shale',    top: 2100, bot: 2600 },
  ],
  'OIL-118': [
    { f: 'Tipam Sandstone', top: 475,  bot: 1330 },
    { f: 'Barail Sand',     top: 1330, bot: 2030 },
    { f: 'Barail Shale',    top: 2030, bot: 2510 },
    { f: 'Kopili Formation',top: 2510, bot: 2960 },
    { f: 'Sylhet Limestone',top: 2960, bot: 3280 },
    { f: 'Basement',        top: 3280, bot: 3300 },
  ],
  'OIL-120': [
    { f: 'Tipam Sandstone', top: 515,  bot: 1430 },
    { f: 'Barail Sand',     top: 1430, bot: 2140 },
    { f: 'Barail Shale',    top: 2140, bot: 2630 },
    { f: 'Kopili Formation',top: 2630, bot: 3030 },
    { f: 'Basement',        top: 3030, bot: 3050 },
  ],
  'OIL-122': [
    { f: 'Tipam Sandstone', top: 500,  bot: 1390 },
    { f: 'Barail Sand',     top: 1390, bot: 1800 },
  ],
  'OIL-125': [
    { f: 'Tipam Sandstone', top: 500,  bot: 1400 },
    { f: 'Barail Sand',     top: 1400, bot: 2100 },
    { f: 'Barail Shale',    top: 2100, bot: 2590 },
    { f: 'Kopili Formation',top: 2590, bot: 3050 },
    { f: 'Sylhet Limestone',top: 3050, bot: 3170 },
    { f: 'Basement',        top: 3170, bot: 3180 },
  ],
  'OIL-128': [
    { f: 'Tipam Sandstone', top: 488,  bot: 1360 },
    { f: 'Barail Sand',     top: 1360, bot: 2060 },
    { f: 'Barail Shale',    top: 2060, bot: 2540 },
    { f: 'Kopili Formation',top: 2540, bot: 2980 },
    { f: 'Basement',        top: 2980, bot: 3080 },
  ],
  'OIL-130': [
    { f: 'Tipam Sandstone', top: 495,  bot: 1385 },
    { f: 'Barail Sand',     top: 1385, bot: 2090 },
    { f: 'Barail Shale',    top: 2090, bot: 2580 },
    { f: 'Kopili Formation',top: 2580, bot: 3030 },
    { f: 'Sylhet Limestone',top: 3030, bot: 3210 },
    { f: 'Basement',        top: 3210, bot: 3220 },
  ],
  'OIL-133': [
    { f: 'Tipam Sandstone', top: 502,  bot: 1408 },
    { f: 'Barail Sand',     top: 1408, bot: 2108 },
    { f: 'Barail Shale',    top: 2108, bot: 2608 },
    { f: 'Kopili Formation',top: 2608, bot: 3058 },
    { f: 'Sylhet Limestone',top: 3058, bot: 3480 },
    { f: 'Basement',        top: 3480, bot: 3500 },
  ],
  'OIL-135': [
    { f: 'Tipam Sandstone', top: 498,  bot: 1395 },
    { f: 'Barail Sand',     top: 1395, bot: 2095 },
    { f: 'Barail Shale',    top: 2095, bot: 2585 },
    { f: 'Kopili Formation',top: 2585, bot: 2985 },
    { f: 'Basement',        top: 2985, bot: 3010 },
  ],
};

// ─────────────────────────────────────────────────────────────────
// Event templates — deliberately clustered at 2850–2920m
// ─────────────────────────────────────────────────────────────────
const CRITICAL_EVENTS = {
  'OIL-103': [
    { type: 'MUD_LOSS',    depth: 2862, sev: 'HIGH',     desc: 'Severe mud loss in Kopili Formation. Lost 45 bbl/hr.', mit: 'Deployed LCM pill (30 ppb CaCO3). Reduced ROP to 4 m/hr. Circulation controlled after 6 hrs.', outcome: 'Stabilised after LCM treatment. Formation sealed.' },
    { type: 'TORQUE_SPIKE',depth: 2875, sev: 'MEDIUM',   desc: 'Torque increased from 78 to 112 kN·m over 15-min period.', mit: 'Backed off WOB by 20%. Reciprocated string. Back-reamed 50m.', outcome: 'Torque normalised after back-ream.' },
    { type: 'STUCK_PIPE',  depth: 2891, sev: 'CRITICAL', desc: 'Differential sticking in fractured carbonate. 48-hr recovery operation.', mit: 'Spotted lubricant (300 bbl). Applied jar forces. Gradual release with tension.', outcome: 'Pipe freed after 48 hrs. Wiper trip performed.' },
    { type: 'GAS_SHOW',    depth: 2910, sev: 'MEDIUM',   desc: 'Background gas increased to 8.5%. Mud gas separator activated.', mit: 'Increased mud weight to 1.22 SG. Flow check performed — well static.', outcome: 'Gas show reduced. Drilling resumed with heavier mud.' },
    { type: 'KICK',        depth: 2950, sev: 'HIGH',     desc: 'Estimated 10-bbl kick detected. Pit gain observed.', mit: 'Shut-in BOP. Circulate-and-weight method. Kill mud 1.26 SG applied.', outcome: 'Well killed successfully. Formation isolated.' },
    { type: 'NPT',         depth: 3010, sev: 'LOW',      desc: 'Bit wear — pulled out of hole for bit change.', mit: 'Routine bit change (PDC to TCI for harder formation).', outcome: 'New bit run. ROP improved.' },
    { type: 'MUD_LOSS',    depth: 3080, sev: 'MEDIUM',   desc: 'Partial mud loss in Sylhet Limestone. 18 bbl/hr.', mit: 'Bridging agent added to mud system.', outcome: 'Loss reduced to seepage levels.' },
  ],
  'OIL-107': [
    { type: 'MUD_LOSS',    depth: 2855, sev: 'HIGH',     desc: 'Total lost circulation in fractured Kopili Formation.', mit: 'Blind drilling with water-based mud. LCM squeeze applied.', outcome: 'Circulation restored after squeeze.' },
    { type: 'TORQUE_SPIKE',depth: 2870, sev: 'HIGH',     desc: 'Sustained high torque — 105 kN·m for 2 hrs.', mit: 'Reduced WOB to 8 tonnes. Increased RPM. Wiper trip run.', outcome: 'Formation change confirmed. Drilled ahead with modified parameters.' },
    { type: 'STUCK_PIPE',  depth: 2885, sev: 'HIGH',     desc: 'Tight hole — overpull of 40 tonnes on trips.', mit: 'Reamed to bottom. Increased mud weight. Kept string moving.', outcome: 'No further sticking after parameter adjustment.' },
    { type: 'FORMATION_PRESSURE', depth: 2920, sev: 'HIGH', desc: 'Abnormal pore pressure detected. D-exponent trend reversal.', mit: 'Increased mud weight from 1.18 to 1.22 SG incrementally.', outcome: 'Pressure controlled. Drilled ahead safely.' },
  ],
  'OIL-118': [
    { type: 'MUD_LOSS',    depth: 2870, sev: 'CRITICAL', desc: 'Complete lost circulation — no returns for 4 hrs.', mit: 'Set cement plug. Sidetrack drilled.', outcome: 'Sidetrack successful. Production casing set.' },
    { type: 'TORQUE_SPIKE',depth: 2880, sev: 'MEDIUM',   desc: 'Torque spike to 98 kN·m during connection.', mit: 'Worked string before each connection. Mud programme adjusted.', outcome: 'Managed successfully with modified procedure.' },
    { type: 'STUCK_PIPE',  depth: 2895, sev: 'CRITICAL', desc: 'Severe differential sticking. 72-hr recovery.', mit: 'Chemical cutter deployed at 72 hrs. Fishing BHA used.', outcome: 'Partial recovery. Well sidetracked.' },
    { type: 'KICK',        depth: 2970, sev: 'CRITICAL', desc: '25-bbl kick. Rapid pit gain.', mit: 'Emergency shut-in. Well killed with 1.28 SG mud.', outcome: 'Well killed. Formation integrity test run.' },
  ],
  'OIL-105': [
    { type: 'MUD_LOSS',    depth: 2860, sev: 'MEDIUM',   desc: 'Partial mud loss — 22 bbl/hr in Kopili fracture zone.', mit: 'Nut shell LCM added at 40 ppb. ROP reduced.', outcome: 'Losses reduced to acceptable level.' },
    { type: 'GAS_SHOW',    depth: 2900, sev: 'LOW',      desc: 'C1-C4 gas show — background gas 3.2%.', mit: 'Increased monitoring frequency. Mud weight maintained.', outcome: 'Gas show subsided at 2930m.' },
    { type: 'NPT',         depth: 2940, sev: 'LOW',      desc: 'Downhole tool failure. MWD lost signal.', mit: 'Pulled out of hole. MWD tool replaced.', outcome: 'Drilling resumed after 18-hr delay.' },
  ],
  'OIL-112': [
    { type: 'MUD_LOSS',    depth: 2780, sev: 'MEDIUM',   desc: 'Mud loss in Barail Shale fractures.', mit: 'LCM treatment. Mud weight reduced from 1.18 to 1.16 SG.', outcome: 'Losses stopped after reducing mud weight.' },
    { type: 'TORQUE_SPIKE',depth: 2850, sev: 'MEDIUM',   desc: 'Gradual torque increase in Kopili transition zone.', mit: 'Lubricant spotting. Back-reamed 30m.', outcome: 'Torque normalised. Formation change at 2860m.' },
    { type: 'CEMENTING_ISSUE', depth: 2900, sev: 'MEDIUM', desc: 'Short cement — did not reach planned TOC.', mit: 'Remedial cement squeeze job performed.', outcome: 'Zonal isolation confirmed by CBL log.' },
  ],
  'OIL-120': [
    { type: 'TORQUE_SPIKE',depth: 2865, sev: 'MEDIUM',   desc: 'Erratic torque in carbonate section.', mit: 'Modified BHA — added agitator tool.', outcome: 'Torque stabilised with new BHA.' },
    { type: 'STUCK_PIPE',  depth: 2880, sev: 'MEDIUM',   desc: 'Mechanical sticking after connection.', mit: 'Jarring operations. Spotted lubricant.', outcome: 'Freed after 8 hrs.' },
  ],
  'OIL-125': [
    { type: 'MUD_LOSS',    depth: 2858, sev: 'HIGH',     desc: 'Total mud loss at top of Sylhet Limestone.', mit: 'Pumped LCM blend. Set shallow cement plug.', outcome: 'Sealed with cement. Resumed drilling.' },
    { type: 'FORMATION_PRESSURE', depth: 2910, sev: 'MEDIUM', desc: 'Pore pressure ramp in overpressured shale.', mit: 'Incremental mud weight increase.', outcome: 'Safely drilled through with adjusted programme.' },
  ],
  'OIL-128': [
    { type: 'TORQUE_SPIKE',depth: 2870, sev: 'HIGH',     desc: 'String torque exceeded drawworks limit. Emergency stop.', mit: 'Tripped out. Changed to PDC bit with gauge protection.', outcome: 'Torque within limits after bit change.' },
    { type: 'NPT',         depth: 2890, sev: 'LOW',      desc: 'Washout detected in drill string. Pulled out of hole.', mit: 'Inspected and replaced damaged joints.', outcome: 'Drilling resumed after inspection.' },
  ],
  'OIL-130': [
    { type: 'KICK',        depth: 2875, sev: 'HIGH',     desc: '12-bbl kick in Kopili fractured zone.', mit: 'Shut-in. Driller\'s method applied. Kill mud weight 1.24 SG.', outcome: 'Well killed. Barrier confirmed.' },
    { type: 'MUD_LOSS',    depth: 2895, sev: 'HIGH',     desc: 'Severe partial loss — 38 bbl/hr.', mit: 'Bentonite-diesel-cement (BDC) plug squeezed.', outcome: 'Loss reduced to 5 bbl/hr. Drilled ahead.' },
  ],
  'OIL-135': [
    { type: 'MUD_LOSS',    depth: 2830, sev: 'LOW',      desc: 'Minor seepage loss in Barail Shale.', mit: 'Added fibre LCM to mud system.', outcome: 'Losses negligible. No operation change.' },
    { type: 'STUCK_PIPE',  depth: 2870, sev: 'MEDIUM',   desc: 'Key-seat sticking at dogleg.', mit: 'Rotated string out of key-seat. Performed reaming run.', outcome: 'Key-seat reamed. Packed-off BHA changed.' },
  ],
};

// General non-critical events for other wells (shallower, less severe)
function generalEvents(wellName, td) {
  const evs = [];
  const shallowDepths = [800, 1200, 1500, 1800, 2200];
  const types = ['NPT', 'CEMENTING_ISSUE', 'GAS_SHOW', 'FORMATION_PRESSURE'];
  const sevs  = ['LOW', 'LOW', 'MEDIUM'];
  for (let i = 0; i < 3; i++) {
    const depth = shallowDepths[i] + rnd(-50, 50);
    evs.push({
      type: types[i % types.length],
      depth: Math.min(depth, td - 50),
      sev: sevs[i % sevs.length],
      desc: `Routine ${types[i % types.length].toLowerCase().replace('_', ' ')} during drilling at ${depth.toFixed(0)}m.`,
      mit: 'Standard operating procedure followed. Parameters adjusted.',
      outcome: 'Resolved without significant NPT.',
    });
  }
  return evs;
}

// ─────────────────────────────────────────────────────────────────
// Drilling parameter generation
// ─────────────────────────────────────────────────────────────────
function generateDrillingParams(wellId, startDepth, endDepth, startDate) {
  const params = [];
  const step = 10; // every 10m
  let depth = startDepth;
  let t = new Date(startDate);

  while (depth <= endDepth) {
    const rop = Math.max(2, 18 - (depth - 500) * 0.003 + (Math.random() - 0.5) * 4);
    const wob = 14 + (depth / 1000) * 2 + (Math.random() - 0.5) * 2;
    const rpm = 110 + (Math.random() - 0.5) * 20;
    const torque = 65 + (depth / 1000) * 8 + (Math.random() - 0.5) * 10;
    const spp  = 1800 + (depth * 0.1) + (Math.random() - 0.5) * 100;
    const fr   = 450 + (Math.random() - 0.5) * 20;
    const mw   = depth > 2600 ? 1.18 : 1.14 + (depth / 10000);
    const ecd  = mw + 0.025 + (Math.random() - 0.5) * 0.01;

    // Torque spike at the critical zone
    const finalTorque = (depth >= 2850 && depth <= 2920) ? torque + 18 : torque;

    params.push({
      well_id: wellId,
      timestamp: t.toISOString(),
      depth: parseFloat(depth.toFixed(1)),
      rop: parseFloat(rop.toFixed(2)),
      wob: parseFloat(wob.toFixed(2)),
      rpm: parseFloat(rpm.toFixed(1)),
      torque: parseFloat(finalTorque.toFixed(2)),
      spp: parseFloat(spp.toFixed(1)),
      flow_rate: parseFloat(fr.toFixed(1)),
      mud_weight: parseFloat(mw.toFixed(4)),
      ecd: parseFloat(ecd.toFixed(4)),
    });

    depth += step;
    // Advance time: time to drill 10m = (10/rop)*60 minutes
    const minutesDelta = (step / rop) * 60;
    t = new Date(t.getTime() + minutesDelta * 60 * 1000);
  }
  return params;
}

// ─────────────────────────────────────────────────────────────────
// Trajectory
// ─────────────────────────────────────────────────────────────────
function generateTrajectory(wellId, lat, lon, td) {
  const points = [];
  let md = 0;
  let inc = 0;
  let az = 45 + Math.random() * 90; // random azimuth per well
  let curLat = lat;
  let curLon = lon;

  while (md <= td) {
    // Gradually increase inclination from vertical to ~15°
    if (md > 500 && inc < 15) inc += 0.3;
    const tvd = md * Math.cos((inc * Math.PI) / 180);
    const hDisp = md * Math.sin((inc * Math.PI) / 180);
    const latOff = (hDisp * Math.cos((az * Math.PI) / 180)) / 111320;
    const lonOff = (hDisp * Math.sin((az * Math.PI) / 180)) / (111320 * Math.cos((lat * Math.PI) / 180));

    points.push({
      well_id: wellId,
      measured_depth: parseFloat(md.toFixed(1)),
      true_vertical_depth: parseFloat(tvd.toFixed(1)),
      latitude: parseFloat((lat + latOff).toFixed(6)),
      longitude: parseFloat((lon + lonOff).toFixed(6)),
      inclination: parseFloat(inc.toFixed(2)),
      azimuth: parseFloat(az.toFixed(2)),
    });
    md += 100;
    az += (Math.random() - 0.5) * 2;
  }
  return points;
}

// ─────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────
const DOC_TYPES = ['DDR', 'WCR', 'MUD_REPORT', 'CEMENTING_REPORT'];
function makeDocName(well, type, date) {
  return `${well}_${type}_${date.replace(/-/g, '')}.pdf`;
}

// ─────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting NWIS seed...');
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM event_documents');
    await client.query('DELETE FROM events');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM drilling_parameters');
    await client.query('DELETE FROM well_formations');
    await client.query('DELETE FROM well_trajectory');
    await client.query('DELETE FROM formations');
    await client.query('DELETE FROM wells');

    // ── 1. Insert Formations ────────────────────────────────────
    const formationIds = {};
    for (const f of FORMATIONS) {
      const res = await client.query(
        `INSERT INTO formations (name, field, description) VALUES ($1,$2,$3) RETURNING id`,
        [f.name, f.field, f.desc]
      );
      formationIds[f.name] = res.rows[0].id;
    }
    console.log(`  ✓ ${FORMATIONS.length} formations`);

    // ── 2. Insert Wells ─────────────────────────────────────────
    const wellIds = {};
    for (const w of WELLS) {
      const locationWKT = `SRID=4326;POINT(${w.lon} ${w.lat})`;
      const res = await client.query(
        `INSERT INTO wells (well_name, field, status, latitude, longitude, location, spud_date, completion_date, total_depth)
         VALUES ($1,$2,$3,$4,$5,ST_GeogFromText($6),$7,$8,$9) RETURNING id`,
        [w.name, w.field, w.status, w.lat, w.lon, locationWKT, w.spud, w.complete, w.td]
      );
      wellIds[w.name] = res.rows[0].id;
    }
    console.log(`  ✓ ${WELLS.length} wells`);

    // ── 3. Trajectories ─────────────────────────────────────────
    let trajCount = 0;
    for (const w of WELLS) {
      const points = generateTrajectory(wellIds[w.name], w.lat, w.lon, w.td);
      for (const p of points) {
        await client.query(
          `INSERT INTO well_trajectory (well_id,measured_depth,true_vertical_depth,latitude,longitude,inclination,azimuth)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [p.well_id, p.measured_depth, p.true_vertical_depth, p.latitude, p.longitude, p.inclination, p.azimuth]
        );
      }
      trajCount += points.length;
    }
    console.log(`  ✓ ${trajCount} trajectory points`);

    // ── 4. Well Formations ──────────────────────────────────────
    let wfCount = 0;
    for (const w of WELLS) {
      const intervals = FORMATION_DEPTHS[w.name] || [];
      for (const interval of intervals) {
        const fid = formationIds[interval.f];
        if (!fid) continue;
        await client.query(
          `INSERT INTO well_formations (well_id, formation_id, top_depth, bottom_depth)
           VALUES ($1,$2,$3,$4)`,
          [wellIds[w.name], fid, interval.top, interval.bot]
        );
        wfCount++;
      }
    }
    console.log(`  ✓ ${wfCount} well-formation intervals`);

    // ── 5. Documents ────────────────────────────────────────────
    const docIds = {}; // docIds[wellName] = [id1, id2, ...]
    let docCount = 0;
    for (const w of WELLS) {
      if (w.status === 'ACTIVE') continue; // active wells don't have completed reports
      docIds[w.name] = [];
      const types = DOC_TYPES;
      for (let i = 0; i < types.length; i++) {
        const docDate = addDays(w.spud, 30 + i * 15);
        const docName = makeDocName(w.name, types[i], docDate);
        const res = await client.query(
          `INSERT INTO documents (well_id, document_type, document_name, document_path, document_date)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [wellIds[w.name], types[i], docName, `/docs/${w.name}/${docName}`, docDate]
        );
        docIds[w.name].push(res.rows[0].id);
        docCount++;
      }
    }
    console.log(`  ✓ ${docCount} documents`);

    // ── 6. Events ───────────────────────────────────────────────
    let evCount = 0;
    const allEventIds = {};

    // Critical seeded events
    for (const [wellName, events] of Object.entries(CRITICAL_EVENTS)) {
      const wid = wellIds[wellName];
      if (!wid) continue;
      allEventIds[wellName] = [];
      for (const ev of events) {
        const res = await client.query(
          `INSERT INTO events (well_id, event_type, start_depth, end_depth, severity, description, mitigation, outcome, event_time)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - INTERVAL '${Math.floor(Math.random() * 730)} days') RETURNING id`,
          [wid, ev.type, ev.depth, ev.depth + rnd(5, 30), ev.sev, ev.desc, ev.mit, ev.outcome]
        );
        allEventIds[wellName].push(res.rows[0].id);
        evCount++;
      }
    }

    // General events for remaining wells
    for (const w of WELLS) {
      if (CRITICAL_EVENTS[w.name]) continue;
      const wid = wellIds[w.name];
      const events = generalEvents(w.name, w.td);
      allEventIds[w.name] = [];
      for (const ev of events) {
        const res = await client.query(
          `INSERT INTO events (well_id, event_type, start_depth, end_depth, severity, description, mitigation, outcome, event_time)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - INTERVAL '${Math.floor(Math.random() * 730)} days') RETURNING id`,
          [wid, ev.type, ev.depth, ev.depth + rnd(5, 25), ev.sev, ev.desc, ev.mit, ev.outcome]
        );
        allEventIds[w.name].push(res.rows[0].id);
        evCount++;
      }
    }
    console.log(`  ✓ ${evCount} events`);

    // ── 7. Event ↔ Documents ────────────────────────────────────
    let edCount = 0;
    for (const [wellName, eventIds] of Object.entries(allEventIds)) {
      const docs = docIds[wellName] || [];
      if (docs.length === 0) continue;
      for (let i = 0; i < eventIds.length; i++) {
        const docId = docs[i % docs.length];
        const page = Math.floor(Math.random() * 80) + 5;
        await client.query(
          `INSERT INTO event_documents (event_id, document_id, page_number) VALUES ($1,$2,$3)`,
          [eventIds[i], docId, page]
        );
        edCount++;
      }
    }
    console.log(`  ✓ ${edCount} event-document links`);

    // ── 8. Drilling Parameters ──────────────────────────────────
    let dpCount = 0;
    for (const w of WELLS) {
      if (w.status === 'ACTIVE') continue; // active well gets live data via WebSocket
      const startDepth = 500;
      const endDepth = w.td;
      const params = generateDrillingParams(wellIds[w.name], startDepth, endDepth, w.spud);
      // Batch insert for performance
      const BATCH = 100;
      for (let i = 0; i < params.length; i += BATCH) {
        const batch = params.slice(i, i + BATCH);
        const values = batch.map((p, idx) => {
          const base = idx * 10;
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10})`;
        }).join(',');
        const flat = batch.flatMap(p => [
          p.well_id, p.timestamp, p.depth, p.rop, p.wob, p.rpm, p.torque, p.spp, p.flow_rate, p.mud_weight,
        ]);
        // Insert with ecd separately since we have 11 columns
        for (const p of batch) {
          await client.query(
            `INSERT INTO drilling_parameters (well_id,timestamp,depth,rop,wob,rpm,torque,spp,flow_rate,mud_weight,ecd)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [p.well_id, p.timestamp, p.depth, p.rop, p.wob, p.rpm, p.torque, p.spp, p.flow_rate, p.mud_weight, p.ecd]
          );
        }
        dpCount += batch.length;
      }
    }
    console.log(`  ✓ ${dpCount} drilling parameter records`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
