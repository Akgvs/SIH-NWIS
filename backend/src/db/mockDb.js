/**
 * NWIS Synthetic Seed Data (In-Memory Database)
 * Generates realistic Oil India style data synchronously on startup.
 */

const rnd = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));
function addDays(dateStr, days) {
  const d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0];
}

const WELLS = [
  { name: 'OIL-101', field: 'Assam Basin', status: 'ACTIVE',    lat: 27.4290, lon: 95.3410, spud: '2024-10-14', complete: null,       td: 3400 },
  { name: 'OIL-103', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4665, lon: 95.3820, spud: '2021-03-05', complete: '2021-09-18', td: 3200 },
  { name: 'OIL-105', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4005, lon: 95.4120, spud: '2020-07-12', complete: '2021-02-20', td: 3150 },
  { name: 'OIL-107', field: 'Assam Basin', status: 'COMPLETED', lat: 27.3590, lon: 95.4490, spud: '2019-11-08', complete: '2020-06-15', td: 3100 },
  { name: 'OIL-098', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4020, lon: 95.3050, spud: '2018-04-22', complete: '2018-12-01', td: 2800 },
  { name: 'OIL-112', field: 'Assam Basin', status: 'COMPLETED', lat: 27.5120, lon: 95.2780, spud: '2022-06-30', complete: '2023-01-10', td: 2950 },
  { name: 'OIL-115', field: 'Assam Basin', status: 'SUSPENDED', lat: 27.3200, lon: 95.3780, spud: '2023-01-15', complete: null,       td: 2600 },
  { name: 'OIL-118', field: 'Assam Basin', status: 'COMPLETED', lat: 27.4800, lon: 95.4650, spud: '2022-02-10', complete: '2022-11-05', td: 3300 },
  { name: 'OIL-120', field: 'Assam Basin', status: 'COMPLETED', lat: 27.3450, lon: 95.2410, spud: '2020-09-01', complete: '2021-05-20', td: 3050 },
];

const FORMATIONS = [
  { name: 'Tipam Sandstone', field: 'Assam Basin', desc: 'Upper Miocene fluvial sandstone.' },
  { name: 'Barail Sand',     field: 'Assam Basin', desc: 'Oligocene deltaic sandstone.' },
  { name: 'Barail Shale',    field: 'Assam Basin', desc: 'Oligocene shale sequence.' },
  { name: 'Kopili Formation',field: 'Assam Basin', desc: 'Eocene limestone and shale.' },
  { name: 'Sylhet Limestone',field: 'Assam Basin', desc: 'Eocene carbonate. Naturally fractured.' },
  { name: 'Basement',        field: 'Assam Basin', desc: 'Pre-Cambrian basement.' },
];

const FORMATION_DEPTHS = {
  'OIL-101': [ { f: 'Tipam Sandstone', top: 500, bot: 1400 }, { f: 'Barail Sand', top: 1400, bot: 2100 }, { f: 'Barail Shale', top: 2100, bot: 2600 }, { f: 'Kopili Formation', top: 2600, bot: 3050 }, { f: 'Sylhet Limestone', top: 3050, bot: 3380 }, { f: 'Basement', top: 3380, bot: 3400 } ],
  'OIL-103': [ { f: 'Tipam Sandstone', top: 480, bot: 1350 }, { f: 'Barail Sand', top: 1350, bot: 2050 }, { f: 'Barail Shale', top: 2050, bot: 2520 }, { f: 'Kopili Formation', top: 2520, bot: 2980 }, { f: 'Sylhet Limestone', top: 2980, bot: 3180 }, { f: 'Basement', top: 3180, bot: 3200 } ],
  'OIL-105': [ { f: 'Tipam Sandstone', top: 510, bot: 1420 }, { f: 'Barail Sand', top: 1420, bot: 2130 }, { f: 'Barail Shale', top: 2130, bot: 2620 }, { f: 'Kopili Formation', top: 2620, bot: 3060 }, { f: 'Sylhet Limestone', top: 3060, bot: 3140 }, { f: 'Basement', top: 3140, bot: 3150 } ],
  'OIL-107': [ { f: 'Tipam Sandstone', top: 460, bot: 1310 }, { f: 'Barail Sand', top: 1310, bot: 2010 }, { f: 'Barail Shale', top: 2010, bot: 2490 }, { f: 'Kopili Formation', top: 2490, bot: 2940 }, { f: 'Sylhet Limestone', top: 2940, bot: 3090 }, { f: 'Basement', top: 3090, bot: 3100 } ],
  'OIL-098': [ { f: 'Tipam Sandstone', top: 520, bot: 1460 }, { f: 'Barail Sand', top: 1460, bot: 2180 }, { f: 'Barail Shale', top: 2180, bot: 2680 }, { f: 'Kopili Formation', top: 2680, bot: 2780 }, { f: 'Basement', top: 2780, bot: 2800 } ],
  'OIL-112': [ { f: 'Tipam Sandstone', top: 490, bot: 1370 }, { f: 'Barail Sand', top: 1370, bot: 2080 }, { f: 'Barail Shale', top: 2080, bot: 2560 }, { f: 'Kopili Formation', top: 2560, bot: 2930 }, { f: 'Basement', top: 2930, bot: 2950 } ],
  'OIL-115': [ { f: 'Tipam Sandstone', top: 505, bot: 1410 }, { f: 'Barail Sand', top: 1410, bot: 2100 }, { f: 'Barail Shale', top: 2100, bot: 2600 } ],
  'OIL-118': [ { f: 'Tipam Sandstone', top: 475, bot: 1330 }, { f: 'Barail Sand', top: 1330, bot: 2030 }, { f: 'Barail Shale', top: 2030, bot: 2510 }, { f: 'Kopili Formation', top: 2510, bot: 2960 }, { f: 'Sylhet Limestone', top: 2960, bot: 3280 }, { f: 'Basement', top: 3280, bot: 3300 } ],
  'OIL-120': [ { f: 'Tipam Sandstone', top: 515, bot: 1430 }, { f: 'Barail Sand', top: 1430, bot: 2140 }, { f: 'Barail Shale', top: 2140, bot: 2630 }, { f: 'Kopili Formation', top: 2630, bot: 3030 }, { f: 'Basement', top: 3030, bot: 3050 } ],
};

