import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--color-brand)] text-white shadow-lg shadow-sky-950/15 hover:bg-[var(--color-brand-strong)]",
        variant === "secondary" && "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
        variant === "ghost" && "bg-transparent text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5", className)}>{children}</section>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Aqbobek Portal</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-950">{value}</p>
      {hint ? <p className="text-sm text-slate-600">{hint}</p> : null}
    </Card>
  );
}

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warning" | "critical" | "info" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "good" && "bg-emerald-100 text-emerald-700",
        tone === "warning" && "bg-amber-100 text-amber-700",
        tone === "critical" && "bg-rose-100 text-rose-700",
        tone === "info" && "bg-sky-100 text-sky-700",
        tone === "neutral" && "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm font-medium text-slate-700", className)}>
      <span>{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-300 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
        {...props}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm font-medium text-slate-700", className)}>
      <span>{label}</span>
      <select
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm font-medium text-slate-700", className)}>
      <span>{label}</span>
      <textarea
        className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
        {...props}
      />
    </label>
  );
}

export function DataState({
  loading,
  error,
  empty,
  hasData,
  children,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  hasData: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return <Card className="text-sm text-slate-500">Загрузка данных...</Card>;
  }

  if (error) {
    return <Card className="text-sm text-rose-700">{error}</Card>;
  }

  if (!hasData) {
    return <Card className="text-sm text-slate-500">{empty || "Данных пока нет."}</Card>;
  }

  return <>{children}</>;
}

export function SplitGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 xl:grid-cols-2">{children}</div>;
}

export function TripleGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
