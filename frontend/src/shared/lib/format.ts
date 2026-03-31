export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatRiskTone(risk: number) {
  if (risk >= 70) return "critical";
  if (risk >= 40) return "warning";
  return "good";
}

export function titleFromRole(role: string) {
  switch (role) {
    case "student":
      return "Ученик";
    case "parent":
      return "Родитель";
    case "teacher":
      return "Учитель";
    case "admin":
      return "Администрация";
    default:
      return "Гость";
  }
}
