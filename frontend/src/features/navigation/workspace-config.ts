import type { AppRole } from "@/shared/types/domain";

export type WorkspaceSection = {
  key: string;
  label: string;
  path: string;
  description: string;
};

export type WorkspaceConfig = {
  role: Exclude<AppRole, "guest">;
  title: string;
  homePath: string;
  sections: WorkspaceSection[];
};

const workspaces: Record<Exclude<AppRole, "guest">, WorkspaceConfig> = {
  student: {
    role: "student",
    title: "Прогресс ученика",
    homePath: "/student",
    sections: [
      { key: "overview", label: "Обзор", path: "/student", description: "Главная сводка ученика" },
      { key: "analytics", label: "Аналитика", path: "/student/analytics", description: "Оценки, риски и AI-советы" },
      { key: "timetable", label: "Расписание", path: "/student/timetable", description: "Матрица уроков и фильтры" },
      { key: "portfolio", label: "Портфолио", path: "/student/portfolio", description: "Достижения и верификация" },
      { key: "social", label: "Лента", path: "/student/social", description: "Общий progress wall" },
      { key: "leaderboard", label: "Лидерборд", path: "/student/leaderboard", description: "Геймификация и рост" },
    ],
  },
  parent: {
    role: "parent",
    title: "Режим родителя",
    homePath: "/parent",
    sections: [
      { key: "overview", label: "Неделя", path: "/parent", description: "Краткая AI-выжимка" },
      { key: "analytics", label: "Аналитика", path: "/parent/analytics", description: "Успеваемость ребенка" },
      { key: "timetable", label: "Расписание", path: "/parent/timetable", description: "Школьное расписание" },
      { key: "portfolio", label: "Портфолио", path: "/parent/portfolio", description: "Достижения ребенка" },
      { key: "social", label: "Лента", path: "/parent/social", description: "Общение и поддержка" },
    ],
  },
  teacher: {
    role: "teacher",
    title: "Рабочее место учителя",
    homePath: "/teacher",
    sections: [
      { key: "overview", label: "Обзор", path: "/teacher", description: "Ключевые сигналы класса" },
      { key: "early-warning", label: "Early Warning", path: "/teacher/early-warning", description: "Ученики с рисками" },
      { key: "class-report", label: "Отчет класса", path: "/teacher/class-report", description: "AI-отчет за 1 клик" },
      { key: "timetable", label: "Расписание", path: "/teacher/timetable", description: "Операционная сетка" },
      {
        key: "substitution-notifications",
        label: "Замены",
        path: "/teacher/substitution-notifications",
        description: "Уведомления по заменам",
      },
    ],
  },
  admin: {
    role: "admin",
    title: "Mission Control",
    homePath: "/admin",
    sections: [
      { key: "overview", label: "Обзор", path: "/admin", description: "Общий радар школы" },
      { key: "metrics", label: "Метрики", path: "/admin/metrics", description: "Сводка качества обучения" },
      {
        key: "announcements",
        label: "Объявления",
        path: "/admin/announcements",
        description: "Таргетированные публикации",
      },
      {
        key: "schedule-lab",
        label: "Smart Schedule",
        path: "/admin/schedule-lab",
        description: "Генерация и проверка расписания",
      },
      {
        key: "substitution-ops",
        label: "Замены",
        path: "/admin/substitution-ops",
        description: "Очередь отсутствий и решения",
      },
      {
        key: "portfolio-review",
        label: "Проверка портфолио",
        path: "/admin/portfolio-review",
        description: "Верификация достижений",
      },
      {
        key: "roadmap",
        label: "Roadmap",
        path: "/admin/roadmap",
        description: "Будущие интеграции и placeholders",
      },
    ],
  },
};

export function getWorkspaceForRole(role: Exclude<AppRole, "guest">): WorkspaceConfig {
  return workspaces[role];
}

export function getHomePathForRole(role: Exclude<AppRole, "guest">) {
  return workspaces[role].homePath;
}
