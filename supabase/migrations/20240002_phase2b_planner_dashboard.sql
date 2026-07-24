-- =============================================================================
-- Phase 2B Planner + Dashboard Foundation Migration
-- UPSC Prep App — Self-Hosted Learning Platform
-- =============================================================================
-- Requires: Phase 2A migration (20240001_phase2a_foundation.sql) applied first.
-- Reuses: visibility_type enum, is_allowed_user() function, set_updated_at() trigger.
-- Idempotent: uses IF NOT EXISTS / CREATE OR REPLACE / DO $$ blocks.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. study_plans
--    One or more preparation plans per user.
--    Future-ready for Custom Study Plan Generator (generator_ready flag).
-- ---------------------------------------------------------------------------
create table if not exists study_plans (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  title                   text not null,
  description             text,
  start_date              date not null,
  target_date             date not null,
  daily_available_minutes integer not null default 120 check (daily_available_minutes > 0),
  pace                    text not null default 'normal'
                            check (pace in ('slow', 'normal', 'aggressive')),
  status                  text not null default 'draft'
                            check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  visibility              visibility_type not null default 'private',
  generator_ready         boolean not null default true,
  generated_by            text not null default 'manual'
                            check (generated_by in ('manual', 'future_generator')),
  backlog_buffer_days     integer not null default 7 check (backlog_buffer_days >= 0),
  revision_strategy       text not null default 'standard_1_3_7_15_30_60_90',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  -- derived: target_date must be after start_date
  constraint study_plans_dates_check check (target_date > start_date)
);

drop trigger if exists study_plans_updated_at on study_plans;
create trigger study_plans_updated_at
  before update on study_plans
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. study_goals
--    High-level goals linked to a study plan.
-- ---------------------------------------------------------------------------
create table if not exists study_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan_id     uuid references study_plans(id) on delete cascade,
  title       text not null,
  description text,
  goal_type   text not null default 'general',
    -- examples: syllabus, revision, pyq, csat, answer_writing, optional,
    --           current_affairs, general
  target_date date,
  status      text not null default 'active'
                check (status in ('active', 'completed', 'paused', 'archived')),
  priority    integer not null default 2 check (priority between 1 and 3),
  visibility  visibility_type not null default 'private',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists study_goals_updated_at on study_goals;
create trigger study_goals_updated_at
  before update on study_goals
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. monthly_targets
--    Monthly blocks under a study plan.
-- ---------------------------------------------------------------------------
create table if not exists monthly_targets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  plan_id         uuid references study_plans(id) on delete cascade,
  month_start     date not null,
  month_end       date not null,
  title           text not null,
  focus_area      text,
  target_minutes  integer default 0 check (target_minutes >= 0),
  status          text not null default 'planned'
                    check (status in ('planned', 'active', 'completed', 'missed', 'adjusted')),
  visibility      visibility_type not null default 'private',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint monthly_targets_dates_check check (month_end >= month_start)
);

drop trigger if exists monthly_targets_updated_at on monthly_targets;
create trigger monthly_targets_updated_at
  before update on monthly_targets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. weekly_targets
--    Weekly blocks under a monthly target or study plan.
-- ---------------------------------------------------------------------------
create table if not exists weekly_targets (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  plan_id            uuid references study_plans(id) on delete cascade,
  monthly_target_id  uuid references monthly_targets(id) on delete set null,
  week_start         date not null,
  week_end           date not null,
  title              text not null,
  focus_area         text,
  target_minutes     integer default 0 check (target_minutes >= 0),
  status             text not null default 'planned'
                       check (status in ('planned', 'active', 'completed', 'missed', 'adjusted')),
  visibility         visibility_type not null default 'private',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint weekly_targets_dates_check check (week_end >= week_start)
);

drop trigger if exists weekly_targets_updated_at on weekly_targets;
create trigger weekly_targets_updated_at
  before update on weekly_targets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. daily_tasks
--    Daily study tasks — the primary work unit.
-- ---------------------------------------------------------------------------
create table if not exists daily_tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plan_id           uuid references study_plans(id) on delete cascade,
  weekly_target_id  uuid references weekly_targets(id) on delete set null,
  topic_id          uuid references syllabus_topics(id) on delete set null,
  subtopic_id       uuid references syllabus_subtopics(id) on delete set null,
  title             text not null,
  description       text,
  task_type         text not null default 'study',
    -- examples: study, revision, pyq, notes, answer_writing,
    --           csat, optional, current_affairs, backlog
  task_date         date not null default current_date,
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  actual_minutes    integer not null default 0 check (actual_minutes >= 0),
  status            text not null default 'pending'
                      check (status in ('pending', 'in_progress', 'completed',
                                        'skipped', 'moved', 'cancelled')),
  priority          integer not null default 2 check (priority between 1 and 3),
  visibility        visibility_type not null default 'private',
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists daily_tasks_updated_at on daily_tasks;
create trigger daily_tasks_updated_at
  before update on daily_tasks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. backlog_items
