import { FormEvent, useEffect, useState } from "react";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatDateTime } from "@/shared/lib/format";
import { useRealtime } from "@/features/realtime/realtime-context";
import { useSession } from "@/features/session/session-context";
import type {
  AdminMetricsPayload,
  AnnouncementPayload,
  DbStatsPayload,
  FutureSlotPayload,
  GenerateSchedulePayload,
  NotificationPayload,
  ReadyPayload,
  SchoolInfoPayload,
  SubstitutionRequestDetail,
  SubstitutionRequestSummary,
  ValidateSchedulePayload,
} from "@/shared/types/domain";
import { Button, Card, DataState, Field, MetricCard, PageHeader, SelectField, StatusBadge, TextAreaField, TripleGrid } from "@/shared/ui/primitives";

export function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetricsPayload | null>(null);
  const [changes, setChanges] = useState<Array<{ id: string; event: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [metricsPayload, scheduleChanges] = await Promise.all([
          aqbobekApi.admin.getMetrics(),
          aqbobekApi.admin.getScheduleChanges(5),
        ]);
        setMetrics(metricsPayload);
        setChanges(scheduleChanges);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить admin overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Admin mission control" description="Глобальный радар школы: качество образования, changes log, announcements и smart schedule operations." />
      <DataState loading={loading} error={error} hasData={Boolean(metrics)}>
        <TripleGrid>
          <MetricCard label="Students" value={metrics?.total_students || 0} />
          <MetricCard label="Teachers" value={metrics?.total_teachers || 0} />
          <MetricCard label="Average risk" value={metrics?.average_school_risk || 0} />
        </TripleGrid>
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Class heatmap preview</h2>
            {metrics?.class_heatmap.slice(0, 8).map((item) => (
              <div key={item.class_id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-950">{item.class_id}</span>
                <span className="text-sm text-slate-600">Risk {item.avg_risk} • {item.students} students</span>
              </div>
            ))}
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Recent schedule events</h2>
            {changes.map((change) => (
              <div key={change.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{change.event}</p>
                <p className="text-sm text-slate-600">{formatDateTime(change.created_at)}</p>
              </div>
            ))}
          </Card>
        </div>
      </DataState>
    </div>
  );
}

export function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<AdminMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setMetrics(await aqbobekApi.admin.getMetrics());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить admin metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Метрики школы" description="Глобальная сводка по качеству образования и class heatmap." />
      <DataState loading={loading} error={error} hasData={Boolean(metrics)}>
        <TripleGrid>
          <MetricCard label="High risk" value={metrics?.high_risk_students || 0} />
          <MetricCard label="Medium risk" value={metrics?.medium_risk_students || 0} />
          <MetricCard label="Low risk" value={metrics?.low_risk_students || 0} />
        </TripleGrid>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics?.class_heatmap.map((item) => (
            <Card key={item.class_id} className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{item.class_id}</p>
              <p className="text-3xl font-semibold text-slate-950">{item.avg_risk}</p>
              <p className="text-sm text-slate-600">{item.students} students</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}

export function AdminAnnouncementsPage() {
  const { lastEvent } = useRealtime();
  const [rows, setRows] = useState<AnnouncementPayload[]>([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "medium" as "high" | "medium" | "low",
    target_roles: "student,teacher,parent,admin",
    target_classes: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await aqbobekApi.admin.listAnnouncements());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить объявления");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (lastEvent?.event === "announcement-published") {
      void load();
    }
  }, [lastEvent]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await aqbobekApi.admin.createAnnouncement({
      title: form.title,
      message: form.message,
      priority: form.priority,
      target_roles: form.target_roles.split(",").map((item) => item.trim()).filter(Boolean),
      target_classes: form.target_classes.split(",").map((item) => item.trim()).filter(Boolean),
    });
    setForm((current) => ({ ...current, title: "", message: "", target_classes: "" }));
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Центр уведомлений" description="Таргетированные публикации для ролей и классов, которые мгновенно попадают в announcement feed." />
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
          <Field label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <SelectField label="Priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as "high" | "medium" | "low" }))}>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </SelectField>
          <TextAreaField label="Message" className="md:col-span-2" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
          <Field label="Target roles" value={form.target_roles} onChange={(event) => setForm((current) => ({ ...current, target_roles: event.target.value }))} />
          <Field label="Target classes" value={form.target_classes} onChange={(event) => setForm((current) => ({ ...current, target_classes: event.target.value }))} />
          <div className="md:col-span-2">
            <Button type="submit">Опубликовать</Button>
          </div>
        </form>
      </Card>
      <DataState loading={loading} error={error} hasData={rows.length > 0} empty="Пока нет опубликованных объявлений.">
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{row.title}</p>
                <StatusBadge tone={row.priority === "high" ? "critical" : row.priority === "medium" ? "warning" : "good"}>
                  {row.priority}
                </StatusBadge>
              </div>
              <p className="text-sm text-slate-700">{row.message}</p>
              <p className="text-xs text-slate-500">{formatDateTime(row.created_at)}</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}

export function AdminScheduleLabPage() {
  const { applySession } = useSession();
  const { lastEvent } = useRealtime();
  const [generated, setGenerated] = useState<GenerateSchedulePayload | null>(null);
  const [validation, setValidation] = useState<ValidateSchedulePayload | null>(null);
  const [changes, setChanges] = useState<Array<{ id: string; event: string; created_at: string }>>([]);
  const [stats, setStats] = useState<DbStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadMeta() {
    const [dbStats, scheduleChanges] = await Promise.all([
      aqbobekApi.system.getDbStats(),
      aqbobekApi.admin.getScheduleChanges(10),
    ]);
    setStats(dbStats);
    setChanges(scheduleChanges);
  }

  useEffect(() => {
    void loadMeta().catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить schedule lab");
    });
  }, []);

  useEffect(() => {
    if (lastEvent?.event === "schedule-updated" || lastEvent?.event === "demo-data-reset") {
      void loadMeta();
    }
  }, [lastEvent]);

  async function onGenerate() {
    setBusy(true);
    setError(null);
    try {
      const payload = await aqbobekApi.admin.generateSchedule();
      setGenerated(payload);
      setValidation(await aqbobekApi.admin.validateSchedule(payload.entries));
      await loadMeta();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Генерация не удалась");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setBusy(true);
    setError(null);
    try {
      const payload = await aqbobekApi.admin.resetDemoData();
      await applySession({ token: payload.session.token, role: payload.session.role, authMode: "quick" });
      setGenerated(null);
      setValidation(null);
      await loadMeta();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Reset demo data не удался");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Smart schedule lab" description="Административный центр для генерации расписания, проверки конфликтов, просмотра change log и демонстрационного reset." actions={<><Button onClick={() => void onGenerate()} disabled={busy}>{busy ? "Генерируем..." : "Generate schedule"}</Button><Button variant="danger" onClick={() => void onReset()} disabled={busy}>Reset demo data</Button></>} />
      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}
      <TripleGrid>
        <MetricCard label="Students" value={stats?.students || 0} />
        <MetricCard label="Announcements" value={stats?.announcements || 0} />
        <MetricCard label="Social posts" value={stats?.social_posts || 0} />
      </TripleGrid>
      {generated ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Generated schedule</h2>
            <p className="text-sm text-slate-700">Entries: {generated.stats.total_entries} • unresolved: {generated.stats.unresolved_count} • classes: {generated.stats.class_count}</p>
            <div className="max-h-[26rem] space-y-2 overflow-auto">
              {generated.entries.slice(0, 40).map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">{entry.class_id}</span> • {entry.day} {entry.slot} • {entry.subject} • {entry.teacher_name}
                </div>
              ))}
            </div>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Validation</h2>
            <p className="text-sm text-slate-700">Valid: {validation?.valid ? "yes" : "no"}</p>
            {validation?.conflicts.length ? (
              <div className="space-y-2">
                {validation.conflicts.map((conflict, index) => (
                  <div key={index} className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{JSON.stringify(conflict)}</div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">Конфликтов не найдено.</div>
            )}
          </Card>
        </div>
      ) : null}
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950">Change log</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {changes.map((change) => (
            <div key={change.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{change.event}</p>
              <p className="text-sm text-slate-600">{formatDateTime(change.created_at)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function optionLabel(option: { type: string; teacher_name?: string; new_day?: string; new_slot?: string; score: number }) {
  if (option.type === "substitute_teacher") return `Substitute: ${option.teacher_name || "n/a"} (score ${option.score})`;
  if (option.type === "reschedule") return `Reschedule: ${option.new_day || "?"} ${option.new_slot || ""} (score ${option.score})`;
  return `Self-study (score ${option.score})`;
}

export function AdminSubstitutionOpsPage() {
  const { user } = useSession();
  const { lastEvent } = useRealtime();
  const [schools, setSchools] = useState<SchoolInfoPayload[]>([]);
  const [schoolId, setSchoolId] = useState("aqbobek");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [teacherId, setTeacherId] = useState("t_phy_1");
  const [day, setDay] = useState("Monday");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<SubstitutionRequestSummary[]>([]);
  const [detail, setDetail] = useState<SubstitutionRequestDetail | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [adminNotifications, setAdminNotifications] = useState<NotificationPayload[]>([]);
  const [teacherNotifications, setTeacherNotifications] = useState<NotificationPayload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications(activeSchoolId = schoolId) {
    const [adminRows, teacherRows] = await Promise.all([
      aqbobekApi.substitution.getNotifications(activeSchoolId, "admin"),
      aqbobekApi.substitution.getNotifications(activeSchoolId, "teacher", teacherId),
    ]);
    setAdminNotifications(adminRows);
    setTeacherNotifications(teacherRows);
  }

  async function loadDetail(requestId: string) {
    if (!requestId) {
      setDetail(null);
      return;
    }
    const payload = await aqbobekApi.substitution.getRequest(requestId);
    setDetail(payload);
    setSelectedOptions(Object.fromEntries(payload.proposal.lessons.map((lesson) => [lesson.lesson_id, lesson.recommended.option_id])));
  }

  async function loadRequests(preferred?: string) {
    const rows = await aqbobekApi.substitution.listRequests(schoolId, statusFilter === "all" ? undefined : statusFilter);
    setRequests(rows);
    const nextId = preferred || rows[0]?.request_id || "";
    if (nextId) await loadDetail(nextId);
    else setDetail(null);
  }

  useEffect(() => {
    void (async () => {
      try {
        const schoolRows = await aqbobekApi.substitution.getSchools();
        setSchools(schoolRows);
        if (schoolRows[0]) setSchoolId(schoolRows[0].id);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить schools");
      }
    })();
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    void loadRequests().catch((reason) => setError(reason instanceof Error ? reason.message : "Не удалось загрузить queue"));
    void loadNotifications().catch((reason) => setError(reason instanceof Error ? reason.message : "Не удалось загрузить notifications"));
  }, [schoolId, statusFilter, teacherId]);

  useEffect(() => {
    if (lastEvent?.event === "substitution-request-created" || lastEvent?.event === "substitution-decision") {
      void loadRequests(detail?.request_id).catch(() => undefined);
      void loadNotifications().catch(() => undefined);
    }
  }, [lastEvent]);

  async function onCreateRequest() {
    setBusy(true);
    setError(null);
    try {
      const created = await aqbobekApi.substitution.createRequest({
        school_id: schoolId,
        teacher_id: teacherId,
        day,
        reason,
        submitted_by: teacherId,
      });
      setReason("");
      await loadRequests(created.request_id);
      await loadNotifications();
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : "Не удалось создать request");
    } finally {
      setBusy(false);
    }
  }

  async function onDecision(decision: "approve" | "reject") {
    if (!detail) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await aqbobekApi.substitution.decideRequest(detail.request_id, {
        decision,
        approver_id: user?.user_id || "demo_admin",
        approver_role: user?.role || "admin",
        comment: decision === "approve" ? "Approved in mission control" : "Rejected in mission control",
        selected_options: selectedOptions,
      });
      setDetail(updated);
      await loadRequests(updated.request_id);
      await loadNotifications();
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : "Не удалось принять решение");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Substitution operations" description="Очередь отсутствий, proposal details, approve/reject decision и notification feeds для административной роли." />
      {error ? <Card className="text-sm text-rose-700">{error}</Card> : null}
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">Create absence request</h2>
          <div className="grid gap-3">
            <SelectField label="School" value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </SelectField>
            <Field label="Teacher ID" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} />
            <SelectField label="Day" value={day} onChange={(event) => setDay(event.target.value)}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((item) => <option key={item} value={item}>{item}</option>)}
            </SelectField>
            <TextAreaField label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button onClick={() => void onCreateRequest()} disabled={busy}>Create request</Button>
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Request queue</h2>
            <SelectField label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {["all", "pending", "approved", "rejected"].map((status) => <option key={status} value={status}>{status}</option>)}
            </SelectField>
          </div>
          <div className="space-y-2">
            {requests.map((request) => (
              <button key={request.request_id} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left" onClick={() => void loadDetail(request.request_id)}>
                <span className="font-semibold text-slate-950">{request.teacher_name}</span>
                <span className="text-sm text-slate-600">{request.day} • {request.status}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {detail ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Request {detail.request_id}</h2>
              <p className="text-sm text-slate-600">{detail.teacher_name} • {detail.day} • {detail.status}</p>
            </div>
            <StatusBadge tone={detail.status === "approved" ? "good" : detail.status === "rejected" ? "critical" : "warning"}>{detail.status}</StatusBadge>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {detail.proposal.lessons.map((lesson) => (
              <div key={lesson.lesson_id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{lesson.subject} • {lesson.class_id}</p>
                <p className="text-sm text-slate-600">{lesson.day} {lesson.slot}</p>
                <SelectField
                  label="Chosen option"
                  value={selectedOptions[lesson.lesson_id] || lesson.recommended.option_id}
                  onChange={(event) => setSelectedOptions((current) => ({ ...current, [lesson.lesson_id]: event.target.value }))}
                  disabled={detail.status !== "pending"}
                >
                  {[lesson.recommended, ...(lesson.alternatives || [])].map((option) => <option key={option.option_id} value={option.option_id}>{optionLabel(option)}</option>)}
                </SelectField>
              </div>
            ))}
          </div>
          {detail.status === "pending" ? (
            <div className="flex gap-3">
              <Button onClick={() => void onDecision("approve")} disabled={busy}>Approve</Button>
              <Button variant="danger" onClick={() => void onDecision("reject")} disabled={busy}>Reject</Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">Admin notifications</h2>
          {adminNotifications.map((row) => (
            <div key={row.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{row.title}</p>
              <p className="text-sm text-slate-700">{row.message}</p>
            </div>
          ))}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">Teacher notifications</h2>
          {teacherNotifications.map((row) => (
            <div key={row.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{row.title}</p>
              <p className="text-sm text-slate-700">{row.message}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function AdminRoadmapPage() {
  const [slots, setSlots] = useState<FutureSlotPayload[]>([]);
  const [ready, setReady] = useState<ReadyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [slotRows, readyPayload] = await Promise.all([
          aqbobekApi.system.getFutureSlots(),
          aqbobekApi.system.getReady(),
        ]);
        setSlots(slotRows);
        setReady(readyPayload);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить roadmap");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Roadmap and future slots" description="Polished demo placeholders для reserved backend capabilities без притворства, что они уже готовы." />
      <DataState loading={loading} error={error} hasData={slots.length > 0} empty="Нет будущих слотов.">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">Readiness snapshot</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ready?.checks || {}).map(([key, value]) => <StatusBadge key={key} tone={value ? "good" : "critical"}>{key}</StatusBadge>)}
          </div>
        </Card>
        <div className="grid gap-4 xl:grid-cols-2">
          {slots.map((slot) => (
            <Card key={slot.slot_id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{slot.method}</p>
                  <h2 className="text-lg font-semibold text-slate-950">{slot.path}</h2>
                </div>
                <StatusBadge tone={slot.status === "reserved" ? "warning" : "info"}>{slot.status}</StatusBadge>
              </div>
              <p className="text-sm text-slate-700">{slot.summary}</p>
              <p className="text-sm text-slate-500">Owner: {slot.owner}</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
