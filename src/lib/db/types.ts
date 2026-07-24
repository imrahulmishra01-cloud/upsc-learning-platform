/**
 * Phase 2A + 2B TypeScript types for the UPSC app database schema.
 * Phase 2A: supabase/migrations/20240001_phase2a_foundation.sql
 * Phase 2B: supabase/migrations/20240002_phase2b_planner_dashboard.sql
 *
 * Hand-written types. Consider `supabase gen types typescript` in Phase 2C.
 */

// ── Enums ─────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "second_user";
export type VisibilityType = "private" | "shared_between_two";
export type ImportStatus = "pending" | "processing" | "done" | "failed";
export type AuditAction = "insert" | "update" | "delete" | "login" | "logout" | "access_denied";

// ── Access / Security ────────────────────────────────────────────────────

export interface Profile {
  id: string;           // uuid, FK → auth.users
  email: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AllowedUser {
  id: string;           // uuid
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;           // uuid
  user_id: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}

// ── Source Registry ───────────────────────────────────────────────────────

export interface SourceRegistry {
  id: string;           // uuid
  name: string;
  domain: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialImportLog {
  id: string;           // uuid
  user_id: string;
  source_id: string | null;
  url: string | null;
  status: ImportStatus;
  error_msg: string | null;
  created_at: string;
  updated_at: string;
}

// ── Syllabus Foundation ───────────────────────────────────────────────────

export interface SyllabusPaper {
  id: string;           // uuid
  name: string;
  short_code: string;
  description: string | null;
  sort_order: number;
  is_seed: boolean;
  created_at: string;
}

export interface SyllabusTopic {
  id: string;           // uuid
  paper_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyllabusSubtopic {
  id: string;           // uuid
  topic_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicProgress {
  id: string;           // uuid
  user_id: string;
  topic_id: string;
  visibility: VisibilityType;
  coverage_pct: number;         // 0–100
  confidence_score: number;     // 0–5
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicNote {
  id: string;           // uuid
  user_id: string;
  topic_id: string | null;
  subtopic_id: string | null;
  visibility: VisibilityType;
  title: string | null;
  content: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// ── Revision Foundation ───────────────────────────────────────────────────

export interface RevisionInterval {
  id: string;           // uuid
  days: number;
  label: string;
  sort_order: number;
  is_seed: boolean;
  created_at: string;
}

export interface RevisionTask {
  id: string;           // uuid
  user_id: string;
  topic_id: string | null;
  subtopic_id: string | null;
  visibility: VisibilityType;
  interval_id: string | null;
  due_date: string;             // date
  completed_at: string | null;
  score: number | null;         // 0–5
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeaknessTag {
  id: string;           // uuid
  user_id: string;
  topic_id: string | null;
  subtopic_id: string | null;
  visibility: VisibilityType;
  tag: string;
  severity: number;             // 1–3
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── AI Usage Placeholders ─────────────────────────────────────────────────

export interface AiUsageLimit {
  id: string;           // uuid
  user_id: string;
  daily_limit: number;
  used_today: number;
  last_reset_date: string;      // date
  created_at: string;
  updated_at: string;
}

export interface AiCache {
  id: string;           // uuid
  user_id: string;
  prompt_hash: string;
  response: string | null;
  model: string | null;
  expires_at: string | null;
  created_at: string;
}

// ── Source categories (for UI filtering) ─────────────────────────────────
export const SOURCE_CATEGORIES = [
  "government",
  "international",
  "education",
  "research",
  "newspaper",
] as const;

export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

// =============================================================================
// Phase 2B — Planner + Dashboard Foundation
// =============================================================================

// ── Planner literal types ─────────────────────────────────────────────────

export type PlanPace     = "slow" | "normal" | "aggressive";
export type PlanStatus   = "draft" | "active" | "paused" | "completed" | "archived";
export type GoalStatus   = "active" | "completed" | "paused" | "archived";
export type TargetStatus = "planned" | "active" | "completed" | "missed" | "adjusted";
export type TaskStatus   = "pending" | "in_progress" | "completed" | "skipped" | "moved" | "cancelled";
export type BacklogStatus = "open" | "rescheduled" | "completed" | "ignored";
export type GeneratedBy  = "manual" | "future_generator";

// ── study_plans ───────────────────────────────────────────────────────────

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;                   // date
  target_date: string;                  // date
  daily_available_minutes: number;
  pace: PlanPace;
  status: PlanStatus;
  visibility: VisibilityType;
  generator_ready: boolean;
  generated_by: GeneratedBy;
  backlog_buffer_days: number;
  revision_strategy: string;
  created_at: string;
  updated_at: string;
}

// ── study_goals ───────────────────────────────────────────────────────────

export interface StudyGoal {
  id: string;
  user_id: string;
  plan_id: string | null;
  title: string;
  description: string | null;
  goal_type: string;
  target_date: string | null;           // date
  status: GoalStatus;
  priority: number;                     // 1–3
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── monthly_targets ───────────────────────────────────────────────────────

export interface MonthlyTarget {
  id: string;
  user_id: string;
  plan_id: string | null;
  month_start: string;                  // date
  month_end: string;                    // date
  title: string;
  focus_area: string | null;
  target_minutes: number;
  status: TargetStatus;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── weekly_targets ────────────────────────────────────────────────────────

export interface WeeklyTarget {
  id: string;
  user_id: string;
  plan_id: string | null;
  monthly_target_id: string | null;
  week_start: string;                   // date
  week_end: string;                     // date
  title: string;
  focus_area: string | null;
  target_minutes: number;
  status: TargetStatus;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── daily_tasks ───────────────────────────────────────────────────────────

export interface DailyTask {
  id: string;
  user_id: string;
  plan_id: string | null;
  weekly_target_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  title: string;
  description: string | null;
  task_type: string;
  task_date: string;                    // date
  estimated_minutes: number;
  actual_minutes: number;
  status: TaskStatus;
  priority: number;                     // 1–3
  visibility: VisibilityType;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── backlog_items ─────────────────────────────────────────────────────────

export interface BacklogItem {
  id: string;
  user_id: string;
  plan_id: string | null;
  source_task_id: string | null;
  title: string;
  reason: string | null;
  due_date: string | null;              // date
  status: BacklogStatus;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── study_sessions ────────────────────────────────────────────────────────

export interface StudySession {
  id: string;
  user_id: string;
  plan_id: string | null;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  session_type: string;
  notes: string | null;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── time_logs ─────────────────────────────────────────────────────────────

export interface TimeLog {
  id: string;
  user_id: string;
  plan_id: string | null;
  task_id: string | null;
  log_date: string;                     // date
  minutes: number;
  activity_type: string;
  notes: string | null;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── Planner dashboard summary (computed, not a table) ─────────────────────

export interface PlannerSummary {
  activePlan: StudyPlan | null;
  todayTasksTotal: number;
  todayTasksDone: number;
  todayMinutesLogged: number;
  revisionDueCount: number;
  weeklyTargetMinutes: number;
  weeklyLoggedMinutes: number;
  backlogOpenCount: number;
  caRevisionDueCount: number;
}

// =============================================================================
// Phase 3A — Material Vault & Required Reading Matrix
// =============================================================================

export type UploadStatus = "pending" | "uploaded" | "failed" | "archived";
export type MaterialType = "uploaded_file" | "official_link" | "seed_placeholder";
export type CopyrightStatus = "official_open" | "public_domain" | "copyrighted" | "unknown";
export type PermissionStatus = "permission_granted" | "user_owned" | "pending" | "none";

export interface UploadedFile {
  id: string;                           // uuid
  user_id: string;
  bucket: string;
  object_key: string;
  original_filename: string;
  display_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  file_ext: string | null;
  category: string;
  source_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  visibility: VisibilityType;
  upload_status: UploadStatus;
  tags: string[] | null;
  description: string | null;
  legal_consent_given: boolean;
  copyright_status: CopyrightStatus | null;
  permission_status: PermissionStatus | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialLibrary {
  id: string;                           // uuid
  user_id: string | null;               // null for global seeds
  uploaded_file_id: string | null;
  source_id: string | null;
  title: string;
  description: string | null;
  material_type: MaterialType;
  subject_area: string | null;
  paper_id: string | null;
  category: string;
  external_url: string | null;
  visibility: VisibilityType;
  is_seed: boolean;
  status: string;                       // active, archived
  tags: string[] | null;
  copyright_status: CopyrightStatus | null;
  permission_status: PermissionStatus | null;
  permission_notes: string | null;
  owned_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrentAffairsRegistry {
  id: string;                           // uuid
  user_id: string;
  headline: string;
  article_date: string | null;          // date
  source_name: string | null;
  external_url: string | null;
  user_notes: string | null;
  upsc_relevance: string | null;
  topic_tags: string[] | null;
  revision_date: string | null;         // date
  created_at: string;
  updated_at: string;
}

// ── Phase 3C: Reading Tracker + Material Notes ────────────────────────────

export type ProgressStatus = "not_started" | "reading" | "completed";

export interface MaterialReadingProgress {
  id: string;                           // uuid
  user_id: string;
  material_id: string;
  status: ProgressStatus;
  last_page: number | null;
  scroll_percent: number | null;
  last_viewed_at: string | null;        // timestamptz
  completed_at: string | null;          // timestamptz
  created_at: string;
  updated_at: string;
}

export type NoteType = 
  | "general" 
  | "summary" 
  | "doubt" 
  | "quote" 
  | "fact" 
  | "mains_point" 
  | "prelims_fact" 
  | "optional_note";

export interface MaterialNote {
  id: string;                           // uuid
  user_id: string;
  material_id: string;
  title: string | null;
  body: string;
  page_number: number | null;
  note_type: NoteType;
  tags: string[] | null;
  status: string;                       // active, archived
  created_at: string;
  updated_at: string;
}

// ── Stage 3: Current Affairs ──────────────────────────────────────────────

export type CurrentAffairsRegion = "national" | "international" | "state" | "both";
export type CurrentAffairsImportance = "low" | "medium" | "high" | "very_high";
export type CurrentAffairsStatus = "unread" | "read" | "noted" | "revised" | "skipped";
export type CASourceCategory = "newspaper" | "pib" | "prs" | "rbi" | "report" | "government" | "international" | "academic" | "other";

export interface CurrentAffairsEntry {
  id: string;                           // uuid
  user_id: string;
  headline: string;
  article_date: string | null;          // date
  source_name: string | null;
  source_url: string | null;
  source_category: CASourceCategory;
  region: CurrentAffairsRegion;
  gs_papers: string[] | null;
  topic: string | null;
  subtopic: string | null;
  prelims_relevance: boolean;
  mains_relevance: boolean;
  essay_relevance: boolean;
  optional_relevance: boolean;
  importance: CurrentAffairsImportance;
  user_notes: string | null;
  revision_date: string | null;         // date
  status: CurrentAffairsStatus;
  tags: string[] | null;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

// ── Stage 4: PYQ ──────────────────────────────────────────────────────────

export type ExamStage = "prelims" | "mains" | "optional";
export type Difficulty = "easy" | "medium" | "hard";
export type MistakeType = "factual" | "concept" | "overthinking" | "bad_elimination" | "silly" | "guessed_correct" | "guessed_wrong" | "none";
export type AttemptStatus = "pending" | "attempted" | "skipped" | "revised";

export interface PyqQuestion {
  id: string;                           // uuid
  year: number;
  exam_stage: ExamStage;
  paper: string;                        // 'GS1', 'GS2', etc.
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  question_text: string | null;         // user-entered manually
  marks: number | null;
  word_limit: number | null;
  difficulty: Difficulty;
  trend_tags: string[] | null;
  is_seed: boolean;
  source_note: string | null;
  visibility: VisibilityType;
  created_at: string;
  updated_at: string;
}

export interface PyqAttempt {
  id: string;                           // uuid
  user_id: string;
  pyq_id: string;
  attempt_date: string;                 // date
  status: AttemptStatus;
  user_answer_text: string | null;
  self_score: number | null;
  mistake_type: MistakeType | null;
  mistake_notes: string | null;
  revision_needed: boolean;
  revision_date: string | null;         // date
  linked_material_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Stage 4: CSAT ─────────────────────────────────────────────────────────

export type CsatSessionType = "practice" | "timed_test" | "pyq_review" | "weak_area";

export interface CsatSession {
  id: string;                           // uuid
  user_id: string;
  session_type: CsatSessionType;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  topic_areas: string[] | null;
  questions_attempted: number;
  questions_correct: number;
  score_pct: number | null;
  weak_areas_identified: string[] | null;
  notes: string | null;
  created_at: string;
}

// ── Stage 7: Answer Submissions + AI ─────────────────────────────────────

export type EvaluationStatus = "pending" | "processing" | "done" | "failed" | "limit_reached" | "self_evaluated";
export type AnswerSessionType = "daily_practice" | "weekly_test" | "monthly_test" | "essay" | "optional" | "csat";

export interface AnswerSubmission {
  id: string;                           // uuid
  user_id: string;
  pyq_id: string | null;
  session_type: AnswerSessionType;
  paper: string | null;
  question_text: string;
  answer_text: string;
  word_count: number | null;
  max_marks: number | null;
  submitted_at: string;
  evaluation_status: EvaluationStatus;
  marks_awarded: number | null;
  evaluation_feedback: Record<string, unknown> | null;  // JSON
  ai_model_used: string | null;
  ai_tokens_used: number | null;
  answer_hash: string | null;
  self_marks: number | null;
  self_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Stage 6: Revision Items ───────────────────────────────────────────────

export type RevisionItemType = "topic" | "current_affairs" | "pyq" | "material" | "note" | "weakness";
export type RevisionPriority = "low" | "medium" | "high" | "critical";
export type RevisionStatus = "pending" | "done" | "snoozed" | "skipped";

export interface RevisionItem {
  id: string;                           // uuid
  user_id: string;
  item_type: RevisionItemType;
  title: string;
  source_id: string | null;
  source_type: string | null;
  due_date: string;                     // date
  priority: RevisionPriority;
  status: RevisionStatus;
  snoozed_until: string | null;         // date
  revision_note: string | null;
  next_revision_date: string | null;    // date
  repetition_count: number;
  last_score: number | null;
  created_at: string;
  updated_at: string;
}

// ── Stage 7: Test Sessions ────────────────────────────────────────────────

export type TestType = "daily" | "weekly" | "monthly" | "essay" | "optional" | "csat";
export type TestStatus = "ongoing" | "submitted" | "evaluated" | "abandoned";

export interface TestSession {
  id: string;                           // uuid
  user_id: string;
  test_type: TestType;
  title: string | null;
  paper: string | null;
  started_at: string;
  submitted_at: string | null;
  total_questions: number | null;
  total_marks: number | null;
  obtained_marks: number | null;
  score_pct: number | null;
  duration_minutes: number | null;
  status: TestStatus;
  notes: string | null;
  created_at: string;
}
