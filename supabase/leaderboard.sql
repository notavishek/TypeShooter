-- Run this in Supabase → SQL Editor
-- Creates the leaderboard table with Row Level Security

create table if not exists public.leaderboard (
  id          bigint generated always as identity primary key,
  username    text    not null default 'Player',
  wpm         integer not null check (wpm > 0 and wpm <= 250),
  accuracy    integer not null default 100 check (accuracy between 0 and 100),
  errors      integer not null default 0,
  mode        text    not null check (mode in ('normal', 'survival')),
  diff        text    not null,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.leaderboard enable row level security;

-- Policy: anyone can READ scores
create policy "public read"
  on public.leaderboard for select
  using (true);

-- Policy: anyone can INSERT a score (WPM cap enforced by check constraint above)
create policy "public insert"
  on public.leaderboard for insert
  with check (true);

-- No UPDATE or DELETE policies → clients can't tamper with existing scores

-- Index for fast leaderboard queries
create index if not exists leaderboard_mode_wpm_idx
  on public.leaderboard (mode, wpm desc);
