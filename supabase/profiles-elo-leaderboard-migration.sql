-- Netrunner Checkers leaderboard profile migration.
-- Safe to run in the Supabase SQL Editor after the base tables exist.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  elo integer not null default 1000,
  city text default 'Almaty'
);

alter table public.profiles
add column if not exists id uuid;

alter table public.profiles
add column if not exists username text;

alter table public.profiles
add column if not exists elo integer;

alter table public.profiles
add column if not exists city text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'hack_rating'
  ) then
    execute 'update public.profiles set elo = coalesce(elo, hack_rating, 1000) where elo is null';
  else
    update public.profiles
    set elo = 1000
    where elo is null;
  end if;
end $$;

update public.profiles
set username = coalesce(nullif(btrim(username), ''), 'RUNNER_' || substring(id::text, 1, 8))
where username is null or btrim(username) = '';

update public.profiles
set city = 'Almaty'
where city is null or btrim(city) = '';

alter table public.profiles
alter column elo set default 1000,
alter column elo set not null;

alter table public.profiles
alter column city set default 'Almaty';

alter table public.profiles
alter column username set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'p'
  ) then
    alter table public.profiles
    add constraint profiles_pkey primary key (id);
  end if;
end $$;

create index if not exists profiles_elo_desc_idx
on public.profiles (elo desc);

create index if not exists profiles_city_elo_desc_idx
on public.profiles (city, elo desc);

alter table public.profiles enable row level security;

drop policy if exists profiles_read_authenticated on public.profiles;
create policy profiles_read_authenticated
on public.profiles
for select
to authenticated
using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, elo, city)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'RUNNER_' || substring(new.id::text, 1, 8)
    ),
    1000,
    coalesce(nullif(new.raw_user_meta_data ->> 'city', ''), 'Almaty')
  )
  on conflict (id) do update
  set
    username = coalesce(public.profiles.username, excluded.username),
    elo = coalesce(public.profiles.elo, 1000),
    city = coalesce(public.profiles.city, excluded.city);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profiles on auth.users;

create trigger on_auth_user_created_profiles
after insert on auth.users
for each row execute function public.handle_new_user_profile();
