import { FormEvent, useEffect, useMemo, useState } from "react";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatDateTime, formatPercent } from "@/shared/lib/format";
import { useRealtime } from "@/features/realtime/realtime-context";
import { useSession } from "@/features/session/session-context";
import type { NotificationPayload, TeacherClassReportPayload, TeacherWarningsPayload } from "@/shared/types/domain";
import { Button, Card, DataState, Field, MetricCard, PageHeader, TripleGrid } from "@/shared/ui/primitives";

export function TeacherOverviewPage() {
  const [warnings, setWarnings] = useState<TeacherWarningsPayload | null>(null);
  const [report, setReport] = useState<TeacherClassReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [warningRows, reportPayload] = await Promise.all([
          aqbobekApi.teacher.getEarlyWarning("10A"),
          aqbobekApi.teacher.getClassReport("10A"),
        ]);
        setWarnings(warningRows);
        setReport(reportPayload);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить teacher overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher workspace" description="Рабочее место для triage-подхода: видимые риски, сгенерированный отчёт класса и быстрый доступ к расписанию и заменам." />
      <DataState loading={loading} error={error} hasData={Boolean(warnings)}>
        <TripleGrid>
          <MetricCard label="Класс" value={warnings?.class_id || "10A"} hint="Default class monitor" />
          <MetricCard label="Под наблюдением" value={warnings?.rows.length || 0} hint="Ученики в срезе" />
          <MetricCard label="Средняя посещаемость" value={warnings?.rows[0] ? formatPercent(warnings.rows.reduce((sum, row) => sum + row.attendance, 0) / warnings.rows.length) : "—"} />
        </TripleGrid>
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Top risk cases</h2>
            {warnings?.rows.slice(0, 5).map((row) => (
              <div key={row.student_id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{row.student_name}</p>
                <p className="text-sm text-slate-600">Risk {row.risk_score} • {row.top_subject}</p>
                <p className="text-sm text-slate-600">{row.reasons.join(" • ")}</p>
              </div>
            ))}
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">AI class report</h2>
            <p className="text-sm leading-6 text-slate-700">{report?.report}</p>
          </Card>
        </div>
      </DataState>
    </div>
  );
}

export function TeacherEarlyWarningPage() {
  const [classId, setClassId] = useState("10A");
  const [warnings, setWarnings] = useState<TeacherWarningsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setWarnings(await aqbobekApi.teacher.getEarlyWarning(classId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить список рисков");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Early Warning System" description="Filterable dashboard, который подсвечивает учеников с аномальным риском и explainable factors." actions={<Button variant="secondary" onClick={() => void load()}>Обновить</Button>} />
      <Card className="flex flex-col gap-3 md:flex-row">
        <Field label="Class ID" value={classId} onChange={(event) => setClassId(event.target.value.toUpperCase())} />
        <Button className="self-end" onClick={() => void load()}>Показать</Button>
      </Card>
      <DataState loading={loading} error={error} hasData={Boolean(warnings?.rows.length)} empty="Нет учеников для выбранного класса.">
        <div className="grid gap-4 xl:grid-cols-2">
          {warnings?.rows.map((row) => (
            <Card key={row.student_id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{row.student_name}</p>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{row.risk_level} • {row.risk_score}</span>
              </div>
              <p className="text-sm text-slate-600">Top subject: {row.top_subject}</p>
              <p className="text-sm text-slate-600">Attendance: {formatPercent(row.attendance)}</p>
              <p className="text-sm text-slate-700">{row.reasons.join(" • ")}</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}

export function TeacherClassReportPage() {
  const [classId, setClassId] = useState("10A");
  const [report, setReport] = useState<TeacherClassReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setReport(await aqbobekApi.teacher.getClassReport(classId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сгенерировать отчёт");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI class report" description="Генерация текстового отчёта по успеваемости класса в 1 клик для классного руководства и оперативной коммуникации." />
      <Card>
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={(event) => void onSubmit(event)}>
          <Field label="Class ID" value={classId} onChange={(event) => setClassId(event.target.value.toUpperCase())} />
          <Button className="self-end" type="submit" disabled={loading}>{loading ? "Генерируем..." : "Сгенерировать отчёт"}</Button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
      {report ? (
        <Card className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source: {report.source}</p>
          <p className="text-sm leading-6 text-slate-700">{report.report}</p>
        </Card>
      ) : null}
    </div>
  );
}

export function TeacherSubstitutionNotificationsPage() {
  const { user } = useSession();
  const { lastEvent } = useRealtime();
  const [rows, setRows] = useState<NotificationPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teacherId = useMemo(() => user?.linked_teacher_id || user?.user_id || undefined, [user]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await aqbobekApi.teacher.getSubstitutionNotifications("aqbobek", teacherId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [teacherId]);

  useEffect(() => {
    if (lastEvent?.event === "substitution-decision" || lastEvent?.event === "substitution-request-created") {
      void load();
    }
  }, [lastEvent]);

  return (
    <div className="space-y-6">
      <PageHeader title="Уведомления по заменам" description="Teacher-facing лента изменений по заменам и динамическому расписанию." actions={<Button variant="secondary" onClick={() => void load()}>Обновить</Button>} />
      <DataState loading={loading} error={error} hasData={rows.length > 0} empty="Пока нет уведомлений по заменам.">
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.id} className="space-y-2">
              <p className="font-semibold text-slate-950">{row.title}</p>
              <p className="text-sm text-slate-700">{row.message}</p>
              <p className="text-xs text-slate-500">{formatDateTime(row.created_at)}</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
