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

alter table public.users
  add column if not exists auth_user_id uuid unique
  references auth.users(id) on delete cascade;

alter table public.users
  add column if not exists last_login_at timestamptz;

alter table public.users
  add column if not exists total_chat bigint not null default 0;

alter table public.users
  add column if not exists total_login bigint not null default 0;

create unique index if not exists users_auth_user_id_key
  on public.users (auth_user_id)
  where auth_user_id is not null;

comment on column public.users.password_hash is
  'Legacy nullable field. Supabase Auth owns password hashes for authenticated users.';

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists user_achievements_user_earned_idx
  on public.user_achievements (user_id, earned_at desc);

insert into public.achievements (code, name, description)
values
  ('first_chat', 'First Chat', 'Mengirim percakapan pertama dengan NovaMind AI.'),
  ('chat_10', '10 Chats', 'Menyelesaikan 10 percakapan dengan NovaMind AI.'),
  ('chat_50', '50 Chats', 'Menyelesaikan 50 percakapan dengan NovaMind AI.'),
  ('first_login', 'First Login', 'Berhasil login ke NovaMind untuk pertama kali.'),
  ('active_learner', 'Active Learner', 'Aktif belajar pada tujuh hari berbeda.')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description;

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

create or replace function public.check_user_achievements(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_days integer;
  app_user public.users;
  result jsonb;
begin
  select * into app_user
  from public.users
  where id = p_user_id;

  if app_user.id is null then
    return '[]'::jsonb;
  end if;

  select count(distinct ((created_at at time zone 'Asia/Jakarta')::date))
  into active_days
  from public.chat_history
  where user_id = p_user_id;

  insert into public.user_achievements (user_id, achievement_id)
  select p_user_id, achievement.id
  from public.achievements as achievement
  where
    (achievement.code = 'first_chat' and app_user.total_chat >= 1)
    or (achievement.code = 'chat_10' and app_user.total_chat >= 10)
    or (achievement.code = 'chat_50' and app_user.total_chat >= 50)
    or (achievement.code = 'first_login' and app_user.total_login >= 1)
    or (achievement.code = 'active_learner' and active_days >= 7)
  on conflict (user_id, achievement_id) do nothing;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', user_achievement.id,
        'code', achievement.code,
        'name', achievement.name,
        'description', achievement.description,
        'earned_at', user_achievement.earned_at
      )
      order by user_achievement.earned_at desc
    ),
    '[]'::jsonb
  )
  into result
  from public.user_achievements as user_achievement
  join public.achievements as achievement
    on achievement.id = user_achievement.achievement_id
  where user_achievement.user_id = p_user_id;

  return result;
end;
$$;

create or replace function public.sync_user_total_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.user_id is not null then
    update public.users
    set total_chat = total_chat + 1
    where id = new.user_id;
    perform public.check_user_achievements(new.user_id);
    return new;
  end if;

  if tg_op = 'DELETE' and old.user_id is not null then
    update public.users
    set total_chat = greatest(total_chat - 1, 0)
    where id = old.user_id;
    return old;
  end if;

  return null;
end;
$$;

