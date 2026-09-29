-- NWIS Database Schema
-- Requires: PostgreSQL + PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE well_status AS ENUM ('ACTIVE','COMPLETED','SUSPENDED','ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'MUD_LOSS','KICK','STUCK_PIPE','FISHING','TORQUE_SPIKE',
    'CEMENTING_ISSUE','FORMATION_PRESSURE','GAS_SHOW','NPT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE severity_level AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('WCR','DDR','MUD_REPORT','CEMENTING_REPORT','WELL_SURVEY','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────
-- WELLS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wells (
  id               SERIAL PRIMARY KEY,
  well_name        VARCHAR(100) UNIQUE NOT NULL,
  field            VARCHAR(100) NOT NULL,
  status           well_status NOT NULL DEFAULT 'ACTIVE',
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  location         GEOGRAPHY(POINT, 4326) NOT NULL,
  spud_date        DATE,
  completion_date  DATE,
  total_depth      DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS wells_location_idx ON wells USING GIST(location);

-- ─────────────────────────────────────────────────────────────────
-- WELL TRAJECTORY
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS well_trajectory (
  id                 SERIAL PRIMARY KEY,
  well_id            INTEGER NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
  measured_depth     DOUBLE PRECISION NOT NULL,
  true_vertical_depth DOUBLE PRECISION NOT NULL,
  latitude           DOUBLE PRECISION,
  longitude          DOUBLE PRECISION,
  inclination        DOUBLE PRECISION,
  azimuth            DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS traj_well_id_idx ON well_trajectory(well_id);

-- ─────────────────────────────────────────────────────────────────
-- FORMATIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  field       VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS well_formations (
  id            SERIAL PRIMARY KEY,
  well_id       INTEGER NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
  formation_id  INTEGER NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  top_depth     DOUBLE PRECISION NOT NULL,
  bottom_depth  DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS wf_well_idx ON well_formations(well_id);

-- ─────────────────────────────────────────────────────────────────
-- DRILLING PARAMETERS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drilling_parameters (
  id          SERIAL PRIMARY KEY,
  well_id     INTEGER NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL,
  depth       DOUBLE PRECISION NOT NULL,
  rop         DOUBLE PRECISION,
  wob         DOUBLE PRECISION,
  rpm         DOUBLE PRECISION,
  torque      DOUBLE PRECISION,
  spp         DOUBLE PRECISION,
  flow_rate   DOUBLE PRECISION,
  mud_weight  DOUBLE PRECISION,
  ecd         DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS dp_well_depth_idx ON drilling_parameters(well_id, depth);
CREATE INDEX IF NOT EXISTS dp_well_time_idx  ON drilling_parameters(well_id, timestamp);

-- ─────────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           SERIAL PRIMARY KEY,
  well_id      INTEGER NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
  event_type   event_type NOT NULL,
  start_depth  DOUBLE PRECISION NOT NULL,
  end_depth    DOUBLE PRECISION,
  severity     severity_level NOT NULL,
  description  TEXT,
  mitigation   TEXT,
  outcome      TEXT,
  event_time   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ev_well_idx  ON events(well_id);
CREATE INDEX IF NOT EXISTS ev_depth_idx ON events(start_depth);
CREATE INDEX IF NOT EXISTS ev_type_idx  ON events(event_type);

-- ─────────────────────────────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id             SERIAL PRIMARY KEY,
  well_id        INTEGER NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
  document_type  doc_type NOT NULL,
  document_name  VARCHAR(255) NOT NULL,
  document_path  VARCHAR(512) NOT NULL,
  document_date  DATE
);

CREATE TABLE IF NOT EXISTS event_documents (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  document_id  INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number  INTEGER
);
