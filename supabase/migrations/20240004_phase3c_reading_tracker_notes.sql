-- Phase 3C: Reading Tracker + Material Notes
-- Expected Table Count after this: 29

-- 1. material_reading_progress
CREATE TABLE material_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES material_library(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'reading', 'completed')),
  last_page integer CHECK (last_page IS NULL OR last_page >= 1),
  scroll_percent numeric CHECK (scroll_percent IS NULL OR (scroll_percent >= 0 AND scroll_percent <= 100)),
  last_viewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, material_id)
);

ALTER TABLE material_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own progress" ON material_reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON material_reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON material_reading_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON material_reading_progress
  FOR DELETE USING (auth.uid() = user_id);

-- 2. material_notes
CREATE TABLE material_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES material_library(id) ON DELETE CASCADE,
  title text,
  body text NOT NULL CHECK (length(trim(body)) > 0),
  page_number integer CHECK (page_number IS NULL OR page_number >= 1),
  note_type text NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'summary', 'doubt', 'quote', 'fact', 'mains_point', 'prelims_fact', 'optional_note')),
  tags text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE material_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own notes" ON material_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON material_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON material_notes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON material_notes
  FOR DELETE USING (auth.uid() = user_id);
