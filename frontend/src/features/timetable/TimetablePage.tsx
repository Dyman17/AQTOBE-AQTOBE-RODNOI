import { useEffect, useMemo, useState } from "react";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatDateTime } from "@/shared/lib/format";
import type { SchedulePayload, TimetablePayload } from "@/shared/types/domain";
import { Button, Card, DataState, PageHeader, SelectField } from "@/shared/ui/primitives";

const FALLBACK_SLOTS = ["08:30", "09:25", "10:20", "11:15", "12:10", "13:05", "14:00"];

export function TimetablePage({ role }: { role?: "student" | "parent" | "teacher" | "admin" }) {
  const [timetable, setTimetable] = useState<TimetablePayload | null>(null);
  const [schedule, setSchedule] = useState<SchedulePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [tt, roleSchedule] = await Promise.all([
        aqbobekApi.timetable.getTimetable(),
        role ? aqbobekApi.timetable.getSchedule(role) : Promise.resolve(null),
      ]);
      setTimetable(tt);
      setSchedule(roleSchedule);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить расписание");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [role]);

  const classOptions = useMemo(
    () => Array.from(new Set((timetable?.entries || []).map((entry) => entry.class_id))).sort(),
    [timetable],
  );

  const teacherOptions = useMemo(
    () => Array.from(new Set((timetable?.entries || []).map((entry) => entry.teacher))).sort(),
    [timetable],
  );

  useEffect(() => {
    if (!classFilter && classOptions.length > 0) {
      setClassFilter(classOptions[0]);
    }
  }, [classFilter, classOptions]);

  useEffect(() => {
    if (!teacherFilter && teacherOptions.length > 0) {
      setTeacherFilter(teacherOptions[0]);
    }
  }, [teacherFilter, teacherOptions]);

  const slots = timetable?.slots?.length ? timetable.slots : FALLBACK_SLOTS;
  const days = timetable?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const filteredEntries = useMemo(() => {
    const entries = timetable?.entries || [];
    return entries.filter((entry) => {
      if (dayFilter !== "all" && entry.day !== dayFilter) return false;
      if (classFilter && role !== "teacher" && role !== "admin" && entry.class_id !== classFilter) return false;
      if (teacherFilter && role === "teacher" && !entry.teacher.includes(teacherFilter)) return false;
      return true;
    });
  }, [classFilter, dayFilter, role, teacherFilter, timetable]);

  const grid = useMemo(() => {
    return days.map((day) => ({
      day,
      cells: slots.map((slot) => ({
        slot,
        entries: filteredEntries.filter((entry) => entry.day === day && entry.slot === slot),
      })),
    }));
  }, [days, filteredEntries, slots]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Расписание"
        description="Публичная и role-aware timetable матрица. Гость может смотреть сетку, а авторизованный пользователь получает дополнительный operations snapshot."
        actions={<Button variant="secondary" onClick={() => void load()}>Обновить</Button>}
      />

      <Card className="grid gap-4 md:grid-cols-3">
        <SelectField label="День" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
          <option value="all">Все дни</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </SelectField>
        <SelectField label="Класс" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
          {classOptions.map((classId) => (
            <option key={classId} value={classId}>
              {classId}
            </option>
          ))}
        </SelectField>
        <SelectField label="Учитель" value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
          {teacherOptions.map((teacher) => (
            <option key={teacher} value={teacher}>
              {teacher}
            </option>
          ))}
        </SelectField>
      </Card>

      <DataState loading={loading} error={error} hasData={Boolean(timetable)}>
        <div className="overflow-x-auto rounded-3xl border border-white/70 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Slot</th>
                {grid.map((column) => (
                  <th key={column.day} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {column.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot} className="align-top">
                  <td className="border-t border-slate-100 px-4 py-4 text-sm font-semibold text-slate-900">{slot}</td>
                  {grid.map((column) => {
                    const entries = column.cells.find((cell) => cell.slot === slot)?.entries || [];
                    return (
                      <td key={`${column.day}-${slot}`} className="border-t border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="space-y-3">
                          {entries.length === 0 ? <div className="text-slate-400">—</div> : null}
                          {entries.map((entry, index) => (
                            <div key={`${entry.class_id}-${entry.subject}-${index}`} className="rounded-2xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-950">{entry.subject}</p>
                              <p className="text-xs text-slate-600">{entry.class_id} • {entry.teacher}</p>
                              <p className="text-xs text-slate-500">{entry.room}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>

      {role && schedule ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">Operations snapshot</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(schedule.lessons || schedule.events || []).map((item, index) => (
              <div key={`${item.time}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.time}</p>
                <p className="mt-2 font-semibold text-slate-950">{item.subject || item.title}</p>
                <p className="text-sm text-slate-600">{item.room || item.location || "School event"}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Источник данных: {timetable?.source || "—"}</p>
        </Card>
      ) : null}
    </div>
  );
}
