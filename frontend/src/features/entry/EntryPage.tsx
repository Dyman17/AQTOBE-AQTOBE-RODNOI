import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, MonitorUp, Users } from "lucide-react";
import { getHomePathForRole } from "@/features/navigation/workspace-config";
import { useSession } from "@/features/session/session-context";
import { Button, Card, PageHeader } from "@/shared/ui/primitives";

export function EntryPage() {
  const navigate = useNavigate();
  const { session, user, signInWithRole, error } = useSession();
  const activeRole = user?.role || session?.role || null;

  async function onQuickAccess(role: "teacher" | "admin") {
    await signInWithRole(role);
    navigate(getHomePathForRole(role));
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <PageHeader
          title="Единый школьный портал Aqbobek Lyceum"
          description="Многоролевой цифровой workspace для ученика, родителя, учителя и администрации. Аналитика, smart schedule, замены, kiosk mode и единая лента событий в одном приложении."
          actions={
            <>
              <Link to="/timetable">
                <Button variant="secondary">Публичное расписание</Button>
              </Link>
              <Link to="/kiosk">
                <Button variant="ghost">Kiosk mode</Button>
              </Link>
            </>
          }
        />

        {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}
        {activeRole ? (
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Активная сессия</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{user?.display_name || activeRole}</h2>
              <p className="text-sm text-slate-600">Можно сразу вернуться в workspace без повторного входа.</p>
            </div>
            <Button onClick={() => navigate(getHomePathForRole(activeRole))}>Открыть workspace</Button>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-semibold text-slate-950">Основные сценарии входа</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Link to="/auth/sign-in" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-white">
                <p className="text-base font-semibold text-slate-950">Войти по email</p>
                <p className="mt-2 text-sm text-slate-600">Student и parent account auth через реальные backend endpoints.</p>
              </Link>
              <Link to="/auth/register/student" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-white">
                <p className="text-base font-semibold text-slate-950">Регистрация ученика</p>
                <p className="mt-2 text-sm text-slate-600">Создать student account и сразу попасть в портал.</p>
              </Link>
              <Link to="/auth/register/parent" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-white">
                <p className="text-base font-semibold text-slate-950">Регистрация родителя</p>
                <p className="mt-2 text-sm text-slate-600">Привязка к ученику через `child_student_email`.</p>
              </Link>
              <Link to="/timetable" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-200 hover:bg-white">
                <p className="text-base font-semibold text-slate-950">Гостевой доступ</p>
                <p className="mt-2 text-sm text-slate-600">Расписание и kiosk без авторизации для публичного демо.</p>
              </Link>
            </div>
          </Card>

          <Card className="space-y-5 bg-slate-950 text-white">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-sky-300" />
              <h2 className="text-xl font-semibold">Quick demo access</h2>
            </div>
            <p className="text-sm leading-6 text-slate-300">Для защиты и judged demos teacher/admin можно открыть мгновенно через role session, не мешая реальным student/parent account flows.</p>
            <div className="grid gap-3">
              <Button variant="secondary" className="justify-start bg-white text-slate-950" onClick={() => void onQuickAccess("teacher")}>
                Войти как teacher demo
              </Button>
              <Button variant="secondary" className="justify-start bg-white text-slate-950" onClick={() => void onQuickAccess("admin")}>
                Войти как admin demo
              </Button>
              <Link to="/kiosk" className="inline-flex">
                <Button variant="ghost" className="w-full justify-start border border-white/20 text-white hover:bg-white/10">
                  <MonitorUp className="mr-2 h-4 w-4" />
                  Открыть kiosk wallboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