--    Missed tasks or topics that need rescheduling.
-- ---------------------------------------------------------------------------
create table if not exists backlog_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_id        uuid references study_plans(id) on delete cascade,
  source_task_id uuid references daily_tasks(id) on delete set null,
  title          text not null,
  reason         text,
  due_date       date,
  status         text not null default 'open'
                   check (status in ('open', 'rescheduled', 'completed', 'ignored')),
  visibility     visibility_type not null default 'private',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists backlog_items_updated_at on backlog_items;
create trigger backlog_items_updated_at
  before update on backlog_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. study_sessions
--    Tracks actual (live-timer) study sessions.
-- ---------------------------------------------------------------------------
create table if not exists study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  plan_id          uuid references study_plans(id) on delete set null,
  task_id          uuid references daily_tasks(id) on delete set null,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_minutes integer default 0 check (duration_minutes >= 0),
  session_type     text not null default 'study',
    -- examples: study, revision, pyq, answer_writing, csat, notes
  notes            text,
  visibility       visibility_type not null default 'private',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists study_sessions_updated_at on study_sessions;
create trigger study_sessions_updated_at
  before update on study_sessions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. time_logs
--    Manual time logs (for retrospective tracking without a live session).
-- ---------------------------------------------------------------------------
create table if not exists time_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plan_id       uuid references study_plans(id) on delete set null,
  task_id       uuid references daily_tasks(id) on delete set null,
  log_date      date not null default current_date,
  minutes       integer not null check (minutes >= 0),
  activity_type text not null default 'study',
  notes         text,
  visibility    visibility_type not null default 'private',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists time_logs_updated_at on time_logs;
create trigger time_logs_updated_at
  before update on time_logs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table study_plans     enable row level security;
alter table study_goals     enable row level security;
alter table monthly_targets enable row level security;
alter table weekly_targets  enable row level security;
alter table daily_tasks     enable row level security;
alter table backlog_items   enable row level security;
alter table study_sessions  enable row level security;
alter table time_logs       enable row level security;

-- ── study_plans ────────────────────────────────────────────────────────────
drop policy if exists "study_plans: own private"  on study_plans;
drop policy if exists "study_plans: shared read"  on study_plans;
create policy "study_plans: own private"
  on study_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "study_plans: shared read"
  on study_plans for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── study_goals ────────────────────────────────────────────────────────────
drop policy if exists "study_goals: own private" on study_goals;
drop policy if exists "study_goals: shared read" on study_goals;
create policy "study_goals: own private"
  on study_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "study_goals: shared read"
  on study_goals for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── monthly_targets ────────────────────────────────────────────────────────
drop policy if exists "monthly_targets: own private" on monthly_targets;
drop policy if exists "monthly_targets: shared read" on monthly_targets;
create policy "monthly_targets: own private"
  on monthly_targets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "monthly_targets: shared read"
  on monthly_targets for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── weekly_targets ─────────────────────────────────────────────────────────
drop policy if exists "weekly_targets: own private" on weekly_targets;
drop policy if exists "weekly_targets: shared read" on weekly_targets;
create policy "weekly_targets: own private"
  on weekly_targets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "weekly_targets: shared read"
  on weekly_targets for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── daily_tasks ────────────────────────────────────────────────────────────
drop policy if exists "daily_tasks: own private" on daily_tasks;
drop policy if exists "daily_tasks: shared read" on daily_tasks;
create policy "daily_tasks: own private"
  on daily_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "daily_tasks: shared read"
  on daily_tasks for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── backlog_items ──────────────────────────────────────────────────────────
drop policy if exists "backlog_items: own private" on backlog_items;
drop policy if exists "backlog_items: shared read" on backlog_items;
create policy "backlog_items: own private"
  on backlog_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "backlog_items: shared read"
  on backlog_items for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── study_sessions ─────────────────────────────────────────────────────────
drop policy if exists "study_sessions: own private" on study_sessions;
drop policy if exists "study_sessions: shared read" on study_sessions;
create policy "study_sessions: own private"
  on study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "study_sessions: shared read"
  on study_sessions for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ── time_logs ──────────────────────────────────────────────────────────────
drop policy if exists "time_logs: own private" on time_logs;
drop policy if exists "time_logs: shared read" on time_logs;
create policy "time_logs: own private"
  on time_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "time_logs: shared read"
  on time_logs for select
  using (is_allowed_user() and visibility = 'shared_between_two');

-- ---------------------------------------------------------------------------
-- 10. GRANTS
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on
  study_plans, study_goals, monthly_targets, weekly_targets,
  daily_tasks, backlog_items, study_sessions, time_logs
to authenticated;

-- ---------------------------------------------------------------------------
-- Done.
-- Apply: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- Or:    supabase db push  (with Supabase CLI linked to project)
-- ---------------------------------------------------------------------------
