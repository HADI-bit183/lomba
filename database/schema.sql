create extension if not exists citext;
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  fullname text not null check (char_length(fullname) between 2 and 120),
  email citext not null unique,
  password_hash text,
  avatar text,
  role text not null default 'participant'
    check (role in ('participant', 'mentor', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  visitor_id uuid not null,
  prompt text not null check (char_length(prompt) between 1 and 1500),
  response text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_history_user_created_idx
  on public.chat_history (user_id, created_at desc);
create index if not exists chat_history_visitor_created_idx
  on public.chat_history (visitor_id, created_at desc);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  phone text not null,
  university text not null,
  faculty text not null,
  team_name text not null,
  category text not null check (category in ('static', 'dynamic', 'framework')),
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_progress (
  visitor_id uuid primary key,
  user_id uuid references public.users(id) on delete set null,
  total_xp integer not null default 0 check (total_xp >= 0),
  last_completed_on date,
  updated_at timestamptz not null default now()
);

create or replace function public.register_participant(
  p_fullname text,
  p_email text,
  p_password_hash text,
  p_avatar text,
  p_phone text,
  p_university text,
  p_faculty text,
  p_team_name text,
  p_category text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_user public.users;
  saved_registration public.registrations;
begin
  insert into public.users (
    fullname,
    email,
    password_hash,
    avatar,
    role
  )
  values (
    p_fullname,
    p_email,
    p_password_hash,
    p_avatar,
    'participant'
  )
  returning * into saved_user;

  insert into public.registrations (
    user_id,
    phone,
    university,
    faculty,
    team_name,
    category
  )
  values (
    saved_user.id,
    p_phone,
    p_university,
    p_faculty,
    p_team_name,
    p_category
  )
  returning * into saved_registration;

  return jsonb_build_object(
    'user', to_jsonb(saved_user) - 'password_hash',
    'registration', to_jsonb(saved_registration)
  );
end;
$$;

create or replace function public.complete_daily_challenge(
  p_visitor_id uuid,
  p_user_id uuid,
  p_challenge_date date,
  p_xp integer
)
returns public.challenge_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.challenge_progress;
begin
  if p_xp < 1 or p_xp > 100 then
    raise exception 'Invalid XP value' using errcode = '22023';
  end if;

  insert into public.challenge_progress (
    visitor_id,
    user_id,
    total_xp,
    last_completed_on,
    updated_at
  )
  values (p_visitor_id, p_user_id, p_xp, p_challenge_date, now())
  on conflict (visitor_id) do update
  set
    user_id = coalesce(excluded.user_id, challenge_progress.user_id),
    total_xp = case
      when challenge_progress.last_completed_on = excluded.last_completed_on
        then challenge_progress.total_xp
      else challenge_progress.total_xp + excluded.total_xp
    end,
    last_completed_on = greatest(
      challenge_progress.last_completed_on,
      excluded.last_completed_on
    ),
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

alter table public.users enable row level security;
alter table public.chat_history enable row level security;
alter table public.registrations enable row level security;
alter table public.challenge_progress enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.chat_history from anon, authenticated;
revoke all on table public.registrations from anon, authenticated;
revoke all on table public.challenge_progress from anon, authenticated;
revoke all on function public.register_participant(
  text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
revoke all on function public.complete_daily_challenge(uuid, uuid, date, integer)
  from public, anon, authenticated;
grant execute on function public.register_participant(
  text, text, text, text, text, text, text, text, text
) to service_role;
grant execute on function public.complete_daily_challenge(uuid, uuid, date, integer)
  to service_role;