const CRITICAL_EVENTS = {
  'OIL-103': [
    { type: 'MUD_LOSS',    depth: 2862, sev: 'HIGH',     desc: 'Severe mud loss in Kopili Formation.', mit: 'Deployed LCM pill.', outcome: 'Stabilised.' },
    { type: 'TORQUE_SPIKE',depth: 2875, sev: 'MEDIUM',   desc: 'Torque increased to 112 kN·m.', mit: 'Backed off WOB by 20%.', outcome: 'Torque normalised.' },
    { type: 'STUCK_PIPE',  depth: 2891, sev: 'CRITICAL', desc: 'Differential sticking in carbonate.', mit: 'Spotted lubricant.', outcome: 'Pipe freed.' },
  ],
  'OIL-107': [
    { type: 'MUD_LOSS',    depth: 2855, sev: 'HIGH',     desc: 'Total lost circulation in Kopili.', mit: 'Blind drilling with water-based mud.', outcome: 'Circulation restored.' },
    { type: 'TORQUE_SPIKE',depth: 2870, sev: 'HIGH',     desc: 'Sustained high torque.', mit: 'Reduced WOB to 8 tonnes.', outcome: 'Drilled ahead.' },
  ],
  'OIL-118': [
    { type: 'MUD_LOSS',    depth: 2870, sev: 'CRITICAL', desc: 'Complete lost circulation.', mit: 'Set cement plug. Sidetrack.', outcome: 'Sidetrack successful.' },
    { type: 'KICK',        depth: 2970, sev: 'CRITICAL', desc: '25-bbl kick.', mit: 'Emergency shut-in.', outcome: 'Well killed.' },
  ],
};

function generalEvents(td) {
  const evs = [];
  const types = ['NPT', 'CEMENTING_ISSUE', 'GAS_SHOW'];
  for (let i = 0; i < 2; i++) {
    evs.push({
      type: types[i], depth: 1500 + i*500, sev: 'LOW',
      desc: 'Routine issue.', mit: 'Parameters adjusted.', outcome: 'Resolved.',
    });
  }
  return evs;
}

export const db = {
  wells: [],
  formations: [],
  well_formations: [],
  documents: [],
  events: [],
  event_documents: [],
  drilling_parameters: [],
  well_trajectory: [],
};

// Seed logic runs on import
let wId = 1, fId = 1, wfId = 1, dId = 1, eId = 1;

for (const f of FORMATIONS) db.formations.push({ id: fId++, ...f });

for (const w of WELLS) {
  const well = {
    id: wId++, well_name: w.name, field: w.field, status: w.status,
    latitude: w.lat, longitude: w.lon, spud_date: w.spud,
    completion_date: w.complete, total_depth: w.td
  };
  db.wells.push(well);

  // Formations
  for (const wf of FORMATION_DEPTHS[w.name] || []) {
    const formation = db.formations.find(f => f.name === wf.f);
    if (formation) {
      db.well_formations.push({ id: wfId++, well_id: well.id, formation_id: formation.id, top_depth: wf.top, bottom_depth: wf.bot });
    }
  }

  // Events
  let evs = CRITICAL_EVENTS[w.name] || generalEvents(w.td);
  for (const e of evs) {
    db.events.push({
      id: eId++, well_id: well.id, event_type: e.type, start_depth: e.depth, end_depth: e.depth + 10,
      severity: e.sev, description: e.desc, mitigation: e.mit, outcome: e.outcome,
      event_time: new Date(Date.now() - rnd(10, 100) * 86400000).toISOString()
    });
  }

  // Simple parameters (only a few for chart to not bloat memory too much)
  const endDepth = w.status === 'ACTIVE' ? 2800 : w.td;
  for (let depth = 2000; depth <= endDepth; depth += 20) {
      db.drilling_parameters.push({
        well_id: well.id, depth, timestamp: new Date().toISOString(),
        rop: rnd(5, 15), wob: rnd(10, 20), rpm: rnd(90, 120), torque: (depth >= 2850 && depth <= 2920) ? rnd(90, 110) : rnd(60, 80),
        spp: 2000, flow_rate: 450, mud_weight: 1.18, ecd: 1.20
      });
    }
  }
}

// Add a few documents
db.documents.push({ id: 1, well_id: 2, document_type: 'DDR', document_name: 'OIL-103_DDR.pdf', page_number: 12 });
db.event_documents.push({ event_id: 1, document_id: 1, page_number: 12 });

console.log('✅ In-memory mock database populated with dummy data.');
