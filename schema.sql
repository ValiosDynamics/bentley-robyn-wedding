-- ─── Wedding Site Schema ─────────────────────────────────────────────────────
-- Run this once in: supabase.com → your project → SQL Editor

CREATE TABLE IF NOT EXISTS config (
  id             INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  date_display   TEXT NOT NULL DEFAULT 'June 2027',
  date_iso       TEXT NOT NULL DEFAULT '2027-06-19T17:00:00-07:00',
  venue_name     TEXT NOT NULL DEFAULT 'Kelowna, BC',
  venue_sub      TEXT NOT NULL DEFAULT 'Venue TBD — stay tuned',
  doors_time     TEXT NOT NULL DEFAULT '5:00 PM',
  photo_link     TEXT NOT NULL DEFAULT '',
  guest_password TEXT NOT NULL DEFAULT 'dancefloor2027',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS guests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id     UUID REFERENCES guests(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  phone        TEXT,
  attending    TEXT NOT NULL CHECK (attending IN ('yes','no')),
  guests_count INT NOT NULL DEFAULT 1,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plus_one_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name     TEXT NOT NULL,
  requester_guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  plus_one_name      TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS and grant access to the publishable key
ALTER TABLE config            DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests            DISABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps             DISABLE ROW LEVEL SECURITY;
ALTER TABLE plus_one_requests DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE config            TO anon, authenticated;
GRANT ALL ON TABLE guests            TO anon, authenticated;
GRANT ALL ON TABLE rsvps             TO anon, authenticated;
GRANT ALL ON TABLE plus_one_requests TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
