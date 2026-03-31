import { useEffect, useState } from "react";
import { loadStudentInsights, type StudentInsightsPayload } from "@/features/analytics/analytics-loaders";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatPercent } from "@/shared/lib/format";
import type { ParentSummaryPayload } from "@/shared/types/domain";
import { Card, DataState, MetricCard, PageHeader, TripleGrid } from "@/shared/ui/primitives";

export function ParentOverviewPage() {
  const [summary, setSummary] = useState<ParentSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setSummary(await aqbobekApi.parent.getWeeklySummary());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить родительскую сводку");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Режим родителя" description="AI-выжимка за неделю и краткий взгляд на успехи, риски и рекомендации для поддержки ребёнка." />
      <DataState loading={loading} error={error} hasData={Boolean(summary)}>
        <TripleGrid>
          <MetricCard label="Ребёнок" value={summary?.child_name} hint={`Класс ${summary?.class_id || "—"}`} />
          <MetricCard label="Риск" value={summary?.risk_score || 0} hint={summary?.risk_level} />
          <MetricCard label="Посещаемость" value={formatPercent(summary?.average_attendance || 0)} hint={`Средний балл ${summary?.average_grade || 0}`} />
        </TripleGrid>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">AI summary</h2>
            <p className="text-sm leading-6 text-slate-700">{summary?.summary}</p>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Рекомендация</h2>
            <p className="text-sm leading-6 text-slate-700">{summary?.recommendation}</p>
            <p className="text-sm text-slate-600">Сильные предметы: {summary?.strong_subjects.join(", ") || "—"}</p>
            <p className="text-sm text-slate-600">Зоны внимания: {summary?.attention_subjects.join(", ") || "—"}</p>
          </Card>
        </div>
      </DataState>
    </div>
  );
}

export function ParentAnalyticsPage() {
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
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить child analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика ребёнка" description="Та же академическая база, но в родительской framing-модели: где помочь, что обсудить и где уже есть сильная динамика." />
      <DataState loading={loading} error={error} hasData={Boolean(data)}>
        <div className="grid gap-4 xl:grid-cols-2">
          {data?.insights.map((item) => (
            <Card key={item.subject.name} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-950">{item.subject.name}</h2>
              <p className="text-sm text-slate-600">Оценки: {item.subject.grades.join(", ")}</p>
              <p className="text-sm text-slate-600">Посещаемость: {formatPercent(item.subject.attendance)}</p>
              <p className="text-sm text-slate-700">{item.advice.advice}</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
