-- =============================================================================
-- Phase 2A Foundation Migration
-- UPSC Prep App — Self-Hosted Learning Platform
-- =============================================================================
-- Idempotent: uses IF NOT EXISTS, CREATE OR REPLACE, and DO $$ blocks.
-- Apply via: Supabase Dashboard > SQL Editor, or supabase db push (CLI).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM types
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('owner', 'second_user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visibility_type as enum ('private', 'shared_between_two');
exception when duplicate_object then null; end $$;

do $$ begin
  create type import_status as enum ('pending', 'processing', 'done', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audit_action as enum ('insert', 'update', 'delete', 'login', 'logout', 'access_denied');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. ACCESS / SECURITY TABLES
-- ---------------------------------------------------------------------------

-- 3a. profiles
-- Linked 1-to-1 with auth.users. Created automatically on first login
-- via a Supabase Auth trigger (see section 9).
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  role         user_role not null default 'second_user',
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- 3b. allowed_users
-- Canonical two-email allowlist stored in the DB.
-- Mirrors APP_ALLOWED_EMAIL_1 / APP_ALLOWED_EMAIL_2 env vars.
create table if not exists allowed_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  role       user_role not null default 'second_user',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists allowed_users_updated_at on allowed_users;
create trigger allowed_users_updated_at
  before update on allowed_users
  for each row execute function set_updated_at();

-- 3c. app_settings
-- Key-value store for app-wide settings. Not per-user.
create table if not exists app_settings (
  key        text primary key,
  value      text,
  description text,
  updated_at timestamptz not null default now()
);

-- 3d. audit_logs
-- Lightweight audit trail. No PII beyond user_id.
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  action      audit_action not null,
  table_name  text,
  record_id   uuid,
  description text,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. SOURCE REGISTRY TABLES
-- ---------------------------------------------------------------------------

-- 4a. source_registry
-- Approved reference sources (seed data — readable by both users).
create table if not exists source_registry (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text not null unique,
  category    text,  -- e.g. 'government', 'international', 'newspaper'
  description text,
  is_active   boolean not null default true,
  is_seed     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists source_registry_updated_at on source_registry;
create trigger source_registry_updated_at
  before update on source_registry
  for each row execute function set_updated_at();

-- 4b. material_import_logs
-- Tracks future material imports from approved sources. Placeholder for Phase 2B.
create table if not exists material_import_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source_id   uuid references source_registry(id) on delete set null,
  url         text,
  status      import_status not null default 'pending',
  error_msg   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists material_import_logs_updated_at on material_import_logs;
create trigger material_import_logs_updated_at
  before update on material_import_logs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. SYLLABUS FOUNDATION TABLES
-- ---------------------------------------------------------------------------

-- 5a. syllabus_papers
-- GS1, GS2, GS3, GS4, Essay, CSAT, Optional, Current Affairs (seed).
create table if not exists syllabus_papers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  short_code  text not null unique,
  description text,
  sort_order  integer not null default 0,
  is_seed     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 5b. syllabus_topics
-- Broad topic areas within each paper.
create table if not exists syllabus_topics (
  id          uuid primary key default gen_random_uuid(),
  paper_id    uuid not null references syllabus_papers(id) on delete cascade,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_seed     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (paper_id, name)
);

drop trigger if exists syllabus_topics_updated_at on syllabus_topics;
create trigger syllabus_topics_updated_at
  before update on syllabus_topics
  for each row execute function set_updated_at();

-- 5c. syllabus_subtopics
-- Granular subtopics under each topic.
create table if not exists syllabus_subtopics (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references syllabus_topics(id) on delete cascade,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_seed     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (topic_id, name)
);

drop trigger if exists syllabus_subtopics_updated_at on syllabus_subtopics;
create trigger syllabus_subtopics_updated_at
  before update on syllabus_subtopics
  for each row execute function set_updated_at();

-- 5d. topic_progress
-- Per-user progress tracking per topic.
create table if not exists topic_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  topic_id        uuid not null references syllabus_topics(id) on delete cascade,
  visibility      visibility_type not null default 'private',
  coverage_pct    integer not null default 0 check (coverage_pct between 0 and 100),
  confidence_score integer not null default 0 check (confidence_score between 0 and 5),
  last_studied_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, topic_id)
);

drop trigger if exists topic_progress_updated_at on topic_progress;
create trigger topic_progress_updated_at
  before update on topic_progress
  for each row execute function set_updated_at();

-- 5e. topic_notes
-- User notes per topic/subtopic. Support private or shared visibility.
create table if not exists topic_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  topic_id     uuid references syllabus_topics(id) on delete cascade,
  subtopic_id  uuid references syllabus_subtopics(id) on delete cascade,
  visibility   visibility_type not null default 'private',
  title        text,
  content      text,
  tags         text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists topic_notes_updated_at on topic_notes;
create trigger topic_notes_updated_at
  before update on topic_notes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. REVISION FOUNDATION TABLES
-- ---------------------------------------------------------------------------

-- 6a. revision_intervals
-- Standard spaced-repetition intervals (seed data).
create table if not exists revision_intervals (
  id          uuid primary key default gen_random_uuid(),
  days        integer not null unique,
  label       text not null,
  sort_order  integer not null default 0,
  is_seed     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 6b. revision_tasks
-- Scheduled revision tasks per user per topic.
create table if not exists revision_tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  topic_id        uuid references syllabus_topics(id) on delete cascade,
  subtopic_id     uuid references syllabus_subtopics(id) on delete cascade,
  visibility      visibility_type not null default 'private',
  interval_id     uuid references revision_intervals(id) on delete set null,
  due_date        date not null,
  completed_at    timestamptz,
  score           integer check (score between 0 and 5),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists revision_tasks_updated_at on revision_tasks;
create trigger revision_tasks_updated_at
  before update on revision_tasks
  for each row execute function set_updated_at();

-- 6c. weakness_tags
-- Tags marking weak areas per user.
create table if not exists weakness_tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic_id    uuid references syllabus_topics(id) on delete cascade,
  subtopic_id uuid references syllabus_subtopics(id) on delete cascade,
  visibility  visibility_type not null default 'private',
  tag         text not null,
  severity    integer not null default 1 check (severity between 1 and 3),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists weakness_tags_updated_at on weakness_tags;
create trigger weakness_tags_updated_at
  before update on weakness_tags
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. AI USAGE PLACEHOLDER TABLES
-- ---------------------------------------------------------------------------

-- 7a. ai_usage_limits
-- Per-user daily limits for Gemini API. Placeholder — Gemini not wired yet.
create table if not exists ai_usage_limits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade unique,
  daily_limit     integer not null default 20,
  used_today      integer not null default 0,
  last_reset_date date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists ai_usage_limits_updated_at on ai_usage_limits;
create trigger ai_usage_limits_updated_at
  before update on ai_usage_limits
  for each row execute function set_updated_at();

-- 7b. ai_cache
-- Cache for AI responses to avoid redundant Gemini calls. Placeholder.
create table if not exists ai_cache (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  prompt_hash  text not null,
  response     text,
  model        text,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, prompt_hash)
);

-- ---------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Enable RLS on all non-public tables
alter table profiles             enable row level security;
alter table allowed_users        enable row level security;
alter table app_settings         enable row level security;
alter table audit_logs           enable row level security;
alter table source_registry      enable row level security;
alter table material_import_logs enable row level security;
alter table syllabus_papers      enable row level security;
alter table syllabus_topics      enable row level security;
alter table syllabus_subtopics   enable row level security;
alter table topic_progress       enable row level security;
alter table topic_notes          enable row level security;
alter table revision_intervals   enable row level security;
alter table revision_tasks       enable row level security;
alter table weakness_tags        enable row level security;
alter table ai_usage_limits      enable row level security;
alter table ai_cache             enable row level security;

-- ── Helper: is current user an allowed user? ─────────────────────────────
-- Used in RLS policies to restrict access to the two allowed users only.
create or replace function is_allowed_user()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from allowed_users
    where email = auth.email()
      and is_active = true
  );
