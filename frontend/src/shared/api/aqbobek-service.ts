import { appConfig } from "@/app/config";
import { loadStoredSession } from "@/features/session/session-storage";
import type {
  AdminMetricsPayload,
  AdvicePayload,
  AnnouncementPayload,
  AppRole,
  DbStatsPayload,
  FutureSlotPayload,
  GenerateSchedulePayload,
  GradesPayload,
  HealthPayload,
  KioskPayload,
  LeaderboardRow,
  NotificationPayload,
  ParentSummaryPayload,
  PortfolioItemPayload,
  PortfolioListPayload,
  ReadyPayload,
  RealtimeEventPayload,
  RiskPayload,
  ScheduleChangePayload,
  SchedulePayload,
  SchoolInfoPayload,
  SessionUser,
  SocialFeedPayload,
  SocialPostPayload,
  SubstitutionRequestDetail,
  SubstitutionRequestSummary,
  TeacherClassReportPayload,
  TeacherWarningsPayload,
  TimetablePayload,
  ValidateSchedulePayload,
} from "@/shared/types/domain";
import { createApiClient } from "./http-client";

const client = createApiClient({
  apiBaseUrl: appConfig.apiBaseUrl,
  getToken: () => loadStoredSession()?.token ?? null,
});

export const aqbobekApi = {
  system: {
    getHealth: () => client.get<HealthPayload>("/healthz"),
    getReady: () => client.get<ReadyPayload>("/readyz"),
    getDbStats: () => client.get<DbStatsPayload>("/db/stats"),
    getFutureSlots: () => client.get<FutureSlotPayload[]>("/_future/slots"),
  },
  auth: {
    quickLogin: (role: Exclude<AppRole, "guest">) =>
      client.post<{ token: string; role: Exclude<AppRole, "guest"> }>("/login", { body: { role } }),
    login: (email: string, password: string) =>
      client.post<{ token: string; role: Exclude<AppRole, "guest"> }>("/auth/login", {
        body: { email, password },
      }),
    registerStudent: (payload: { name: string; class_id: string; email: string; password: string }) =>
      client.post<{ token: string; role: "student"; student_id: string }>("/auth/register-student", {
        body: payload,
      }),
    registerParent: (payload: { name: string; email: string; password: string; child_student_email: string }) =>
      client.post<{ token: string; role: "parent"; linked_student_id: string }>("/auth/register-parent", {
        body: payload,
      }),
    getMe: () => client.get<SessionUser>("/me", { authenticated: true }),
  },
  student: {
    getGrades: () => client.get<GradesPayload>("/grades", { authenticated: true }),
    getRisk: (payload: { subject: string; grades: number[]; attendance: number }) =>
      client.post<RiskPayload>("/risk", { body: payload }),
    getAdvice: (payload: { subject: string; grades: number[]; attendance: number; risk?: number }) =>
      client.post<AdvicePayload>("/ai-advice", { body: payload }),
    getLeaderboard: (limit = 20) =>
      client.get<LeaderboardRow[]>("/gamification/leaderboard", { query: { limit } }),
    getSocialFeed: (studentId?: string) =>
      client.get<SocialFeedPayload>("/social/feed", {
        authenticated: true,
        query: { student_id: studentId },
      }),
    createSocialPost: (content: string) =>
      client.post<SocialPostPayload>("/social/feed", {
        authenticated: true,
        body: { content },
      }),
    createSocialComment: (postId: string, text: string) =>
      client.post<SocialPostPayload>(`/social/feed/${postId}/comment`, {
        authenticated: true,
        body: { text },
      }),
    getPortfolio: (studentId?: string) =>
      client.get<PortfolioListPayload>("/portfolio/items", {
        authenticated: true,
        query: { student_id: studentId },
      }),
    createPortfolioItem: (payload: { title: string; description: string }) =>
      client.post<PortfolioItemPayload>("/portfolio/items", {
        authenticated: true,
        body: payload,
      }),
    verifyPortfolioItem: (itemId: string) =>
      client.post<PortfolioItemPayload>(`/portfolio/verify/${itemId}`, { authenticated: true }),
  },
  parent: {
    getWeeklySummary: () =>
      client.get<ParentSummaryPayload>("/parent/weekly-summary", { authenticated: true }),
  },
  timetable: {
    getTimetable: (filters?: { day?: string; class_id?: string; teacher?: string }) =>
      client.get<TimetablePayload>("/timetable", { query: filters }),
    getSchedule: (role: Exclude<AppRole, "guest">) =>
      client.get<SchedulePayload>("/schedule", { query: { role } }),
  },
  teacher: {
    getEarlyWarning: (classId: string, limit = 25) =>
      client.get<TeacherWarningsPayload>("/teacher/early-warning", {
        query: { class_id: classId, limit },
      }),
    getClassReport: (classId: string) =>
      client.post<TeacherClassReportPayload>("/teacher/class-report", {
        body: { class_id: classId },
      }),
    getSubstitutionNotifications: (schoolId: string, targetUserId?: string) =>
      client.get<NotificationPayload[]>("/substitution/notifications", {
        query: { school_id: schoolId, target_role: "teacher", target_user_id: targetUserId },
      }),
  },
  admin: {
    getMetrics: () => client.get<AdminMetricsPayload>("/admin/metrics"),
    listAnnouncements: (role?: string, classId?: string) =>
      client.get<AnnouncementPayload[]>("/announcements", {
        query: { role, class_id: classId },
      }),
    createAnnouncement: (payload: {
      title: string;
      message: string;
      priority: "high" | "medium" | "low";
      target_roles: string[];
      target_classes: string[];
    }) =>
      client.post<AnnouncementPayload>("/announcements", { authenticated: true, body: payload }),
    generateSchedule: (classIds?: string[]) =>
      client.post<GenerateSchedulePayload>("/schedule/generate", {
        authenticated: true,
        body: { class_ids: classIds ?? [] },
      }),
    validateSchedule: (entries: GenerateSchedulePayload["entries"]) =>
      client.post<ValidateSchedulePayload>("/schedule/validate", {
        authenticated: true,
        body: { entries },
      }),
    getScheduleChanges: (limit = 50) =>
      client.get<ScheduleChangePayload[]>("/schedule/changes", { query: { limit } }),
    resetDemoData: () =>
      client.post<{
        status: string;
        stats: DbStatsPayload;
        substitution_state: Record<string, number>;
        session: { token: string; role: "admin" };
      }>("/admin/reset-demo-data", { authenticated: true }),
  },
  substitution: {
    getSchools: () => client.get<SchoolInfoPayload[]>("/substitution/schools"),
    createRequest: (payload: {
      school_id: string;
      teacher_id: string;
      day: string;
      reason: string;
      submitted_by: string;
    }) => client.post<SubstitutionRequestSummary>("/substitution/absence-requests", { body: payload }),
    listRequests: (schoolId: string, status?: string) =>
      client.get<SubstitutionRequestSummary[]>("/substitution/absence-requests", {
        query: { school_id: schoolId, status },
      }),
    getRequest: (requestId: string) =>
      client.get<SubstitutionRequestDetail>(`/substitution/absence-requests/${requestId}`),
    decideRequest: (
      requestId: string,
      payload: {
        decision: "approve" | "reject";
        approver_id: string;
        approver_role: string;
        comment?: string;
        selected_options: Record<string, string>;
      },
    ) =>
      client.post<SubstitutionRequestDetail>(`/substitution/absence-requests/${requestId}/decision`, {
        authenticated: true,
        body: payload,
      }),
    getNotifications: (schoolId: string, targetRole: string, targetUserId?: string) =>
      client.get<NotificationPayload[]>("/substitution/notifications", {
        query: { school_id: schoolId, target_role: targetRole, target_user_id: targetUserId },
      }),
  },
  kiosk: {
    getKiosk: () => client.get<KioskPayload>("/kiosk", { query: { school_id: appConfig.schoolId } }),
  },
};

export type RealtimeMessage = RealtimeEventPayload;
