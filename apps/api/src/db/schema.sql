CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('public', 'hospital_staff', 'hospital_manager', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE bag_status AS ENUM ('available', 'reserved', 'issued', 'quarantined', 'expired', 'disposed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'fulfilled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('normal', 'urgent', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  atoll text NOT NULL,
  island text NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text,
  donation_open_time time,
  donation_close_time time,
  donation_days text NOT NULL DEFAULT 'Sunday-Thursday',
  donations_enabled boolean NOT NULL DEFAULT true,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS atoll text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS island text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS donation_open_time time;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS donation_close_time time;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS donation_days text NOT NULL DEFAULT 'Sunday-Thursday';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS donations_enabled boolean NOT NULL DEFAULT true;
UPDATE hospitals SET atoll='Kaafu Atoll' WHERE atoll IS NULL;
UPDATE hospitals SET island=city WHERE island IS NULL;
ALTER TABLE hospitals ALTER COLUMN atoll SET NOT NULL;
ALTER TABLE hospitals ALTER COLUMN island SET NOT NULL;
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  atoll text,
  island text,
  identification_type text CHECK (identification_type IN ('maldives_id', 'passport')),
  identification_number text,
  role user_role NOT NULL DEFAULT 'public',
  hospital_id uuid REFERENCES hospitals(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS atoll text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS island text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identification_type text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identification_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_identification_type_check
    CHECK (identification_type IN ('maldives_id', 'passport'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_identification
  ON users(identification_type, upper(identification_number))
  WHERE identification_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS donor_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  blood_type varchar(3) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  date_of_birth date,
  last_donation_date date,
  eligible boolean NOT NULL DEFAULT true,
  eligibility_note text
);

ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS ineligibility_type text CHECK (ineligibility_type IN ('temporary','permanent'));
ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS ineligible_until date;

CREATE TABLE IF NOT EXISTS patient_history_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  entry_type text NOT NULL CHECK (entry_type IN ('clinical_note','diagnosis','procedure','transfusion','other')),
  title text NOT NULL,
  details text NOT NULL,
  occurred_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE patient_history_entries ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_patient_history ON patient_history_entries(patient_id, occurred_at DESC);

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS appointment_slots;

CREATE TABLE IF NOT EXISTS blood_bags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES users(id),
  code text UNIQUE NOT NULL,
  blood_type varchar(3) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  component text NOT NULL DEFAULT 'Whole Blood',
  volume_ml integer NOT NULL DEFAULT 450,
  collected_at date NOT NULL,
  expires_at date NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  storage_location text,
  notes text,
  status bag_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > collected_at)
);

ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS donor_id uuid REFERENCES users(id);
ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS assigned_patient_id uuid REFERENCES users(id);
ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES users(id);
ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS reserved_at timestamptz;
ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS issued_by uuid REFERENCES users(id);
ALTER TABLE blood_bags ADD COLUMN IF NOT EXISTS issued_at timestamptz;
UPDATE blood_bags SET donor_id=(SELECT id FROM users WHERE role='public' ORDER BY created_at LIMIT 1) WHERE donor_id IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM blood_bags WHERE donor_id IS NULL) THEN
    ALTER TABLE blood_bags ALTER COLUMN donor_id SET NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  patient_name text NOT NULL,
  patient_id_type text CHECK (patient_id_type IN ('maldives_id', 'passport')),
  patient_id_number text,
  blood_type varchar(3) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units integer NOT NULL CHECK (units BETWEEN 1 AND 20),
  urgency urgency_level NOT NULL DEFAULT 'normal',
  status request_status NOT NULL DEFAULT 'pending',
  needed_by date NOT NULL,
  request_atoll text,
  request_island text,
  contact_detail text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'staff_only')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS patient_id_type text;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS patient_id_number text;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_atoll text;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_island text;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS contact_detail text;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
UPDATE blood_requests r SET request_atoll=h.atoll, request_island=h.island
FROM hospitals h WHERE h.id=r.hospital_id AND (r.request_atoll IS NULL OR r.request_island IS NULL);
DO $$ BEGIN
  ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_patient_id_type_check
    CHECK (patient_id_type IN ('maldives_id', 'passport'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_visibility_check
    CHECK (visibility IN ('public', 'staff_only'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_blood_bag_assignments (
  request_id uuid NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  bag_id uuid NOT NULL UNIQUE REFERENCES blood_bags(id),
  assigned_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(request_id,bag_id)
);
CREATE TABLE IF NOT EXISTS request_donor_assignments (
  request_id uuid NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES users(id),
  assigned_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(request_id,donor_id)
);
UPDATE blood_bags b
SET reserved_by=a.assigned_by,reserved_at=a.created_at
FROM request_blood_bag_assignments a
WHERE a.bag_id=b.id AND b.reserved_by IS NULL;
UPDATE blood_bags b
SET issued_by=a.assigned_by,issued_at=coalesce(b.issued_at,a.created_at)
FROM request_blood_bag_assignments a
WHERE a.bag_id=b.id AND b.status='issued' AND b.issued_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_bags_inventory ON blood_bags(hospital_id, blood_type, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_requests_hospital ON blood_requests(hospital_id, status, urgency);
DO $$
DECLARE duplicate_record record; keeper_id uuid;
BEGIN
  FOR duplicate_record IN
    SELECT h.id, h.name FROM hospitals h
    WHERE EXISTS (SELECT 1 FROM hospitals earlier WHERE earlier.name=h.name AND (earlier.created_at,earlier.id::text)<(h.created_at,h.id::text))
  LOOP
    SELECT id INTO keeper_id FROM hospitals WHERE name=duplicate_record.name ORDER BY created_at,id::text LIMIT 1;
    UPDATE users SET hospital_id=keeper_id WHERE hospital_id=duplicate_record.id;
    UPDATE blood_bags SET hospital_id=keeper_id WHERE hospital_id=duplicate_record.id;
    UPDATE blood_requests SET hospital_id=keeper_id WHERE hospital_id=duplicate_record.id;
    DELETE FROM hospitals WHERE id=duplicate_record.id;
  END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(lower(name));