$$;

-- ── profiles ─────────────────────────────────────────────────────────────
drop policy if exists "profiles: own read"   on profiles;
drop policy if exists "profiles: own update" on profiles;
drop policy if exists "profiles: peer read"  on profiles;

create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = id);

-- Both allowed users can see each other's basic profile (needed for shared features)
create policy "profiles: peer read"
  on profiles for select
  using (is_allowed_user());

-- ── allowed_users ─────────────────────────────────────────────────────────
drop policy if exists "allowed_users: read if allowed" on allowed_users;

create policy "allowed_users: read if allowed"
  on allowed_users for select
  using (is_allowed_user());

-- ── app_settings ──────────────────────────────────────────────────────────
drop policy if exists "app_settings: read if allowed" on app_settings;

create policy "app_settings: read if allowed"
  on app_settings for select
  using (is_allowed_user());

-- ── audit_logs ────────────────────────────────────────────────────────────
drop policy if exists "audit_logs: own read" on audit_logs;

create policy "audit_logs: own read"
  on audit_logs for select
  using (auth.uid() = user_id);

-- ── source_registry (seed/reference — both users can read) ───────────────
drop policy if exists "source_registry: read if allowed" on source_registry;

create policy "source_registry: read if allowed"
  on source_registry for select
  using (is_allowed_user());

-- ── material_import_logs ──────────────────────────────────────────────────
drop policy if exists "material_import_logs: own" on material_import_logs;

