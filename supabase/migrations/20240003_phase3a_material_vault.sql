-- ==============================================================================
-- Phase 3A: Material Vault & Required Reading Matrix
-- ==============================================================================

-- 1. uploaded_files table
create table public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  object_key text not null unique,
  original_filename text not null,
  display_name text not null,
  mime_type text,
  size_bytes bigint,
  file_ext text,
  category text not null default 'other',
  source_id uuid references public.source_registry(id) on delete set null,
  topic_id uuid references public.syllabus_topics(id) on delete set null,
  subtopic_id uuid references public.syllabus_subtopics(id) on delete set null,
  visibility visibility_type not null default 'private',
  upload_status text not null default 'pending',
  tags text[],
  description text,
  legal_consent_given boolean not null default false,
  copyright_status text,
  permission_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. material_library table (Required Reading Matrix placeholders + user files)
create table public.material_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  uploaded_file_id uuid references public.uploaded_files(id) on delete set null,
  source_id uuid references public.source_registry(id) on delete set null,
  title text not null,
  description text,
  material_type text not null default 'uploaded_file',
  subject_area text,
  paper_id uuid references public.syllabus_papers(id) on delete set null,
  category text not null default 'other',
  external_url text,
  visibility visibility_type not null default 'private',
  is_seed boolean not null default false,
  status text not null default 'active',
  tags text[],
  copyright_status text,
  permission_status text,
  permission_notes text,
  owned_by_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. current_affairs_registry table
create table public.current_affairs_registry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  headline text not null,
  article_date date,
  source_name text,
  external_url text,
  user_notes text,
  upsc_relevance text,
  topic_tags text[],
  revision_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- RLS Setup
-- ==============================================================================

alter table public.uploaded_files enable row level security;
alter table public.material_library enable row level security;
alter table public.current_affairs_registry enable row level security;

-- uploaded_files policies
create policy "Users can read own uploaded files"
  on public.uploaded_files for select
  using (auth.uid() = user_id);

create policy "Users can read shared uploaded files"
  on public.uploaded_files for select
  using (
    visibility = 'shared_between_two'
    and public.is_allowed_user()
  );

create policy "Users can insert own uploaded files"
  on public.uploaded_files for insert
  with check (auth.uid() = user_id);

create policy "Users can update own uploaded files"
  on public.uploaded_files for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- material_library policies
create policy "Users can read own material library items"
  on public.material_library for select
  using (auth.uid() = user_id);

create policy "Users can read shared material library items"
  on public.material_library for select
  using (
    visibility = 'shared_between_two'
    and public.is_allowed_user()
  );

create policy "Users can read seed material library items"
  on public.material_library for select
  using (is_seed = true and public.is_allowed_user());

create policy "Users can insert own material library items"
  on public.material_library for insert
  with check (auth.uid() = user_id);

create policy "Users can update own material library items"
  on public.material_library for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- current_affairs_registry policies
create policy "Users can read own current affairs"
  on public.current_affairs_registry for select
  using (auth.uid() = user_id);

create policy "Users can insert own current affairs"
  on public.current_affairs_registry for insert
  with check (auth.uid() = user_id);

create policy "Users can update own current affairs"
  on public.current_affairs_registry for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- Seed Data (Material Library Placeholders for Required Reading Matrix)
-- ==============================================================================
-- Just a few initial seed items representing the broad matrix structure as requested.
-- These intentionally do not include unauthorized PDF links.

insert into public.material_library (
  title, description, material_type, subject_area, category, is_seed, copyright_status, permission_status, permission_notes
) values
('NCERT Foundation: History Class 6-12', 'Official textbooks for ancient, medieval, modern history', 'seed_placeholder', 'NCERT Foundation', 'ncert', true, 'official_open', 'permission_granted', 'Available free on NCERT website'),
('NCERT Foundation: Geography Class 6-12', 'Official textbooks for physical and human geography', 'seed_placeholder', 'NCERT Foundation', 'ncert', true, 'official_open', 'permission_granted', 'Available free on NCERT website'),
('GS1: Art and Culture (Standard Material)', 'Placeholder for standard reference book (e.g., Nitin Singhania or equivalent)', 'seed_placeholder', 'GS1', 'standard_book', true, 'copyrighted', 'pending', 'User must upload or track owned copy'),
('GS2: Indian Polity (Standard Material)', 'Placeholder for standard reference book (e.g., Laxmikanth or equivalent)', 'seed_placeholder', 'GS2', 'standard_book', true, 'copyrighted', 'pending', 'User must upload or track owned copy'),
('GS3: Economy (Standard Material)', 'Placeholder for standard reference book (e.g., Ramesh Singh or equivalent)', 'seed_placeholder', 'GS3', 'standard_book', true, 'copyrighted', 'pending', 'User must upload or track owned copy'),
('GS4: Lexicon for Ethics', 'Placeholder for Ethics terminology and case studies reference', 'seed_placeholder', 'GS4', 'standard_book', true, 'copyrighted', 'pending', 'User must upload or track owned copy'),
('Geography Optional: Physical Geography', 'Placeholder for standard reference (e.g., Savindra Singh)', 'seed_placeholder', 'Geography Optional', 'optional', true, 'copyrighted', 'pending', 'User must upload or track owned copy'),
('History Optional: Ancient India', 'Placeholder for standard reference (e.g., Upinder Singh or RS Sharma)', 'seed_placeholder', 'History Optional', 'optional', true, 'copyrighted', 'pending', 'User must upload or track owned copy');