create or replace function public.record_user_login(
  p_user_id uuid,
  p_logged_in_at timestamptz
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.users;
begin
  update public.users
  set
    last_login_at = p_logged_in_at,
    total_login = total_login + 1
  where id = p_user_id
  returning * into result;

  if result.id is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  perform public.check_user_achievements(p_user_id);
  return result;
end;
$$;

drop trigger if exists chat_history_total_chat_trigger
  on public.chat_history;
create trigger chat_history_total_chat_trigger
after insert or delete on public.chat_history
for each row execute function public.sync_user_total_chat();

update public.users as app_user
set total_chat = (
  select count(*)
  from public.chat_history
  where chat_history.user_id = app_user.id
);

select public.check_user_achievements(id)
from public.users;

create or replace function public.get_user_daily_activity(
  p_user_id uuid,
  p_days integer default 30
)
returns table (
  activity_date date,
  chat_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (created_at at time zone 'Asia/Jakarta')::date as activity_date,
    count(*) as chat_count
  from public.chat_history
  where
    user_id = p_user_id
    and created_at >= now() - make_interval(days => least(greatest(p_days, 1), 90))
  group by activity_date
  order by activity_date desc;
$$;

create or replace function public.get_admin_statistics()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total_users', (select count(*) from public.users),
    'total_chats', (select count(*) from public.chat_history),
    'total_logins', (select coalesce(sum(total_login), 0) from public.users),
    'total_chats_today', (
      select count(*)
      from public.chat_history
      where (created_at at time zone 'Asia/Jakarta')::date =
        (now() at time zone 'Asia/Jakarta')::date
    )
  );
$$;

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
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.chat_history from anon, authenticated;
revoke all on table public.registrations from anon, authenticated;
revoke all on table public.challenge_progress from anon, authenticated;
revoke all on table public.achievements from anon, authenticated;
revoke all on table public.user_achievements from anon, authenticated;
revoke all on function public.register_participant(
  text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
revoke all on function public.sync_user_total_chat()
  from public, anon, authenticated;
revoke all on function public.check_user_achievements(uuid)
  from public, anon, authenticated;
revoke all on function public.record_user_login(uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.get_user_daily_activity(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.get_admin_statistics()
  from public, anon, authenticated;
revoke all on function public.complete_daily_challenge(uuid, uuid, date, integer)
  from public, anon, authenticated;
grant execute on function public.register_participant(
  text, text, text, text, text, text, text, text, text
) to service_role;
grant execute on function public.complete_daily_challenge(uuid, uuid, date, integer)
  to service_role;
grant execute on function public.check_user_achievements(uuid)
  to service_role;
grant execute on function public.record_user_login(uuid, timestamptz)
  to service_role;
grant execute on function public.get_user_daily_activity(uuid, integer)
  to service_role;
grant execute on function public.get_admin_statistics()
  to service_role;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Berikan izin akses dasar ke role authenticated agar RLS dapat dievaluasi.
grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.chat_history to authenticated;
grant select, insert, update, delete on table public.registrations to authenticated;
grant select, insert, update, delete on table public.challenge_progress to authenticated;
grant select, insert, update, delete on table public.achievements to authenticated;
grant select, insert, update, delete on table public.user_achievements to authenticated;

-- Bersihkan policy lama (untuk skenario re-apply/migrasi)
drop policy if exists "Users can view own data" on public.users;
drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Users can view own chat history" on public.chat_history;
drop policy if exists "Users can insert own chat history" on public.chat_history;
drop policy if exists "Users can delete own chat history" on public.chat_history;
drop policy if exists "Users can view own registration" on public.registrations;
drop policy if exists "Users can update own registration" on public.registrations;
drop policy if exists "Users can view own challenge progress" on public.challenge_progress;
drop policy if exists "Authenticated users can view achievements" on public.achievements;
drop policy if exists "Users can view own user achievements" on public.user_achievements;

-- RLS: Table users
-- Pemetaan menggunakan auth_user_id yang terhubung langsung dengan auth.uid() Supabase.
-- User hanya boleh membaca, mengubah, dan menghapus datanya sendiri.
create policy "users_select_policy" on public.users for select to authenticated using (auth_user_id = auth.uid());
create policy "users_insert_policy" on public.users for insert to authenticated with check (auth_user_id = auth.uid());
create policy "users_update_policy" on public.users for update to authenticated using (auth_user_id = auth.uid());
create policy "users_delete_policy" on public.users for delete to authenticated using (auth_user_id = auth.uid());

-- RLS: Table chat_history
-- Menggunakan subquery pemetaan karena user_id di sini adalah public.users.id
create policy "chat_history_select_policy" on public.chat_history for select to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "chat_history_insert_policy" on public.chat_history for insert to authenticated with check (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "chat_history_update_policy" on public.chat_history for update to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "chat_history_delete_policy" on public.chat_history for delete to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));

-- RLS: Table registrations
create policy "registrations_select_policy" on public.registrations for select to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "registrations_insert_policy" on public.registrations for insert to authenticated with check (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "registrations_update_policy" on public.registrations for update to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "registrations_delete_policy" on public.registrations for delete to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));

-- RLS: Table challenge_progress
create policy "challenge_progress_select_policy" on public.challenge_progress for select to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "challenge_progress_insert_policy" on public.challenge_progress for insert to authenticated with check (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "challenge_progress_update_policy" on public.challenge_progress for update to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "challenge_progress_delete_policy" on public.challenge_progress for delete to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));

-- RLS: Table achievements
-- Ini adalah katalog statis pencapaian (Lookup Table), maka hanya bisa dibaca (Select) oleh user biasa.
-- Operasi Insert/Update/Delete dilarang (false) untuk authenticated user, dan hanya bisa via Admin Service Role.
create policy "achievements_select_policy" on public.achievements for select to authenticated using (true);
create policy "achievements_insert_policy" on public.achievements for insert to authenticated with check (false);
create policy "achievements_update_policy" on public.achievements for update to authenticated using (false);
create policy "achievements_delete_policy" on public.achievements for delete to authenticated using (false);

-- RLS: Table user_achievements
create policy "user_achievements_select_policy" on public.user_achievements for select to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "user_achievements_insert_policy" on public.user_achievements for insert to authenticated with check (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "user_achievements_update_policy" on public.user_achievements for update to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));
create policy "user_achievements_delete_policy" on public.user_achievements for delete to authenticated using (user_id = (select id from public.users where auth_user_id = auth.uid()));