create policy "material_import_logs: own"
  on material_import_logs for all
  using (auth.uid() = user_id);

-- ── syllabus reference tables (seed — both users can read) ───────────────
drop policy if exists "syllabus_papers: read if allowed"    on syllabus_papers;
drop policy if exists "syllabus_topics: read if allowed"    on syllabus_topics;
drop policy if exists "syllabus_subtopics: read if allowed" on syllabus_subtopics;
drop policy if exists "revision_intervals: read if allowed" on revision_intervals;

create policy "syllabus_papers: read if allowed"
  on syllabus_papers for select
  using (is_allowed_user());

create policy "syllabus_topics: read if allowed"
  on syllabus_topics for select
  using (is_allowed_user());

create policy "syllabus_subtopics: read if allowed"
  on syllabus_subtopics for select
  using (is_allowed_user());

create policy "revision_intervals: read if allowed"
  on revision_intervals for select
  using (is_allowed_user());

-- ── topic_progress ────────────────────────────────────────────────────────
drop policy if exists "topic_progress: own private"  on topic_progress;
drop policy if exists "topic_progress: shared read"  on topic_progress;
drop policy if exists "topic_progress: own write"    on topic_progress;

-- User can read/write their own rows (both private and shared)
create policy "topic_progress: own private"
  on topic_progress for all
  using (auth.uid() = user_id);

-- Both allowed users can read shared rows from EITHER user
create policy "topic_progress: shared read"
  on topic_progress for select
  using (
    is_allowed_user()
    and visibility = 'shared_between_two'
  );

-- ── topic_notes ───────────────────────────────────────────────────────────
drop policy if exists "topic_notes: own private" on topic_notes;
drop policy if exists "topic_notes: shared read" on topic_notes;

create policy "topic_notes: own private"
  on topic_notes for all
  using (auth.uid() = user_id);

create policy "topic_notes: shared read"
  on topic_notes for select
  using (
    is_allowed_user()
    and visibility = 'shared_between_two'
  );

-- ── revision_tasks ────────────────────────────────────────────────────────
drop policy if exists "revision_tasks: own" on revision_tasks;

create policy "revision_tasks: own"
  on revision_tasks for all
  using (auth.uid() = user_id);

-- ── weakness_tags ─────────────────────────────────────────────────────────
drop policy if exists "weakness_tags: own private" on weakness_tags;
drop policy if exists "weakness_tags: shared read" on weakness_tags;

create policy "weakness_tags: own private"
  on weakness_tags for all
  using (auth.uid() = user_id);

create policy "weakness_tags: shared read"
  on weakness_tags for select
  using (
    is_allowed_user()
    and visibility = 'shared_between_two'
  );

-- ── ai_usage_limits ───────────────────────────────────────────────────────
drop policy if exists "ai_usage_limits: own" on ai_usage_limits;

create policy "ai_usage_limits: own"
  on ai_usage_limits for all
  using (auth.uid() = user_id);

-- ── ai_cache ─────────────────────────────────────────────────────────────
drop policy if exists "ai_cache: own" on ai_cache;

