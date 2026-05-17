-- Netrunner Checkers completed match archive.
-- The app already uses public.games for realtime rooms, so completed
-- match records are stored in public.match_history.

create extension if not exists pgcrypto;

create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_red_id uuid null references public.profiles(id) on delete set null,
  player_black_id uuid null references public.profiles(id) on delete set null,
  player_red_name text not null,
  player_black_name text not null,
  winner_id uuid null references public.profiles(id) on delete set null,
  elo_change integer not null default 0
);

comment on table public.match_history is
  'Archived completed Netrunner Checkers matches for profile history and Elo deltas.';

comment on column public.match_history.player_red_id is
  'Authenticated red/daemon player profile id when available. Null for AI/local anonymous opponents.';

comment on column public.match_history.player_black_id is
  'Authenticated black/runner player profile id when available.';

comment on column public.match_history.winner_id is
  'Authenticated winner profile id. Null means draw or unauthenticated AI/local opponent win.';

create index if not exists match_history_created_at_desc_idx
on public.match_history (created_at desc);

create index if not exists match_history_player_red_idx
on public.match_history (player_red_id, created_at desc);

create index if not exists match_history_player_black_idx
on public.match_history (player_black_id, created_at desc);

alter table public.match_history enable row level security;

drop policy if exists match_history_read_participant on public.match_history;
create policy match_history_read_participant
on public.match_history
for select
to authenticated
using (
  auth.uid() = player_red_id
  or auth.uid() = player_black_id
);

drop policy if exists match_history_insert_participant on public.match_history;
create policy match_history_insert_participant
on public.match_history
for insert
to authenticated
with check (
  auth.uid() = player_red_id
  or auth.uid() = player_black_id
);
