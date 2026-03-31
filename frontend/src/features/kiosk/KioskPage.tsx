import { useEffect, useMemo, useState } from "react";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { useInterval } from "@/shared/hooks/use-interval";
import type { KioskPayload } from "@/shared/types/domain";
import { Button, Card, DataState, PageHeader } from "@/shared/ui/primitives";

const slides = [
  { key: "announcements", label: "Announcements" },
  { key: "top_students", label: "Top students" },
  { key: "replacements", label: "Replacements" },
  { key: "events", label: "Events" },
] as const;

export function KioskPage() {
  const [payload, setPayload] = useState<KioskPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPayload(await aqbobekApi.kiosk.getKiosk());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить kiosk feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useInterval(() => {
    setIndex((current) => (current + 1) % slides.length);
  }, 9000);

  useInterval(() => {
    void load();
  }, 45000);

  const slide = slides[index];

  const content = useMemo(() => {
    if (!payload) return null;
    if (slide.key === "announcements") {
      return payload.announcements.map((item) => (
        <Card key={item.id} className="bg-white/10 text-white backdrop-blur">
          <p className="text-2xl font-semibold">{item.title}</p>
          <p className="mt-3 text-base text-slate-100">{item.message}</p>
        </Card>
      ));
    }
    if (slide.key === "top_students") {
      return payload.top_students.map((item, itemIndex) => (
        <Card key={item.id} className="bg-white/10 text-white backdrop-blur">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-200">#{itemIndex + 1}</p>
          <p className="mt-2 text-2xl font-semibold">{item.name}</p>
          <p className="mt-3 text-5xl font-semibold">{item.score}</p>
          <p className="mt-2 text-base text-slate-100">{item.achievement}</p>
        </Card>
      ));
    }
    if (slide.key === "replacements") {
      return payload.replacements.map((item) => (
        <Card key={item.id} className="bg-white/10 text-white backdrop-blur">
          <p className="text-2xl font-semibold">{item.day} • {item.slot}</p>
          <p className="mt-3 text-xl">{item.class_id} • {item.subject}</p>
          <p className="mt-2 text-base text-slate-100">{item.note}</p>
        </Card>
      ));
    }
    return payload.events.map((item) => (
      <Card key={item.id} className="bg-white/10 text-white backdrop-blur">
        <p className="text-2xl font-semibold">{item.title}</p>
        <p className="mt-3 text-xl">{item.date} • {item.time}</p>
        <p className="mt-2 text-base text-slate-100">{item.location} • {item.audience}</p>
      </Card>
    ));
  }, [payload, slide.key]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a,#020617)] px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHeader
          title="Kiosk wallboard"
          description="Интерактивная стенгазета: большие surfaces, авто-ротация, актуальные объявления, топ-ученики, замены и события."
          actions={<div className="flex gap-2">{slides.map((item, itemIndex) => <Button key={item.key} variant={itemIndex === index ? "secondary" : "ghost"} onClick={() => setIndex(itemIndex)}>{item.label}</Button>)}</div>}
        />
        <DataState loading={loading} error={error} hasData={Boolean(payload)}>
          <div className="grid gap-4 xl:grid-cols-2">{content}</div>
        </DataState>
      </div>
    </div>
  );
}
