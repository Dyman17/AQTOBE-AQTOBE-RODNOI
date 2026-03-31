export type AppRole = "guest" | "student" | "parent" | "teacher" | "admin";

export type AuthMode = "quick" | "credentials";

export type SessionUser = {
  role: Exclude<AppRole, "guest">;
  user_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  linked_student_id?: string | null;
  linked_teacher_id?: string | null;
  class_id?: string | null;
};

export type PersistedSession = {
  token: string;
  role: Exclude<AppRole, "guest">;
  authMode: AuthMode;
};

export type HealthPayload = {
  status: string;
  service: string;
  version: string;
  time: string;
  uptime_seconds: number;
};

export type GradesSubject = {
  name: string;
  grades: number[];
  attendance: number;
  topics: string[];
  missing_assignments?: number;
};

export type GradesPayload = {
  student: string;
  class_id?: string;
  subjects: GradesSubject[];
};

export type RiskPayload = {
  subject: string;
  risk: number;
  level: string;
};

export type AdvicePayload = {
  subject: string;
  risk: number;
  advice: string;
  source: string;
};

export type ParentSummaryPayload = {
  week_label: string;
  child_name: string;
  class_id: string;
  average_grade: number;
  average_attendance: number;
  risk_score: number;
  risk_level: string;
  strong_subjects: string[];
  attention_subjects: string[];
  summary: string;
  recommendation: string;
  source: string;
  generated_at: string;
};

export type TimetableEntry = {
  day: string;
  slot: string;
  class_id: string;
  subject: string;
  teacher: string;
  room: string;
};

export type TimetablePayload = {
  source: string;
  school: string;
  timezone: string;
  days: string[];
  slots: string[];
  entries: TimetableEntry[];
  filters: {
    day: string;
    class_id: string;
    teacher: string;
  };
  fallback_reason?: string;
  is_fallback?: boolean;
};

export type ScheduleItem = {
  time: string;
  subject?: string;
  title?: string;
  room?: string;
  location?: string;
};

export type SchedulePayload = {
  lessons?: ScheduleItem[];
  events?: ScheduleItem[];
};

export type TeacherWarningRow = {
  student_id: string;
  student_name: string;
  class_id: string;
  risk_score: number;
  risk_level: string;
  top_subject: string;
  attendance: number;
  reasons: string[];
};

export type TeacherWarningsPayload = {
  class_id: string;
  rows: TeacherWarningRow[];
};

export type TeacherClassReportPayload = {
  class_id: string;
  report: string;
  source: string;
};

export type AdminMetricsPayload = {
  total_students: number;
  total_teachers: number;
  high_risk_students: number;
  medium_risk_students: number;
  low_risk_students: number;
  average_school_risk: number;
  class_heatmap: Array<{
    class_id: string;
    avg_risk: number;
    students: number;
  }>;
};

export type AnnouncementPayload = {
  id: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  target_roles: string[];
  target_classes: string[];
  created_by: string;
  created_at: string;
};

export type GenerateSchedulePayload = {
  schedule_id: string;
  generated_at: string;
  classes: string[];
  entries: Array<{
    id: string;
    class_id: string;
    subject: string;
    teacher_id: string;
    teacher_name: string;
    room: string;
    day: string;
    slot: string;
    type: string;
  }>;
  unresolved: Array<{
    class_id: string;
    subject: string;
    reason: string;
  }>;
  stats: {
    total_entries: number;
    unresolved_count: number;
    class_count: number;
  };
};

export type ValidateSchedulePayload = {
  valid: boolean;
  conflicts: Array<Record<string, unknown>>;
};

export type ScheduleChangePayload = {
  id: string;
  event: string;
  schedule_id?: string;
  created_at: string;
  meta?: Record<string, unknown>;
};

export type SocialCommentPayload = {
  id: string;
  author_role: string;
  author_name: string;
  text: string;
  created_at: string;
};

export type SocialPostPayload = {
  id: string;
  student_id: string;
  author_role: string;
  author_name: string;
  content: string;
  created_at: string;
  comments: SocialCommentPayload[];
};

export type SocialFeedPayload = {
  student_id: string;
  posts: SocialPostPayload[];
};

export type PortfolioItemPayload = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  verified_at: string | null;
};

export type PortfolioListPayload = {
  student_id: string;
  items: PortfolioItemPayload[];
};

export type LeaderboardRow = {
  student_id: string;
  student_name: string;
  class_id: string;
  improvement_score: number;
  badge: string;
};

export type SchoolInfoPayload = {
  id: string;
  name: string;
};

export type SubstitutionRequestSummary = {
  request_id: string;
  school_id: string;
  teacher_id: string;
  teacher_name: string;
  day: string;
  status: string;
  impacted_lessons: number;
  submitted_by: string;
  submitted_at: string;
};

export type SubstitutionOption = {
  option_id: string;
  type: string;
  score: number;
  teacher_name?: string;
  new_day?: string;
  new_slot?: string;
  reasoning?: string[];
};

export type SubstitutionLesson = {
  lesson_id: string;
  class_id: string;
  day: string;
  slot: string;
  subject: string;
  recommended: SubstitutionOption;
  alternatives?: SubstitutionOption[];
};

export type SubstitutionRequestDetail = {
  request_id: string;
  school_id: string;
  teacher_id: string;
  teacher_name: string;
  day: string;
  reason: string;
  status: string;
  submitted_by: string;
  submitted_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  proposal: {
    summary: Record<string, number>;
    lessons: SubstitutionLesson[];
  };
  approved_plan?: {
    summary: Record<string, number>;
    lessons: Array<{
      lesson_id: string;
      chosen: SubstitutionOption;
    }>;
  } | null;
};

export type NotificationPayload = {
  id: string;
  school_id: string;
  target_role: string;
  target_user_id?: string | null;
  title: string;
  message: string;
  created_at: string;
  request_id?: string | null;
  is_read: boolean;
};

export type KioskPayload = {
  generated_at: string;
  source: string;
  school_id: string;
  school_name: string;
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    priority: "high" | "medium" | "low";
    valid_until?: string | null;
  }>;
  top_students: Array<{
    id: string;
    name: string;
    class_id: string;
    score: number;
    achievement: string;
  }>;
  replacements: Array<{
    id: string;
    day: string;
    slot: string;
    class_id: string;
    subject: string;
    type: "substitute_teacher" | "reschedule" | "self_study";
    teacher_name?: string | null;
    note: string;
  }>;
  events: Array<{
    id: string;
    date: string;
    time: string;
    title: string;
    location: string;
    audience: string;
  }>;
};

export type DbStatsPayload = {
  students: number;
  teachers: number;
  accounts: number;
  classes: number;
  announcements: number;
  social_posts: number;
};

export type FutureSlotPayload = {
  slot_id: string;
  method: string;
  path: string;
  status: string;
  owner: string;
  summary: string;
};

export type ReadyPayload = {
  status: string;
  service: string;
  version: string;
  time: string;
  uptime_seconds: number;
  checks: Record<string, boolean>;
};

export type RealtimeEventPayload = {
  event: string;
  payload: Record<string, unknown>;
  sent_at: string;
};
