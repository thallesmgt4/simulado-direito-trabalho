-- Simulado Direito do Trabalho: perfis, tentativas e ranking
-- Aplicar via Supabase CLI (supabase db push) ou SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 0 and 40),
  total_questions integer not null default 40 check (total_questions = 40),
  elapsed_seconds integer not null check (elapsed_seconds between 1 and 86400),
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_best_idx
  on public.quiz_attempts (user_id, score desc, elapsed_seconds asc, created_at asc);

alter table public.profiles enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users can read own attempts" on public.quiz_attempts;
create policy "Users can read own attempts"
  on public.quiz_attempts for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.handle_new_quiz_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_name text;
begin
  candidate_name := left(
    btrim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))),
    80
  );
  if char_length(candidate_name) < 2 then
    candidate_name := 'Estudante';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, candidate_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_quiz_profile on auth.users;
create trigger on_auth_user_created_quiz_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_quiz_user();

create or replace function public.get_quiz_leaderboard()
returns table (
  position bigint,
  display_name text,
  score integer,
  total_questions integer,
  elapsed_seconds integer,
  achieved_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with best_attempt as (
    select distinct on (a.user_id)
      a.user_id,
      p.display_name,
      a.score,
      a.total_questions,
      a.elapsed_seconds,
      a.created_at
    from public.quiz_attempts a
    join public.profiles p on p.id = a.user_id
    order by a.user_id, a.score desc, a.elapsed_seconds asc, a.created_at asc
  ),
  ranked as (
    select
      row_number() over (order by b.score desc, b.elapsed_seconds asc, b.created_at asc) as position,
      b.display_name,
      b.score,
      b.total_questions,
      b.elapsed_seconds,
      b.created_at
    from best_attempt b
  )
  select r.position, r.display_name, r.score, r.total_questions, r.elapsed_seconds, r.created_at
  from ranked r
  order by r.position
  limit 100;
$$;

revoke all on function public.get_quiz_leaderboard() from public;
grant execute on function public.get_quiz_leaderboard() to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.quiz_attempts to authenticated;
