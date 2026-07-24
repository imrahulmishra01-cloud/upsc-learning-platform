-- Phase: Required Reading Matrix seed + new tables for remaining phases
-- 20240005_required_reading_matrix.sql

-- -----------------------------------------------------------------------------
-- PART 1: Seed material_library with Required Reading Matrix placeholders
-- Uses ON CONFLICT DO NOTHING to be idempotent (safe to re-run)
-- ALL entries: is_seed=true, copyright-safe metadata only, no file URLs
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_material_library_seed_title ON material_library(title) WHERE is_seed = true;

-- NCERT Foundation
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Class 6 History - Our Pasts I (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 7 History - Our Pasts II (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 8 History - Our Pasts III (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 9 History - India and the Contemporary World I (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 10 History - India and the Contemporary World II (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 History - Themes in World History (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 History - Themes in Indian History Part I (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 History - Themes in Indian History Part II (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 History - Themes in Indian History Part III (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / History', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 6 Geography - The Earth: Our Habitat (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 7 Geography - Our Environment (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 8 Geography - Resource and Development (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 9 Geography - Contemporary India I (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 10 Geography - Contemporary India II (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 Geography Part 1 - Fundamentals of Physical Geography (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 Geography Part 2 - India: Physical Environment (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 Geography Part 1 - Fundamentals of Human Geography (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 Geography Part 2 - India People and Economy (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Geography', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 6 Civics - Social and Political Life I (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 7 Civics - Social and Political Life II (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 8 Civics - Social and Political Life III (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 9 Political Science - Democratic Politics I (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 10 Political Science - Democratic Politics II (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 Political Science - Indian Constitution at Work (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 Political Science - Contemporary World Politics (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS2 / Polity', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 9 Economics - Economics (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS3 / Economy', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 10 Economics - Understanding Economic Development (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS3 / Economy', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 Economics - Indian Economic Development (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS3 / Economy', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 Economics - Introductory Macroeconomics (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS3 / Economy', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 6-10 Science (NCERT Selected Chapters)', 'seed_placeholder', 'NCERT Foundation', 'GS3 / Science & Tech', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 Biology (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS3 / Science & Tech', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 11 Sociology - Introducing Sociology (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Indian Society', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Class 12 Sociology - Indian Society (NCERT)', 'seed_placeholder', 'NCERT Foundation', 'GS1 / Indian Society', 'official_open', 'permission_granted', 'Freely available at ncert.nic.in', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- GS Paper 1
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Ancient India - Standard Reference (Placeholder)', 'seed_placeholder', 'GS1', 'Ancient History', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Medieval India - Standard Reference (Placeholder)', 'seed_placeholder', 'GS1', 'Medieval History', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Modern India - Standard Reference (Placeholder)', 'seed_placeholder', 'GS1', 'Modern History', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Post-Independence India - Reference (Placeholder)', 'seed_placeholder', 'GS1', 'Post-Independence India', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'World History - Key Events and Movements (Placeholder)', 'seed_placeholder', 'GS1', 'World History', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Indian Society - Social Issues and Trends (Placeholder)', 'seed_placeholder', 'GS1', 'Indian Society', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Indian Geography - Physical, Human, Economic (Placeholder)', 'seed_placeholder', 'GS1', 'Geography', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Art and Culture - Reference (Placeholder)', 'seed_placeholder', 'GS1', 'Art and Culture', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- GS Paper 2
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Indian Constitution - M. Laxmikanth Reference (Placeholder)', 'seed_placeholder', 'GS2', 'Indian Constitution', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Indian Polity - Governance and Institutions (Placeholder)', 'seed_placeholder', 'GS2', 'Indian Polity', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Parliament and State Legislatures - Reference (Placeholder)', 'seed_placeholder', 'GS2', 'Parliament', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Social Justice - Welfare Schemes Overview (Placeholder)', 'seed_placeholder', 'GS2', 'Social Justice', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'International Relations - India Foreign Policy (Placeholder)', 'seed_placeholder', 'GS2', 'International Relations', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'India and Neighbours - Neighbourhood Policy (Placeholder)', 'seed_placeholder', 'GS2', 'India and Neighbourhood', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Global Institutions - UN, WTO, IMF, World Bank (Placeholder)', 'seed_placeholder', 'GS2', 'Global Institutions', 'official_open', 'permission_granted', 'Official sources available at un.org, wto.org, worldbank.org', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- GS Paper 3
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Indian Economy - Reference (Placeholder)', 'seed_placeholder', 'GS3', 'Indian Economy', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Union Budget - Official GoI Document', 'seed_placeholder', 'GS3', 'Budget', 'official_open', 'permission_granted', 'Freely available at indiabudget.gov.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Economic Survey - Official GoI Document', 'seed_placeholder', 'GS3', 'Economic Survey', 'official_open', 'permission_granted', 'Freely available at indiabudget.gov.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Agriculture & Food Security - Reference (Placeholder)', 'seed_placeholder', 'GS3', 'Agriculture', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Environment & Ecology - Reference (Placeholder)', 'seed_placeholder', 'GS3', 'Environment', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Science & Technology - Reference (Placeholder)', 'seed_placeholder', 'GS3', 'Science and Technology', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Internal Security - Reference (Placeholder)', 'seed_placeholder', 'GS3', 'Internal Security', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Disaster Management - NDMA Guidelines', 'seed_placeholder', 'GS3', 'Disaster Management', 'official_open', 'permission_granted', 'Freely available at ndma.gov.in', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- GS Paper 4 / Ethics
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Ethics, Integrity and Aptitude - Reference (Placeholder)', 'seed_placeholder', 'GS4 / Ethics', 'Ethics Core', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Moral Thinkers - Philosophers and Their Ideas (Placeholder)', 'seed_placeholder', 'GS4 / Ethics', 'Moral Thinkers', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Case Studies - Ethics in Public Service (Placeholder)', 'seed_placeholder', 'GS4 / Ethics', 'Case Studies', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Examples Bank - Ethics for UPSC (Placeholder)', 'seed_placeholder', 'GS4 / Ethics', 'Examples Bank', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- Essay
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Essay - Philosophical Topics (Placeholder)', 'seed_placeholder', 'Essay', 'Philosophical Essays', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Essay - Quotes Bank (Placeholder)', 'seed_placeholder', 'Essay', 'Quotes Bank', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Essay - Examples Bank (Placeholder)', 'seed_placeholder', 'Essay', 'Examples Bank', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Essay Structure Guide (Placeholder)', 'seed_placeholder', 'Essay', 'Essay Structure', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- CSAT
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'CSAT - Reading Comprehension (Placeholder)', 'seed_placeholder', 'CSAT', 'Reading Comprehension', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'CSAT - Logical Reasoning (Placeholder)', 'seed_placeholder', 'CSAT', 'Logical Reasoning', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'CSAT - Quantitative Aptitude (Placeholder)', 'seed_placeholder', 'CSAT', 'Quantitative Aptitude', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'CSAT Previous Year Question Bank (Metadata Only)', 'seed_placeholder', 'CSAT', 'CSAT PYQs', 'official_open', 'permission_granted', 'UPSC official papers available at upsc.gov.in', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- Current Affairs Sources
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'PIB (Press Information Bureau) - Official', 'official_link', 'Current Affairs', 'Official Sources', 'official_open', 'permission_granted', 'Official GoI press releases at pib.gov.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'PRS India - Legislative Research', 'official_link', 'Current Affairs', 'Official Sources', 'official_open', 'permission_granted', 'Freely available at prsindia.org', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Economic Survey - Latest Edition (Official)', 'official_link', 'Current Affairs', 'Official Sources', 'official_open', 'permission_granted', 'Freely available at indiabudget.gov.in', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Yojana Magazine - Metadata Reference', 'seed_placeholder', 'Current Affairs', 'Government Periodicals', 'copyrighted', 'pending', 'Personal subscription required; do not upload without authorization', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Kurukshetra Magazine - Metadata Reference', 'seed_placeholder', 'Current Affairs', 'Government Periodicals', 'copyrighted', 'pending', 'Personal subscription required; do not upload without authorization', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Government Schemes Tracker (Self-Notes)', 'seed_placeholder', 'Current Affairs', 'Government Schemes', 'official_open', 'user_owned', 'Personal notes compiled from official sources', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'International Environment Conventions - UNFCCC, CBD, CITES', 'official_link', 'Current Affairs', 'Environment Conventions', 'official_open', 'permission_granted', 'Publicly available at unfccc.int and cbd.int', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- Geography Optional
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'Geography Optional - Geomorphology (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Geomorphology', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional - Climatology (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Climatology', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional - Oceanography (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Oceanography', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional - Human Geography (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Human Geography', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional - Economic Geography (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Economic Geography', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional - Indian Geography (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Indian Geography', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional - Models and Theories (Placeholder)', 'seed_placeholder', 'Geography Optional', 'Models and Theories', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Geography Optional PYQ Papers (Metadata Only)', 'seed_placeholder', 'Geography Optional', 'PYQ Papers', 'official_open', 'permission_granted', 'UPSC official papers available at upsc.gov.in', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- History Optional
INSERT INTO material_library (id, title, material_type, subject_area, category, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'History Optional - Ancient India (Placeholder)', 'seed_placeholder', 'History Optional', 'Ancient India', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'History Optional - Medieval India (Placeholder)', 'seed_placeholder', 'History Optional', 'Medieval India', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'History Optional - Modern India (Placeholder)', 'seed_placeholder', 'History Optional', 'Modern India', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'History Optional - World History (Placeholder)', 'seed_placeholder', 'History Optional', 'World History', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'History Optional - Historiography (Placeholder)', 'seed_placeholder', 'History Optional', 'Historiography', 'copyrighted', 'pending', 'Upload authorized copy with legal consent', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'History Optional PYQ Papers (Metadata Only)', 'seed_placeholder', 'History Optional', 'PYQ Papers', 'official_open', 'permission_granted', 'UPSC official papers available at upsc.gov.in', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;

-- Official Sources
INSERT INTO material_library (id, title, material_type, subject_area, category, external_url, copyright_status, permission_status, permission_notes, is_seed, owned_by_user, visibility, status)
VALUES
  (gen_random_uuid(), 'UPSC Official Syllabus', 'official_link', 'Official Sources', 'UPSC Official', 'https://upsc.gov.in/examinations/prelims/civil-services-examination', 'official_open', 'permission_granted', 'Official UPSC resource', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'UPSC Previous Year Question Papers', 'official_link', 'Official Sources', 'UPSC Official', 'https://upsc.gov.in/examinations/previous-question-papers', 'official_open', 'permission_granted', 'Official UPSC resource', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'NCERT Official Portal', 'official_link', 'Official Sources', 'Education', 'https://ncert.nic.in', 'official_open', 'permission_granted', 'Free access to all NCERT textbooks', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'PIB - Press Information Bureau', 'official_link', 'Official Sources', 'Government', 'https://pib.gov.in', 'official_open', 'permission_granted', 'Official GoI press releases', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'PRS India', 'official_link', 'Official Sources', 'Legislative Research', 'https://prsindia.org', 'official_open', 'permission_granted', 'Free legislative research', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'India Budget Portal', 'official_link', 'Official Sources', 'Government', 'https://indiabudget.gov.in', 'official_open', 'permission_granted', 'Official budget documents', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'RBI - Reserve Bank of India', 'official_link', 'Official Sources', 'Government', 'https://rbi.org.in', 'official_open', 'permission_granted', 'Official RBI publications and reports', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'NITI Aayog Publications', 'official_link', 'Official Sources', 'Government', 'https://niti.gov.in', 'official_open', 'permission_granted', 'Free official publications', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Census India', 'official_link', 'Official Sources', 'Government', 'https://censusindia.gov.in', 'official_open', 'permission_granted', 'Official census data', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'World Bank Open Data', 'official_link', 'Official Sources', 'International', 'https://data.worldbank.org', 'official_open', 'permission_granted', 'Free World Bank data', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'UNDP Human Development Reports', 'official_link', 'Official Sources', 'International', 'https://hdr.undp.org', 'official_open', 'permission_granted', 'Free UNDP publications', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'IPCC Reports', 'official_link', 'Official Sources', 'Environment', 'https://ipcc.ch', 'official_open', 'permission_granted', 'Free IPCC publications', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'India Code (Legal Texts)', 'official_link', 'Official Sources', 'Government', 'https://indiacode.nic.in', 'official_open', 'permission_granted', 'Official legal documents', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'Sansad.in - Parliament Portal', 'official_link', 'Official Sources', 'Government', 'https://sansad.in', 'official_open', 'permission_granted', 'Official parliament information', true, false, 'shared_between_two', 'active'),
  (gen_random_uuid(), 'MEA - Ministry of External Affairs', 'official_link', 'Official Sources', 'Government', 'https://mea.gov.in', 'official_open', 'permission_granted', 'Official MEA publications', true, false, 'shared_between_two', 'active')
ON CONFLICT (title) WHERE is_seed = true DO NOTHING;


-- -----------------------------------------------------------------------------
-- PART 2: New tables for Stages 3-8 (Current Affairs enhanced, PYQ, CSAT, etc.)
-- Table count before: 29 (after Phase 3C)
-- Table count after this migration: 36
-- New tables: current_affairs_entries, pyq_questions, pyq_attempts, csat_sessions,
--             answer_submissions, revision_items, test_sessions
-- -----------------------------------------------------------------------------

-- -- current_affairs_entries (enhanced from existing current_affairs_registry concept)
-- The existing current_affairs_registry table only tracks headline+notes
-- We add a richer table for the full current affairs workflow
CREATE TABLE IF NOT EXISTS current_affairs_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline text NOT NULL,
  article_date date,
  source_name text,
  source_url text,
  source_category text DEFAULT 'newspaper' CHECK (source_category IN ('newspaper', 'pib', 'prs', 'rbi', 'report', 'government', 'international', 'academic', 'other')),
  region text DEFAULT 'national' CHECK (region IN ('national', 'international', 'state', 'both')),
  gs_papers text[], -- ['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional']
  topic text,
  subtopic text,
  prelims_relevance boolean DEFAULT false,
  mains_relevance boolean DEFAULT false,
  essay_relevance boolean DEFAULT false,
  optional_relevance boolean DEFAULT false,
  importance text DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'very_high')),
  user_notes text,
  revision_date date,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'noted', 'revised', 'skipped')),
  tags text[],
  visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'shared_between_two')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE current_affairs_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own current_affairs" ON current_affairs_entries;
CREATE POLICY "Users can select own current_affairs" ON current_affairs_entries
  FOR SELECT USING (auth.uid() = user_id OR (visibility = 'shared_between_two' AND public.is_allowed_user()));
DROP POLICY IF EXISTS "Users can insert own current_affairs" ON current_affairs_entries;
CREATE POLICY "Users can insert own current_affairs" ON current_affairs_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own current_affairs" ON current_affairs_entries;
CREATE POLICY "Users can update own current_affairs" ON current_affairs_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own current_affairs" ON current_affairs_entries;
CREATE POLICY "Users can delete own current_affairs" ON current_affairs_entries
  FOR DELETE USING (auth.uid() = user_id);

-- -- pyq_questions
CREATE TABLE IF NOT EXISTS pyq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year >= 1979 AND year <= 2030),
  exam_stage text NOT NULL CHECK (exam_stage IN ('prelims', 'mains', 'optional')),
  paper text NOT NULL, -- 'GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Essay', 'History', 'Geography', etc.
  subject text,
  topic text,
  subtopic text,
  question_text text, -- NULL if not legally entered; users enter manually
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id),
  marks integer,
  word_limit integer,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  trend_tags text[],
  is_seed boolean DEFAULT false, -- seeds from official UPSC metadata only
  source_note text DEFAULT 'UPSC Official',
  visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'shared_between_two')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pyq_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read pyq_questions" ON pyq_questions;
CREATE POLICY "Users can read pyq_questions" ON pyq_questions
  FOR SELECT USING (created_by = auth.uid() OR ((is_seed = true OR visibility = 'shared_between_two') AND public.is_allowed_user()));
DROP POLICY IF EXISTS "Users can insert own pyq_questions" ON pyq_questions;
CREATE POLICY "Users can insert own pyq_questions" ON pyq_questions
  FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Users can update own pyq_questions" ON pyq_questions;
CREATE POLICY "Users can update own pyq_questions" ON pyq_questions
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Authenticated users can update pyq_questions" ON pyq_questions;

-- -- pyq_attempts (per-user attempts and mistake tracking)
CREATE TABLE IF NOT EXISTS pyq_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pyq_id uuid NOT NULL REFERENCES pyq_questions(id) ON DELETE CASCADE,
  attempt_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'attempted', 'skipped', 'revised')),
  user_answer_text text,
  self_score integer CHECK (self_score IS NULL OR (self_score >= 0 AND self_score <= 100)),
  mistake_type text CHECK (mistake_type IN ('factual', 'concept', 'overthinking', 'bad_elimination', 'silly', 'guessed_correct', 'guessed_wrong', 'none')),
  mistake_notes text,
  revision_needed boolean DEFAULT false,
  revision_date date,
  linked_material_id uuid REFERENCES material_library(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, pyq_id, attempt_date)
);

ALTER TABLE pyq_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own pyq_attempts" ON pyq_attempts;
CREATE POLICY "Users can select own pyq_attempts" ON pyq_attempts
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own pyq_attempts" ON pyq_attempts;
CREATE POLICY "Users can insert own pyq_attempts" ON pyq_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own pyq_attempts" ON pyq_attempts;
CREATE POLICY "Users can update own pyq_attempts" ON pyq_attempts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own pyq_attempts" ON pyq_attempts;
CREATE POLICY "Users can delete own pyq_attempts" ON pyq_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- -- csat_sessions (CSAT practice sessions)
CREATE TABLE IF NOT EXISTS csat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('practice', 'timed_test', 'pyq_review', 'weak_area')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  topic_areas text[], -- ['reading_comprehension', 'logical_reasoning', etc.]
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  score_pct numeric,
  weak_areas_identified text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE csat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own csat_sessions" ON csat_sessions;
CREATE POLICY "Users can select own csat_sessions" ON csat_sessions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own csat_sessions" ON csat_sessions;
CREATE POLICY "Users can insert own csat_sessions" ON csat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own csat_sessions" ON csat_sessions;
CREATE POLICY "Users can update own csat_sessions" ON csat_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -- answer_submissions (AI-evaluated or self-evaluated answers)
CREATE TABLE IF NOT EXISTS answer_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pyq_id uuid REFERENCES pyq_questions(id),
  session_type text NOT NULL CHECK (session_type IN ('daily_practice', 'weekly_test', 'monthly_test', 'essay', 'optional', 'csat')),
  paper text, -- 'GS1', 'GS2', etc.
  question_text text NOT NULL,
  answer_text text NOT NULL, -- pasted by user; no OCR
  word_count integer,
  max_marks integer,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  evaluation_status text DEFAULT 'pending' CHECK (evaluation_status IN ('pending', 'processing', 'done', 'failed', 'limit_reached', 'self_evaluated')),
  -- AI evaluation output (JSON stored as text for flexibility)
  marks_awarded numeric,
  evaluation_feedback jsonb,
  ai_model_used text,
  ai_tokens_used integer,
  -- Duplicate detection
  answer_hash text,
  -- Self-evaluation fallback
  self_marks integer,
  self_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE answer_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own answer_submissions" ON answer_submissions;
CREATE POLICY "Users can select own answer_submissions" ON answer_submissions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own answer_submissions" ON answer_submissions;
CREATE POLICY "Users can insert own answer_submissions" ON answer_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own answer_submissions" ON answer_submissions;
CREATE POLICY "Users can update own answer_submissions" ON answer_submissions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -- revision_items (enhanced revision tracker beyond existing revision_tasks)
CREATE TABLE IF NOT EXISTS revision_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('topic', 'current_affairs', 'pyq', 'material', 'note', 'weakness')),
  title text NOT NULL,
  source_id uuid, -- generic FK: could be material_id, pyq_id, current_affairs_id
  source_type text, -- 'material_library', 'pyq_questions', 'current_affairs_entries'
  due_date date NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'snoozed', 'skipped')),
  snoozed_until date,
  revision_note text,
  next_revision_date date, -- auto-computed by spaced repetition
  repetition_count integer DEFAULT 0,
  last_score integer CHECK (last_score IS NULL OR (last_score >= 0 AND last_score <= 5)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE revision_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own revision_items" ON revision_items;
CREATE POLICY "Users can select own revision_items" ON revision_items
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own revision_items" ON revision_items;
CREATE POLICY "Users can insert own revision_items" ON revision_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own revision_items" ON revision_items;
CREATE POLICY "Users can update own revision_items" ON revision_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own revision_items" ON revision_items;
CREATE POLICY "Users can delete own revision_items" ON revision_items
  FOR DELETE USING (auth.uid() = user_id);

-- -- test_sessions (mock tests / weekly tests / monthly tests)
CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type text NOT NULL CHECK (test_type IN ('daily', 'weekly', 'monthly', 'essay', 'optional', 'csat')),
  title text,
  paper text,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  total_questions integer,
  total_marks integer,
  obtained_marks numeric,
  score_pct numeric,
  duration_minutes integer,
  status text DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'submitted', 'evaluated', 'abandoned')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own test_sessions" ON test_sessions;
CREATE POLICY "Users can select own test_sessions" ON test_sessions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own test_sessions" ON test_sessions;
CREATE POLICY "Users can insert own test_sessions" ON test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own test_sessions" ON test_sessions;
CREATE POLICY "Users can update own test_sessions" ON test_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_current_affairs_user_date ON current_affairs_entries(user_id, article_date DESC);
CREATE INDEX IF NOT EXISTS idx_current_affairs_status ON current_affairs_entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pyq_year_paper ON pyq_questions(year, exam_stage, paper);
CREATE INDEX IF NOT EXISTS idx_pyq_attempts_user ON pyq_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_user ON answer_submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_revision_items_due ON revision_items(user_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user ON test_sessions(user_id, test_type, started_at DESC);
