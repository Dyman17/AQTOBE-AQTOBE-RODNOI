import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { MissionControlShell } from "@/shared/layout/mission-control-shell";
import { SessionProvider, useSession } from "@/features/session/session-context";
import { RealtimeProvider } from "@/features/realtime/realtime-context";
import { EntryPage } from "@/features/entry/EntryPage";
import { ForbiddenPage, NotFoundPage, ParentRegistrationPage, SignInPage, StudentRegistrationPage } from "@/features/auth/AuthPages";
import { KioskPage } from "@/features/kiosk/KioskPage";
import { TimetablePage } from "@/features/timetable/TimetablePage";
import { LeaderboardPage, PortfolioPage, SocialWallPage } from "@/features/community/CommunityPages";
import { StudentAnalyticsPage, StudentOverviewPage } from "@/features/student/StudentPages";
import { ParentAnalyticsPage, ParentOverviewPage } from "@/features/parent/ParentPages";
import { TeacherClassReportPage, TeacherEarlyWarningPage, TeacherOverviewPage, TeacherSubstitutionNotificationsPage } from "@/features/teacher/TeacherPages";
import { AdminAnnouncementsPage, AdminMetricsPage, AdminOverviewPage, AdminRoadmapPage, AdminScheduleLabPage, AdminSubstitutionOpsPage } from "@/features/admin/AdminPages";
import type { PersistedSession } from "@/shared/types/domain";
import { getHomePathForRole } from "@/features/navigation/workspace-config";
import { evaluateWorkspaceAccess } from "@/features/navigation/route-guard";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RealtimeProvider>{children}</RealtimeProvider>
    </SessionProvider>
  );
}

function ProtectedLayout({ role }: { role: PersistedSession["role"] }) {
  const { session, isBootstrapping } = useSession();

  if (isBootstrapping) {
    return <div className="min-h-screen bg-[var(--color-surface)] p-8 text-sm text-slate-600">Инициализация сессии...</div>;
  }

  const access = evaluateWorkspaceAccess(session?.role || null, role);

  if (access === "redirect-login") {
    return <Navigate to="/" replace />;
  }

  if (access === "redirect-forbidden") {
    return <Navigate to="/forbidden" replace />;
  }

  return <MissionControlShell role={role} />;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { session, user } = useSession();
  const activeRole = user?.role || session?.role || null;

  if (activeRole) {
    return <Navigate to={getHomePathForRole(activeRole)} replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route path="/" element={<RedirectIfAuthenticated><EntryPage /></RedirectIfAuthenticated>} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/register/student" element={<StudentRegistrationPage />} />
          <Route path="/auth/register/parent" element={<ParentRegistrationPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/kiosk" element={<KioskPage />} />

          <Route path="/student" element={<ProtectedLayout role="student" />}>
            <Route index element={<StudentOverviewPage />} />
            <Route path="analytics" element={<StudentAnalyticsPage />} />
            <Route path="timetable" element={<TimetablePage role="student" />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="social" element={<SocialWallPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
          </Route>

          <Route path="/parent" element={<ProtectedLayout role="parent" />}>
            <Route index element={<ParentOverviewPage />} />
            <Route path="analytics" element={<ParentAnalyticsPage />} />
            <Route path="timetable" element={<TimetablePage role="parent" />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="social" element={<SocialWallPage />} />
          </Route>

          <Route path="/teacher" element={<ProtectedLayout role="teacher" />}>
            <Route index element={<TeacherOverviewPage />} />
            <Route path="early-warning" element={<TeacherEarlyWarningPage />} />
            <Route path="class-report" element={<TeacherClassReportPage />} />
            <Route path="timetable" element={<TimetablePage role="teacher" />} />
            <Route path="substitution-notifications" element={<TeacherSubstitutionNotificationsPage />} />
            <Route path="portfolio-review" element={<PortfolioPage reviewMode />} />
          </Route>

          <Route path="/admin" element={<ProtectedLayout role="admin" />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="metrics" element={<AdminMetricsPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="schedule-lab" element={<AdminScheduleLabPage />} />
            <Route path="substitution-ops" element={<AdminSubstitutionOpsPage />} />
            <Route path="portfolio-review" element={<PortfolioPage reviewMode />} />
            <Route path="roadmap" element={<AdminRoadmapPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Providers>
    </BrowserRouter>
  );
}
