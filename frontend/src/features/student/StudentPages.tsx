import { useEffect, useState } from "react";
import { loadStudentInsights, type StudentInsightsPayload } from "@/features/analytics/analytics-loaders";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatPercent, formatRiskTone } from "@/shared/lib/format";
import { Card, DataState, MetricCard, PageHeader, StatusBadge, TripleGrid } from "@/shared/ui/primitives";
import type { LeaderboardRow } from "@/shared/types/domain";

export function StudentOverviewPage() {
  const [data, setData] = useState<StudentInsightsPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [insights, leaderboardRows] = await Promise.all([loadStudentInsights(), aqbobekApi.student.getLeaderboard(5)]);
        setData(insights);
        setLeaderboard(leaderboardRows);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить student overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topRisk = data?.insights.slice().sort((left, right) => right.risk.risk - left.risk.risk)[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Student workspace" description="Персональная сводка ученика: успеваемость, predictive risk, AI-подсказки, лидерборд и ближайшие точки внимания." />
      <DataState loading={loading} error={error} hasData={Boolean(data)}>
        <TripleGrid>
          <MetricCard label="Ученик" value={data?.grades.student} hint={`Класс ${data?.grades.class_id || "—"}`} />
          <MetricCard label="Средний риск" value={data?.averageRisk || 0} hint="Агрегировано по предметам" />
          <MetricCard label="Посещаемость" value={formatPercent(data?.averageAttendance || 0)} hint="Среднее по tracked subjects" />
        </TripleGrid>

        {topRisk ? (
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Главная зона внимания</h2>
              <StatusBadge tone={formatRiskTone(topRisk.risk.risk) as "good" | "warning" | "critical"}>{topRisk.risk.level}</StatusBadge>
            </div>
            <p className="text-base font-semibold text-slate-950">{topRisk.subject.name}</p>
            <p className="text-sm text-slate-700">{topRisk.advice.advice}</p>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Быстрая карта предметов</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {data?.insights.map((item) => (
                <div key={item.subject.name} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-950">{item.subject.name}</p>
                    <StatusBadge tone={formatRiskTone(item.risk.risk) as "good" | "warning" | "critical"}>{item.risk.risk}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Оценки: {item.subject.grades.join(", ")}</p>
                  <p className="text-sm text-slate-600">Посещаемость: {formatPercent(item.subject.attendance)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Топ leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((row, index) => (
                <div key={row.student_id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">#{index + 1}</p>
                  <p className="font-semibold text-slate-950">{row.student_name}</p>
                  <p className="text-sm text-slate-600">{row.badge}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DataState>
    </div>
  );
}

export function StudentAnalyticsPage() {
  const [data, setData] = useState<StudentInsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setData(await loadStudentInsights());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить аналитику");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика ученика" description="Глубокий разбор успеваемости: grades, attendance, explainable risk и AI tutoring recommendations по каждому предмету." />
      <DataState loading={loading} error={error} hasData={Boolean(data)}>
        <div className="grid gap-4 xl:grid-cols-2">
          {data?.insights.map((item) => (
            <Card key={item.subject.name} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{item.subject.name}</h2>
                  <p className="text-sm text-slate-500">Topics: {item.subject.topics.join(", ")}</p>
                </div>
                <StatusBadge tone={formatRiskTone(item.risk.risk) as "good" | "warning" | "critical"}>risk {item.risk.risk}</StatusBadge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Grades</p>
                  <p className="mt-2 font-semibold text-slate-950">{item.subject.grades.join(", ")}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Attendance</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatPercent(item.subject.attendance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Level</p>
                  <p className="mt-2 font-semibold text-slate-950">{item.risk.level}</p>
                </div>
              </div>
              <Card className="rounded-2xl bg-sky-50/70 p-4 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-950">AI Tutor</p>
                <p className="mt-2">{item.advice.advice}</p>
              </Card>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
