import { Menu, LogOut, MonitorUp } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatDateTime, titleFromRole } from "@/shared/lib/format";
import { useInterval } from "@/shared/hooks/use-interval";
import { Button, Card, StatusBadge } from "@/shared/ui/primitives";
import { useRealtime } from "@/features/realtime/realtime-context";
import { getWorkspaceForRole } from "@/features/navigation/workspace-config";
import { useSession } from "@/features/session/session-context";
import type { HealthPayload, PersistedSession } from "@/shared/types/domain";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

function toneFromHealth(status: string) {
  if (status === "ok" || status === "ready") return "good";
  if (status === "down") return "critical";
  return "warning";
}

export function MissionControlShell({ role }: { role: PersistedSession["role"] }) {
  const workspace = getWorkspaceForRole(role);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useSession();
  const { connectionState, lastEvent, lastEventAt } = useRealtime();
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadHealth = async () => {
    try {
      const payload = await aqbobekApi.system.getHealth();
      setHealth(payload);
      setHealthError(null);
    } catch (error) {
      setHealth(null);
      setHealthError(error instanceof Error ? error.message : "API недоступно");
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  useInterval(() => {
    void loadHealth();
  }, 30000);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-80 border-r border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,251,0.95))] p-6 shadow-xl shadow-slate-950/5 transition md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Mission Control</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{workspace.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{titleFromRole(role)} workspace</p>
            </div>
            <button className="rounded-full border border-slate-200 p-2 md:hidden" onClick={() => setMobileOpen(false)}>
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-8 space-y-2">
            {workspace.sections.map((section) => (
              <NavLink
                key={section.key}
                to={section.path}
                end={section.path === workspace.homePath}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "block rounded-2xl px-4 py-3 transition",
                    isActive ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15" : "bg-white/70 text-slate-700 hover:bg-white",
                  )
                }
              >
                <div className="font-semibold">{section.label}</div>
                <div className={cn("mt-1 text-xs", location.pathname === section.path ? "text-slate-200" : "text-slate-500")}>
                  {section.description}
                </div>
              </NavLink>
            ))}
            <NavLink
              to="/kiosk"
              className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              <MonitorUp className="h-4 w-4" />
              Kiosk mode
            </NavLink>
          </nav>

          <Card className="mt-8 space-y-2 bg-slate-950 text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Current user</p>
            <p className="text-lg font-semibold">{user?.display_name || titleFromRole(role)}</p>
            <p className="text-sm text-slate-300">{user?.email || "Demo session"}</p>
            <Button
              variant="secondary"
              className="mt-2 w-full justify-center bg-white text-slate-950"
              onClick={() => {
                signOut();
                navigate("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(244,247,251,0.88)] px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm md:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Aqbobek Lyceum</p>
                  <h1 className="text-xl font-semibold text-slate-950">Unified school portal</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={toneFromHealth(health?.status || (healthError ? "down" : "checking"))}>
                  API {health?.status || (healthError ? "down" : "checking")}
                </StatusBadge>
                <StatusBadge tone={connectionState === "online" ? "good" : connectionState === "connecting" ? "warning" : "critical"}>
                  WS {connectionState}
                </StatusBadge>
                <StatusBadge tone="info">{lastEvent ? lastEvent.event : "live idle"}</StatusBadge>
                <StatusBadge tone="neutral">{formatDateTime(lastEventAt || health?.time)}</StatusBadge>
              </div>
            </div>
          </header>

          {lastEvent ? (
            <div className="border-b border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 md:px-8">
              Последнее live-событие: <span className="font-semibold">{lastEvent.event}</span>
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
