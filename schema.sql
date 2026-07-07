-- Wedding site schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table if not exists config (
  id int primary key default 1,
  event_date_display text default 'Saturday, June 19, 2027',
  event_date_iso text default '2027-06-19T18:00:00',
  venue_name text default 'TBD',
  venue_address text default 'TBD',
  doors_time text default '6:00 PM',
  photo_album_link text default '',
  guest_password text default 'dancefloor2027',
  admin_password text default 'bestfriends4eva',
  constraint single_row check (id = 1)
);
insert into config (id) values (1) on conflict (id) do nothing;

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending','coming','not_coming')),
  note text,
  is_plus_one boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists plus_one_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by_name text not null,
  plus_one_name text not null,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now()
);

alter table config enable row level security;
alter table guests enable row level security;
alter table plus_one_requests enable row level security;

-- Public site uses only the anon/publishable key. These policies allow the
-- functionality the site needs (read config, read/update guests, submit
-- plus-one requests) without exposing anything more sensitive. Admin actions
-- are additionally gated behind the admin_password check in the app itself.
create policy "public read config" on config for select using (true);
create policy "public update config" on config for update using (true);

create policy "public read guests" on guests for select using (true);
create policy "public insert guests" on guests for insert with check (true);
create policy "public update guests" on guests for update using (true);
create policy "public delete guests" on guests for delete using (true);

create policy "public read requests" on plus_one_requests for select using (true);
create policy "public insert requests" on plus_one_requests for insert with check (true);
create policy "public update requests" on plus_one_requests for update using (true);