create policy "ai_cache: own"
  on ai_cache for all
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. AUTH TRIGGER: auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (
    new.id,
    new.email,
    -- First registered user (owner email from env is set via allowed_users seed)
    -- We default to second_user; the owner row in allowed_users carries the role.
    'second_user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- 10. SEED DATA
-- ---------------------------------------------------------------------------

-- ── Allowed users ──────────────────────────────────────────────────────────
-- NOTE: Do not insert hardcoded email addresses in schema migrations.
-- Seed initial allowlist users via supabase/seed.example.sql during deployment.

-- ── App settings ─────────────────────────────────────────────────────────
insert into app_settings (key, value, description) values
  ('phase',           '2A',           'Current app phase'),
  ('app_timezone',    'Asia/Kolkata', 'App timezone'),
  ('max_users',       '2',            'Maximum allowed users'),
  ('ai_enabled',      'false',        'Whether Gemini AI evaluation is enabled')
on conflict (key) do update set value = excluded.value;

-- ── Source registry (25 approved sources) ────────────────────────────────
insert into source_registry (name, domain, category, description, is_seed) values
  ('UPSC',              'upsc.gov.in',                   'government',      'Union Public Service Commission official site',           true),
  ('NCERT',             'ncert.nic.in',                  'education',       'NCERT textbooks and resources',                           true),
  ('PIB',               'pib.gov.in',                    'government',      'Press Information Bureau — official government releases',  true),
  ('India Budget',      'indiabudget.gov.in',             'government',      'Union Budget official documents',                         true),
  ('India Code',        'indiacode.nic.in',               'government',      'Indian legislation and acts',                             true),
  ('PRS India',         'prsindia.org',                   'research',        'PRS Legislative Research — bills and policy analysis',    true),
  ('Sansad',            'sansad.in',                      'government',      'Parliament of India official portal',                     true),
  ('RBI',               'rbi.org.in',                     'government',      'Reserve Bank of India — monetary policy and reports',     true),
  ('NITI Aayog',        'niti.gov.in',                    'government',      'NITI Aayog policy documents and reports',                 true),
  ('SDG India Index',   'sdgindiaindex.niti.gov.in',      'government',      'India SDG Index by NITI Aayog',                          true),
  ('Census India',      'censusindia.gov.in',             'government',      'Census of India data and reports',                        true),
  ('NFHS/IIPS',         'nfhsiips.in',                    'research',        'National Family Health Survey data',                      true),
  ('IIPS India',        'iipsindia.ac.in',                'research',        'International Institute for Population Sciences',         true),
  ('MoEFCC',            'moef.gov.in',                    'government',      'Ministry of Environment, Forest and Climate Change',      true),
  ('CPCB',              'cpcb.nic.in',                    'government',      'Central Pollution Control Board reports',                 true),
  ('MEA',               'mea.gov.in',                     'government',      'Ministry of External Affairs — foreign policy',           true),
  ('United Nations',    'un.org',                         'international',   'United Nations official documents and reports',           true),
  ('World Bank',        'worldbank.org',                  'international',   'World Bank reports and data',                             true),
  ('World Bank Data',   'data.worldbank.org',             'international',   'World Bank open data portal',                             true),
  ('IMF',               'imf.org',                        'international',   'International Monetary Fund reports',                     true),
  ('WTO',               'wto.org',                        'international',   'World Trade Organization trade data',                     true),
  ('WHO',               'who.int',                        'international',   'World Health Organization health reports',                true),
  ('UNFCCC',            'unfccc.int',                     'international',   'UN Framework Convention on Climate Change',               true),
  ('UNEP',              'unep.org',                       'international',   'United Nations Environment Programme',                    true),
  ('IPCC',              'ipcc.ch',                        'international',   'Intergovernmental Panel on Climate Change reports',       true),
  -- Newspaper notes tracker sources
  ('The Hindu',         'thehindu.com',                   'newspaper',       'The Hindu — editorial and news notes tracker',            true),
  ('Indian Express',    'indianexpress.com',              'newspaper',       'Indian Express — editorial and news notes tracker',       true),
  ('LiveMint',          'livemint.com',                   'newspaper',       'Mint — economy and policy news notes tracker',            true),
  ('Business Standard', 'business-standard.com',          'newspaper',       'Business Standard — economy news notes tracker',         true)
on conflict (domain) do update set
  name        = excluded.name,
  category    = excluded.category,
  description = excluded.description,
  is_seed     = true;

-- ── UPSC syllabus papers ─────────────────────────────────────────────────
insert into syllabus_papers (name, short_code, description, sort_order, is_seed) values
  ('GS Paper 1',       'GS1',      'History, Geography, Society, Art & Culture',               1, true),
  ('GS Paper 2',       'GS2',      'Polity, Governance, Social Justice, International Relations', 2, true),
  ('GS Paper 3',       'GS3',      'Economy, Environment, Security, Science, Agriculture, Disaster', 3, true),
  ('GS Paper 4',       'GS4',      'Ethics, Integrity and Aptitude',                            4, true),
  ('Essay',            'ESSAY',    'Essay paper',                                               5, true),
  ('CSAT',             'CSAT',     'Civil Services Aptitude Test (Paper 2)',                    6, true),
  ('Optional',         'OPT',      'Optional subject paper',                                    7, true),
  ('Current Affairs',  'CA',       'Current affairs across all papers',                         8, true)
on conflict (short_code) do update set
  name       = excluded.name,
  description = excluded.description,
  sort_order  = excluded.sort_order,
  is_seed     = true;

-- ── Revision intervals ────────────────────────────────────────────────────
insert into revision_intervals (days, label, sort_order, is_seed) values
  (1,   '1 Day',   1, true),
  (3,   '3 Days',  2, true),
  (7,   '1 Week',  3, true),
  (15,  '2 Weeks', 4, true),
  (30,  '1 Month', 5, true),
  (60,  '2 Months', 6, true),
  (90,  '3 Months', 7, true)
on conflict (days) do update set
  label      = excluded.label,
  sort_order = excluded.sort_order,
  is_seed    = true;

-- ---------------------------------------------------------------------------
-- 11. GRANT USAGE (anon + authenticated roles for RLS to work)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on source_registry, syllabus_papers, syllabus_topics,
  syllabus_subtopics, revision_intervals to authenticated;

-- ---------------------------------------------------------------------------
-- Done.
-- Apply this file in Supabase Dashboard > SQL Editor > New Query > Run
-- or via: supabase db push  (if using Supabase CLI with a linked project)
-- ---------------------------------------------------------------------------
