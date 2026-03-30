import { Fragment, useEffect, useMemo, useState } from "react";
import {
  authLogin,
  createAnnouncement,
  getAiAdvice,
  getAdminMetrics,
  getDbStats,
  getGamificationLeaderboard,
  getGrades,
  getHealth,
  getKioskData,
  getMe,
  getParentWeeklySummary,
  getRisk,
  getScheduleChanges,
  getSchedule,
  getSocialFeed,
  getTeacherClassReport,
  getTeacherEarlyWarning,
  getTimetable,
  listAnnouncements,
  listPortfolio,
  login,
  resetDemoData,
  registerParent,
  registerStudent,
  createPortfolioItem,
  createSocialComment,
  createSocialPost,
  generateSmartSchedule,
} from "./api";
import SubstitutionLab from "./SubstitutionLab";

const ROLES = ["student", "teacher", "parent", "admin"];
const VIEW_LABELS = {
  schedule: "Timetable",
  analytics: "Analytics",
  substitution: "Substitution",
  kiosk: "Kiosk",
};
const ROLE_LABELS = {
  guest: "Guest",
  student: "Student",
  teacher: "Teacher",
  parent: "Parent",
  admin: "Admin",
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_SLOTS = ["08:30", "09:25", "10:20", "11:20", "12:25", "13:30", "14:15", "15:10", "16:05", "16:50"];
const TABLE_MODES = [
  { key: "classes", label: "CLASSES" },
  { key: "teachers", label: "TEACHERS" },
  { key: "rooms", label: "ROOMS" },
  { key: "subjects", label: "SUBJECTS" },
  { key: "general", label: "GENERAL TIMETABLE" },
];
const KIOSK_SLIDES = [
  { key: "announcements", label: "Announcements" },
  { key: "top_students", label: "Top Students" },
  { key: "replacements", label: "Schedule Replacements" },
  { key: "events", label: "School Events" },
];
const KIOSK_ROTATE_MS = 9000;
const KIOSK_REFRESH_MS = 45000;

function riskClassName(risk) {
  if (risk >= 60) return "risk risk-high";
  if (risk >= 30) return "risk risk-medium";
  return "risk risk-low";
}

function formatPercent(value) {
  return `${(value * 100).toFixed(0)}%`;
}

function scheduleItems(schedule) {
  if (!schedule) return [];
  if (Array.isArray(schedule.lessons)) {
    return schedule.lessons.map((item) => ({
      id: `${item.time}-${item.subject}`,
      time: item.time,
      title: item.subject,
      subtitle: item.room ? `Room ${item.room}` : "",
    }));
  }
  if (Array.isArray(schedule.events)) {
    return schedule.events.map((item) => ({
      id: `${item.time}-${item.title}`,
      time: item.time,
      title: item.title,
      subtitle: item.location ? `Location ${item.location}` : "",
    }));
  }
  return [];
}

function sortTimeKey(value) {
  const parts = String(value || "").split(":");
  if (parts.length !== 2) return 9999;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 9999;
  return hours * 60 + minutes;
}

function parseClassGrade(classId) {
  const match = String(classId || "").trim().match(/^(\d{1,2})/);
  return match ? Number(match[1]) : null;
}

function splitMultiValue(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseClassSuffix(classId) {
  const match = String(classId || "").trim().match(/^\d{1,2}\s*(.+)?$/);
  return match?.[1]?.trim() || "";
}

function normalizeClassSuffixForSort(suffix) {
  const map = {
    А: "A",
    а: "A",
    В: "B",
    в: "B",
    С: "C",
    с: "C",
    Е: "E",
    е: "E",
    Н: "H",
    н: "H",
    К: "K",
    к: "K",
    М: "M",
    м: "M",
    О: "O",
    о: "O",
    Р: "P",
    р: "P",
    Т: "T",
    т: "T",
    Х: "X",
    х: "X",
    І: "I",
    і: "I",
    И: "I",
    и: "I",
    Й: "I",
    й: "I",
    Ұ: "U",
    ұ: "U",
    Ү: "U",
    ү: "U",
    Қ: "K",
    қ: "K",
    Ғ: "G",
    ғ: "G",
    Ң: "N",
    ң: "N",
    Һ: "H",
    һ: "H",
  };
  return suffix
    .split("")
    .map((char) => map[char] || char)
    .join("")
    .toUpperCase();
}

function compareClassIds(a, b) {
  const gradeA = parseClassGrade(a);
  const gradeB = parseClassGrade(b);
  if (gradeA !== gradeB) {
    return (gradeA ?? 999) - (gradeB ?? 999);
  }

  const suffixA = normalizeClassSuffixForSort(parseClassSuffix(a));
  const suffixB = normalizeClassSuffixForSort(parseClassSuffix(b));
  const suffixDelta = suffixA.localeCompare(suffixB, "en", { numeric: true, sensitivity: "base" });
  if (suffixDelta !== 0) {
    return suffixDelta;
  }

  return String(a).localeCompare(String(b), "ru", { numeric: true, sensitivity: "base" });
}

function localeCompareRu(a, b) {
  return String(a).localeCompare(String(b), "ru", { numeric: true, sensitivity: "base" });
}

function formatDateValue(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function kioskPriorityClass(priority) {
  if (priority === "high") return "status status-rejected";
  if (priority === "low") return "status status-approved";
  return "status status-pending";
}

function replacementTypeLabel(type) {
  if (type === "substitute_teacher") return "Substitute";
  if (type === "reschedule") return "Rescheduled";
  return "Self-study";
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("mvp_token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("mvp_role") || "");
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("mvp_guest") === "1");
  const [meProfile, setMeProfile] = useState(null);

  const [activeView, setActiveView] = useState("schedule");

  const [gradesData, setGradesData] = useState(null);
  const [parentSummary, setParentSummary] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [risks, setRisks] = useState({});
  const [advice, setAdvice] = useState({});

  const [timetable, setTimetable] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [tableMode, setTableMode] = useState("classes");
  const [kioskData, setKioskData] = useState(null);
  const [kioskLoading, setKioskLoading] = useState(false);
  const [kioskError, setKioskError] = useState("");
  const [kioskSlideIndex, setKioskSlideIndex] = useState(0);
  const [isKioskFullscreen, setIsKioskFullscreen] = useState(false);
  const [liveEvent, setLiveEvent] = useState("");
  const [wsState, setWsState] = useState("offline");
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [apiHealth, setApiHealth] = useState({ status: "unknown", uptime_seconds: 0, checked_at: "" });

  const [teacherClassId, setTeacherClassId] = useState("10A");
  const [teacherWarnings, setTeacherWarnings] = useState([]);
  const [teacherReport, setTeacherReport] = useState("");

  const [adminMetrics, setAdminMetrics] = useState(null);
  const [announcementRows, setAnnouncementRows] = useState([]);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announcePriority, setAnnouncePriority] = useState("medium");
  const [announceRoles, setAnnounceRoles] = useState("student,teacher,parent,admin");
  const [announceClasses, setAnnounceClasses] = useState("");
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [scheduleChanges, setScheduleChanges] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [resetSummary, setResetSummary] = useState("");

  const [socialFeed, setSocialFeed] = useState([]);
  const [socialPostText, setSocialPostText] = useState("");
  const [socialCommentDrafts, setSocialCommentDrafts] = useState({});
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [registerStudentName, setRegisterStudentName] = useState("");
  const [registerStudentClass, setRegisterStudentClass] = useState("10A");
  const [registerStudentEmail, setRegisterStudentEmail] = useState("");
  const [registerStudentPassword, setRegisterStudentPassword] = useState("");
  const [registerParentName, setRegisterParentName] = useState("");
  const [registerParentEmail, setRegisterParentEmail] = useState("");
  const [registerParentPassword, setRegisterParentPassword] = useState("");
  const [registerParentChildEmail, setRegisterParentChildEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = useMemo(() => Boolean(token && role), [token, role]);
  const hasSession = isGuest || isAuthenticated;

  const availableViews = useMemo(() => {
    if (!hasSession) return [];
    if (!isAuthenticated) return ["schedule", "kiosk"];
    if (role === "admin" || role === "teacher") return ["schedule", "analytics", "substitution", "kiosk"];
    return ["schedule", "analytics", "kiosk"];
  }, [hasSession, isAuthenticated, role]);

  const wsUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    if (base.startsWith("https://")) return `wss://${base.slice("https://".length)}/ws/updates`;
    if (base.startsWith("http://")) return `ws://${base.slice("http://".length)}/ws/updates`;
    return `${base}/ws/updates`;
  }, []);

  useEffect(() => {
    if (!availableViews.includes(activeView)) {
      setActiveView(availableViews[0] || "schedule");
    }
  }, [activeView, availableViews]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsKioskFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const health = await getHealth();
        if (cancelled) return;
        setApiHealth({
          status: health?.status || "unknown",
          uptime_seconds: Number(health?.uptime_seconds || 0),
          checked_at: new Date().toISOString(),
        });
      } catch {
        if (cancelled) return;
        setApiHealth({
          status: "down",
          uptime_seconds: 0,
          checked_at: new Date().toISOString(),
        });
      }
    }

    loadHealth();
    const timer = window.setInterval(loadHealth, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const studentMetrics = useMemo(() => {
    if (!gradesData?.subjects?.length) return null;
    const allRisks = gradesData.subjects.map((subject) => risks[subject.name] ?? 0);
    const totalRisk = allRisks.reduce((sum, value) => sum + value, 0);
    const averageRisk = Math.round(totalRisk / allRisks.length);
    const averageAttendance =
      gradesData.subjects.reduce((sum, subject) => sum + subject.attendance, 0) / gradesData.subjects.length;
    const totalSubjects = gradesData.subjects.length;
    return { averageRisk, averageAttendance, totalSubjects };
  }, [gradesData, risks]);

  const roleScheduleList = useMemo(() => scheduleItems(schedule), [schedule]);
  const timetableFallbackReason = useMemo(() => timetable?.fallback_reason || "", [timetable]);
  const kioskSlide = useMemo(() => KIOSK_SLIDES[kioskSlideIndex] || KIOSK_SLIDES[0], [kioskSlideIndex]);
  const kioskAnnouncements = useMemo(
    () => (Array.isArray(kioskData?.announcements) ? kioskData.announcements : []),
    [kioskData],
  );
  const kioskTopStudents = useMemo(() => {
    if (!Array.isArray(kioskData?.top_students)) return [];
    return [...kioskData.top_students].sort((a, b) => b.score - a.score);
  }, [kioskData]);
  const kioskReplacements = useMemo(() => {
    if (!Array.isArray(kioskData?.replacements)) return [];
    return [...kioskData.replacements].sort((a, b) => {
      const dayDelta = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
      if (dayDelta !== 0) return dayDelta;
      return sortTimeKey(a.slot) - sortTimeKey(b.slot);
    });
  }, [kioskData]);
  const kioskEvents = useMemo(
    () => (Array.isArray(kioskData?.events) ? kioskData.events : []),
    [kioskData],
  );
  const kioskGeneratedAt = useMemo(() => formatDateValue(kioskData?.generated_at), [kioskData]);

  const schoolEntries = useMemo(() => {
    if (!timetable?.entries) return [];
    return timetable.entries.filter((entry) => {
      const grade = parseClassGrade(entry.class_id);
      return grade !== null && grade >= 7 && grade <= 12;
    });
  }, [timetable]);

  const displayDays = useMemo(
    () => (Array.isArray(timetable?.days) && timetable.days.length > 0 ? timetable.days : DAY_ORDER),
    [timetable],
  );

  const slotTemplate = useMemo(() => {
    const sourceSlots =
      Array.isArray(timetable?.slots) && timetable.slots.length > 0
        ? timetable.slots
        : [...new Set(schoolEntries.map((entry) => entry.slot).filter(Boolean))];
    const orderedSlots = [...sourceSlots].sort((a, b) => sortTimeKey(a) - sortTimeKey(b));
    const finalSlots = orderedSlots.length > 0 ? orderedSlots : DEFAULT_SLOTS;
    return finalSlots.map((slot, index) => ({ lessonNo: index + 1, slot }));
  }, [timetable, schoolEntries]);

  const slotOrder = useMemo(() => slotTemplate.map((item) => item.slot), [slotTemplate]);

  const classOptions = useMemo(() => {
    return [...new Set(schoolEntries.map((entry) => entry.class_id))].sort(compareClassIds);
  }, [schoolEntries]);

  const teacherOptions = useMemo(() => {
    const names = new Set();
    for (const entry of schoolEntries) {
      for (const teacher of splitMultiValue(entry.teacher)) {
        names.add(teacher);
      }
    }
    return [...names].sort(localeCompareRu);
  }, [schoolEntries]);

  const roomOptions = useMemo(() => {
    const rooms = new Set();
    for (const entry of schoolEntries) {
      for (const room of splitMultiValue(entry.room)) {
        rooms.add(room);
      }
    }
    return [...rooms].sort(localeCompareRu);
  }, [schoolEntries]);

  const subjectOptions = useMemo(() => {
    return [...new Set(schoolEntries.map((entry) => entry.subject).filter(Boolean))].sort(localeCompareRu);
  }, [schoolEntries]);

  useEffect(() => {
    if (!classOptions.length) {
      setClassFilter("");
      return;
    }
    if (!classFilter || !classOptions.includes(classFilter)) {
      setClassFilter(classOptions[0]);
    }
  }, [classOptions, classFilter]);

  useEffect(() => {
    if (!teacherOptions.length) {
      setTeacherFilter("");
      return;
    }
    if (!teacherFilter || !teacherOptions.includes(teacherFilter)) {
      setTeacherFilter(teacherOptions[0]);
    }
  }, [teacherOptions, teacherFilter]);

  useEffect(() => {
    if (!roomOptions.length) {
      setRoomFilter("");
      return;
    }
    if (!roomFilter || !roomOptions.includes(roomFilter)) {
      setRoomFilter(roomOptions[0]);
    }
  }, [roomOptions, roomFilter]);

  useEffect(() => {
    if (!subjectOptions.length) {
      setSubjectFilter("");
      return;
    }
    if (!subjectFilter || !subjectOptions.includes(subjectFilter)) {
      setSubjectFilter(subjectOptions[0]);
    }
  }, [subjectOptions, subjectFilter]);

  const filteredTimetable = useMemo(() => {
    if (!schoolEntries.length) return [];

    let rows = schoolEntries.filter((entry) => {
      if (dayFilter !== "all" && entry.day !== dayFilter) return false;
      return true;
    });

    if (tableMode === "classes") {
      if (!classFilter) return [];
      rows = rows.filter((entry) => entry.class_id === classFilter);
    }
    if (tableMode === "teachers") {
      if (!teacherFilter) return [];
      rows = rows.filter((entry) => splitMultiValue(entry.teacher).includes(teacherFilter));
    }
    if (tableMode === "rooms") {
      if (!roomFilter) return [];
      rows = rows.filter((entry) => splitMultiValue(entry.room).includes(roomFilter));
    }
    if (tableMode === "subjects") {
      if (!subjectFilter) return [];
      rows = rows.filter((entry) => entry.subject === subjectFilter);
    }

    return rows.sort((a, b) => {
      const dayDelta = displayDays.indexOf(a.day) - displayDays.indexOf(b.day);
      if (dayDelta !== 0) return dayDelta;
      const slotDelta = slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot);
      if (slotDelta !== 0) return slotDelta;
      return sortTimeKey(a.slot) - sortTimeKey(b.slot);
    });
  }, [
    schoolEntries,
    dayFilter,
    classFilter,
    teacherFilter,
    roomFilter,
    subjectFilter,
    tableMode,
    displayDays,
    slotOrder,
  ]);

  const scheduleTitle = useMemo(() => {
    if (tableMode === "classes") return classFilter || "CLASS";
    if (tableMode === "teachers") return teacherFilter || "TEACHER";
    if (tableMode === "rooms") return roomFilter || "ROOM";
    if (tableMode === "subjects") return subjectFilter || "SUBJECT";
    return "GENERAL TIMETABLE";
  }, [tableMode, classFilter, teacherFilter, roomFilter, subjectFilter]);

  const entityOptions = useMemo(() => {
    if (tableMode === "classes") return classOptions;
    if (tableMode === "teachers") return teacherOptions;
    if (tableMode === "rooms") return roomOptions;
    if (tableMode === "subjects") return subjectOptions;
    return [];
  }, [tableMode, classOptions, teacherOptions, roomOptions, subjectOptions]);

  const entityValue = useMemo(() => {
    if (tableMode === "classes") return classFilter;
    if (tableMode === "teachers") return teacherFilter;
    if (tableMode === "rooms") return roomFilter;
    if (tableMode === "subjects") return subjectFilter;
    return "";
  }, [tableMode, classFilter, teacherFilter, roomFilter, subjectFilter]);

  const entityLabel = useMemo(() => {
    if (tableMode === "classes") return "Class";
    if (tableMode === "teachers") return "Teacher";
    if (tableMode === "rooms") return "Room";
    if (tableMode === "subjects") return "Subject";
    return "";
  }, [tableMode]);

  const timetableGridByDay = useMemo(() => {
    const byDayAndSlot = new Map();
    for (const entry of filteredTimetable) {
      const key = `${entry.day}__${entry.slot}`;
      if (!byDayAndSlot.has(key)) {
        byDayAndSlot.set(key, []);
      }
      byDayAndSlot.get(key).push(entry);
    }

    return displayDays.map((day) => ({
      day,
      cells: slotTemplate.map((lesson) => ({
        lessonNo: lesson.lessonNo,
        slot: lesson.slot,
        entries: byDayAndSlot.get(`${day}__${lesson.slot}`) || [],
      })),
    }));
  }, [filteredTimetable, displayDays, slotTemplate]);

  const apiStatusText = useMemo(() => {
    if (apiHealth.status === "ok") return "API healthy";
    if (apiHealth.status === "down") return "API unavailable";
    return "API checking";
  }, [apiHealth.status]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function bootstrapAuthenticated() {
      setLoading(true);
      setError("");
      try {
        const me = await getMe(token);
        setRole(me.role);
        setMeProfile(me);
        localStorage.setItem("mvp_role", me.role);

        const roleSchedule = await getSchedule(me.role);
        setSchedule(roleSchedule);

        if (me.role === "student") {
          const studentGrades = await getGrades(token);
          setGradesData(studentGrades);
          setParentSummary(null);
          const [feed, portfolio, board] = await Promise.all([
            getSocialFeed(token),
            listPortfolio(token),
            getGamificationLeaderboard(10),
          ]);
          setSocialFeed(feed.posts || []);
          setPortfolioItems(portfolio.items || []);
          setLeaderboard(board || []);
          setTeacherWarnings([]);
          setTeacherReport("");
          setAdminMetrics(null);

          const riskEntries = await Promise.all(
            studentGrades.subjects.map(async (subject) => {
              const riskResponse = await getRisk({
                subject: subject.name,
                grades: subject.grades,
                attendance: subject.attendance,
              });
              return [subject.name, riskResponse.risk];
            }),
          );
          setRisks(Object.fromEntries(riskEntries));
        } else if (me.role === "parent") {
          const summary = await getParentWeeklySummary(token);
          setParentSummary(summary);
          setGradesData(null);
          setRisks({});
          setAdvice({});
          const [feed, portfolio, board] = await Promise.all([
            getSocialFeed(token),
            listPortfolio(token),
            getGamificationLeaderboard(10),
          ]);
          setSocialFeed(feed.posts || []);
          setPortfolioItems(portfolio.items || []);
          setLeaderboard(board || []);
          setTeacherWarnings([]);
          setTeacherReport("");
          setAdminMetrics(null);
        } else if (me.role === "teacher") {
          const warning = await getTeacherEarlyWarning({ classId: teacherClassId, limit: 25 });
          setTeacherWarnings(warning.rows || []);
          setTeacherReport("");
          setGradesData(null);
          setParentSummary(null);
          setSocialFeed([]);
          setPortfolioItems([]);
          setLeaderboard([]);
          setAdminMetrics(null);
        } else if (me.role === "admin") {
          const [metrics, notes, changes, stats] = await Promise.all([
            getAdminMetrics(),
            listAnnouncements({}),
            getScheduleChanges(25),
            getDbStats(),
          ]);
          setAdminMetrics(metrics);
          setAnnouncementRows(notes);
          setScheduleChanges(changes);
          setDbStats(stats);
          setGradesData(null);
          setParentSummary(null);
          setSocialFeed([]);
          setPortfolioItems([]);
          setLeaderboard([]);
          setTeacherWarnings([]);
          setTeacherReport("");
        } else {
          setGradesData(null);
          setParentSummary(null);
          setRisks({});
          setAdvice({});
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
        clearAuthSession();
      } finally {
        setLoading(false);
      }
    }

    bootstrapAuthenticated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, teacherClassId]);

  useEffect(() => {
    if (!hasSession) return;

    async function loadTimetable() {
      setTimetableLoading(true);
      setError("");
      try {
        const data = await getTimetable();
        setTimetable(data);
      } catch (err) {
        setTimetable(null);
        setError(err.message || "Cannot load timetable");
      } finally {
        setTimetableLoading(false);
      }
    }

    loadTimetable();
  }, [hasSession]);

  useEffect(() => {
    if (!hasSession) return;

    let cancelled = false;

    async function loadKiosk(showSpinner = false) {
      if (showSpinner) {
        setKioskLoading(true);
      }
      try {
        const data = await getKioskData("aqbobek");
        if (!cancelled) {
          setKioskData(data);
          setKioskError("");
        }
      } catch (err) {
        if (!cancelled) {
          setKioskError(err.message || "Cannot load kiosk feed");
        }
      } finally {
        if (!cancelled && showSpinner) {
          setKioskLoading(false);
        }
      }
    }

    loadKiosk(true);
    const refreshTimer = window.setInterval(() => {
      loadKiosk(false);
    }, KIOSK_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [hasSession]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setWsState("offline");
      return;
    }
    setWsState("connecting");
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsState("connected");
    };

    socket.onerror = () => {
      setWsState("error");
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveEvent(`${data.event} at ${formatDateValue(data.sent_at)}`);
        setLastSyncAt(new Date().toISOString());
        if (role === "admin") {
          const [metrics, notes, changes, stats] = await Promise.all([
            getAdminMetrics(),
            listAnnouncements({}),
            getScheduleChanges(25),
            getDbStats(),
          ]);
          setAdminMetrics(metrics);
          setAnnouncementRows(notes);
          setScheduleChanges(changes);
          setDbStats(stats);
        }
        if (role === "student" || role === "parent") {
          const [feed, portfolio, board] = await Promise.all([
            getSocialFeed(token),
            listPortfolio(token),
            getGamificationLeaderboard(10),
          ]);
          setSocialFeed(feed.posts || []);
          setPortfolioItems(portfolio.items || []);
          setLeaderboard(board || []);
        }
        const kiosk = await getKioskData("aqbobek");
        setKioskData(kiosk);
      } catch {
        // Keep UI resilient to malformed socket events.
      }
    };

    socket.onclose = () => {
      setWsState("disconnected");
    };

    return () => {
      socket.close();
    };
  }, [isAuthenticated, token, role, wsUrl]);

  useEffect(() => {
    if (activeView !== "kiosk") return;
    const slideTimer = window.setInterval(() => {
      setKioskSlideIndex((prev) => (prev + 1) % KIOSK_SLIDES.length);
    }, KIOSK_ROTATE_MS);
    return () => {
      window.clearInterval(slideTimer);
    };
  }, [activeView]);

  useEffect(() => {
    if (activeView === "kiosk") {
      setKioskSlideIndex(0);
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "kiosk") return;

    function onKeydown(event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextKioskSlide();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevKioskSlide();
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleKioskFullscreen();
      }
    }

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [activeView]);

  function clearAuthSession() {
    setToken("");
    setRole("");
    setMeProfile(null);
    setSchedule(null);
    setGradesData(null);
    setParentSummary(null);
    setRisks({});
    setAdvice({});
    setTeacherWarnings([]);
    setTeacherReport("");
    setAdminMetrics(null);
    setAnnouncementRows([]);
    setGeneratedSchedule(null);
    setScheduleChanges([]);
    setDbStats(null);
    setSocialFeed([]);
    setSocialPostText("");
    setPortfolioItems([]);
    setLeaderboard([]);
    setLiveEvent("");
    setWsState("offline");
    setLastSyncAt("");
    setResetSummary("");
    localStorage.removeItem("mvp_token");
    localStorage.removeItem("mvp_role");
  }

  async function onRoleSelect(selectedRole, targetView = "schedule") {
    setLoading(true);
    setError("");
    try {
      const data = await login(selectedRole);
      setToken(data.token);
      setRole(data.role);
      setIsGuest(false);
      setActiveView(targetView);
      localStorage.setItem("mvp_token", data.token);
      localStorage.setItem("mvp_role", data.role);
      localStorage.removeItem("mvp_guest");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onAccountLogin() {
    setLoading(true);
    setError("");
    try {
      const data = await authLogin({ email: authEmail, password: authPassword });
      setToken(data.token);
      setRole(data.role);
      setIsGuest(false);
      setActiveView("analytics");
      localStorage.setItem("mvp_token", data.token);
      localStorage.setItem("mvp_role", data.role);
      localStorage.removeItem("mvp_guest");
      setAuthPassword("");
    } catch (err) {
      setError(err.message || "Account login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterStudent() {
    setLoading(true);
    setError("");
    try {
      const data = await registerStudent({
        name: registerStudentName,
        class_id: registerStudentClass,
        email: registerStudentEmail,
        password: registerStudentPassword,
      });
      setToken(data.token);
      setRole(data.role);
      setIsGuest(false);
      setActiveView("analytics");
      localStorage.setItem("mvp_token", data.token);
      localStorage.setItem("mvp_role", data.role);
      localStorage.removeItem("mvp_guest");
      setRegisterStudentPassword("");
    } catch (err) {
      setError(err.message || "Student registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterParent() {
    setLoading(true);
    setError("");
    try {
      const data = await registerParent({
        name: registerParentName,
        email: registerParentEmail,
        password: registerParentPassword,
        child_student_email: registerParentChildEmail,
      });
      setToken(data.token);
      setRole(data.role);
      setIsGuest(false);
      setActiveView("analytics");
      localStorage.setItem("mvp_token", data.token);
      localStorage.setItem("mvp_role", data.role);
      localStorage.removeItem("mvp_guest");
      setRegisterParentPassword("");
    } catch (err) {
      setError(err.message || "Parent registration failed");
    } finally {
      setLoading(false);
    }
  }

  function onContinueAsGuest() {
    clearAuthSession();
    setIsGuest(true);
    setActiveView("schedule");
    localStorage.setItem("mvp_guest", "1");
  }

  function onExitGuest() {
    setIsGuest(false);
    localStorage.removeItem("mvp_guest");
    setActiveView("schedule");
  }

  function onLogout() {
    clearAuthSession();
    setIsGuest(false);
    setTimetable(null);
    setActiveView("schedule");
    localStorage.removeItem("mvp_guest");
  }

  function resetTimetableFilters() {
    setDayFilter("all");
    setClassFilter(classOptions[0] || "");
    setTeacherFilter(teacherOptions[0] || "");
    setRoomFilter(roomOptions[0] || "");
    setSubjectFilter(subjectOptions[0] || "");
  }

  function onEntityChange(value) {
    if (tableMode === "classes") setClassFilter(value);
    if (tableMode === "teachers") setTeacherFilter(value);
    if (tableMode === "rooms") setRoomFilter(value);
    if (tableMode === "subjects") setSubjectFilter(value);
  }

  async function onGetAdvice(subject) {
    setError("");
    try {
      const response = await getAiAdvice({
        subject: subject.name,
        grades: subject.grades,
        attendance: subject.attendance,
        risk: risks[subject.name],
      });
      setAdvice((prev) => ({ ...prev, [subject.name]: response.advice }));
    } catch (err) {
      setError(err.message || "Cannot get advice");
    }
  }

  async function onRefreshTeacherWarnings() {
    setError("");
    try {
      const data = await getTeacherEarlyWarning({ classId: teacherClassId, limit: 25 });
      setTeacherWarnings(data.rows || []);
    } catch (err) {
      setError(err.message || "Cannot load teacher warnings");
    }
  }

  async function onGenerateTeacherReport() {
    setError("");
    try {
      const data = await getTeacherClassReport({ class_id: teacherClassId });
      setTeacherReport(data.report || "");
    } catch (err) {
      setError(err.message || "Cannot generate class report");
    }
  }

  async function onCreateAnnouncement() {
    setError("");
    try {
      const roles = announceRoles
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const classes = announceClasses
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      await createAnnouncement(
        {
          title: announceTitle,
          message: announceMessage,
          priority: announcePriority,
          target_roles: roles,
          target_classes: classes,
        },
        token,
      );
      setAnnounceTitle("");
      setAnnounceMessage("");
      const notes = await listAnnouncements({});
      setAnnouncementRows(notes);
    } catch (err) {
      setError(err.message || "Cannot publish announcement");
    }
  }

  async function onGenerateSchedule() {
    setError("");
    try {
      const generated = await generateSmartSchedule(token, {});
      setGeneratedSchedule(generated);
      const [changes, stats] = await Promise.all([getScheduleChanges(25), getDbStats()]);
      setScheduleChanges(changes);
      setDbStats(stats);
    } catch (err) {
      setError(err.message || "Cannot generate schedule");
    }
  }

  async function onResetDemoData() {
    setError("");
    setResetSummary("");
    try {
      const response = await resetDemoData(token);
      const stats = response.stats || {};
      const session = response.session || null;
      if (session?.token) {
        setToken(session.token);
        setRole(session.role || "admin");
        localStorage.setItem("mvp_token", session.token);
        localStorage.setItem("mvp_role", session.role || "admin");
      }
      setGeneratedSchedule(null);
      setScheduleChanges([]);
      setDbStats(stats);
      setAnnouncementRows(await listAnnouncements({}));
      setResetSummary(
        `Demo data reset: ${stats.students || 0} students, ${stats.teachers || 0} teachers, ${stats.accounts || 0} accounts.`,
      );
    } catch (err) {
      setError(err.message || "Cannot reset demo data");
    }
  }

  async function onCreateSocialPost() {
    setError("");
    try {
      if (!socialPostText.trim()) return;
      await createSocialPost(token, { content: socialPostText });
      setSocialPostText("");
      const feed = await getSocialFeed(token);
      setSocialFeed(feed.posts || []);
    } catch (err) {
      setError(err.message || "Cannot create social post");
    }
  }

  async function onCreateSocialComment(postId) {
    setError("");
    const text = socialCommentDrafts[postId] || "";
    if (!text.trim()) return;
    try {
      await createSocialComment(token, postId, { text });
      setSocialCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      const feed = await getSocialFeed(token);
      setSocialFeed(feed.posts || []);
    } catch (err) {
      setError(err.message || "Cannot add comment");
    }
  }

  async function onCreatePortfolioItem() {
    setError("");
    if (!portfolioTitle.trim() || !portfolioDescription.trim()) return;
    try {
      await createPortfolioItem(token, { title: portfolioTitle, description: portfolioDescription });
      setPortfolioTitle("");
      setPortfolioDescription("");
      const portfolio = await listPortfolio(token);
      setPortfolioItems(portfolio.items || []);
    } catch (err) {
      setError(err.message || "Cannot create portfolio item");
    }
  }

  async function onDemoOpen(roleName, targetView) {
    if (roleName === "guest") {
      onContinueAsGuest();
      setActiveView(targetView);
      return;
    }
    if (!isGuest && role === roleName) {
      setActiveView(targetView);
      return;
    }
    await onRoleSelect(roleName, targetView);
  }

  function nextKioskSlide() {
    setKioskSlideIndex((prev) => (prev + 1) % KIOSK_SLIDES.length);
  }

  function prevKioskSlide() {
    setKioskSlideIndex((prev) => (prev - 1 + KIOSK_SLIDES.length) % KIOSK_SLIDES.length);
  }

  async function toggleKioskFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      setKioskError("Fullscreen mode is not available in this browser context");
    }
  }

  if (!hasSession) {
    return (
      <main className="login-shell">
        <section className="login-card fade-in">
          <p className="eyebrow">Aqbobek School Platform</p>
          <h1>Choose Access Mode</h1>
          <p className="muted">
            Guest mode opens timetable page. Authorized mode unlocks AI analytics and adaptive substitution workflows.
          </p>
          <div className="role-buttons">
            {ROLES.map((r) => (
              <button className="role-pill" key={r} onClick={() => onRoleSelect(r)} disabled={loading}>
                Sign in as {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <div className="sub-grid">
            <article className="card">
              <h3>Account Login</h3>
              <label>
                Email
                <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="student@aqbobek.kz" />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••"
                />
              </label>
              <button onClick={onAccountLogin} disabled={loading}>
                Login by account
              </button>
            </article>

            <article className="card">
              <h3>Register Student</h3>
              <label>
                Full name
                <input value={registerStudentName} onChange={(e) => setRegisterStudentName(e.target.value)} />
              </label>
              <label>
                Class
                <input value={registerStudentClass} onChange={(e) => setRegisterStudentClass(e.target.value)} placeholder="10A" />
              </label>
              <label>
                Student email
                <input value={registerStudentEmail} onChange={(e) => setRegisterStudentEmail(e.target.value)} />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerStudentPassword}
                  onChange={(e) => setRegisterStudentPassword(e.target.value)}
                />
              </label>
              <button onClick={onRegisterStudent} disabled={loading}>
                Register student
              </button>
            </article>

            <article className="card">
              <h3>Register Parent</h3>
              <label>
                Parent name
                <input value={registerParentName} onChange={(e) => setRegisterParentName(e.target.value)} />
              </label>
              <label>
                Parent email
                <input value={registerParentEmail} onChange={(e) => setRegisterParentEmail(e.target.value)} />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerParentPassword}
                  onChange={(e) => setRegisterParentPassword(e.target.value)}
                />
              </label>
              <label>
                Linked student email
                <input value={registerParentChildEmail} onChange={(e) => setRegisterParentChildEmail(e.target.value)} />
              </label>
              <button onClick={onRegisterParent} disabled={loading}>
                Register parent
              </button>
            </article>
          </div>

          <button className="ghost-btn" onClick={onContinueAsGuest} disabled={loading}>
            Continue as guest
          </button>
          <p className="muted">
            Demo accounts: student@aqbobek.kz / student123, parent@aqbobek.kz / parent123, teacher@aqbobek.kz /
            teacher123, admin@aqbobek.kz / admin123
          </p>
          {loading && <p>Signing in...</p>}
          {error && <p className="error">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className={`container app-shell ${activeView === "kiosk" ? "kiosk-shell" : ""}`}>
      <header className="topbar fade-in">
        <div>
          <p className="eyebrow">Aqbobek School Platform</p>
          <h1>
            {activeView === "kiosk"
              ? "Kiosk Mode: Hall Display"
              : isGuest
                ? "Guest Timetable View"
                : "Operational Intelligence Dashboard"}
          </h1>
          {!isGuest && meProfile?.display_name && <p className="muted">User: {meProfile.display_name}</p>}
          {liveEvent && <p className="muted">Live: {liveEvent}</p>}
          <p className="muted">
            {apiStatusText} | WS: {wsState} | Last sync: {formatDateValue(lastSyncAt) || "n/a"}
          </p>
        </div>
        <div className="topbar-actions">
          <span className="role-tag">{isGuest ? ROLE_LABELS.guest : ROLE_LABELS[role] || role}</span>
          {isGuest ? (
            <button onClick={onExitGuest}>Sign in</button>
          ) : (
            <button onClick={onLogout}>Log out</button>
          )}
        </div>
      </header>

      <nav className="view-tabs fade-in delay-1">
        {availableViews.map((view) => (
          <button
            key={view}
            className={`tab-btn ${activeView === view ? "tab-btn-active" : ""}`}
            onClick={() => setActiveView(view)}
          >
            {VIEW_LABELS[view] || view}
          </button>
        ))}
      </nav>

      <section className="panel fade-in delay-1 demo-flow">
        <div className="panel-head">
          <h2>Demo Flow</h2>
          <p className="muted">One-click transitions for jury presentation</p>
        </div>
        <div className="demo-flow-actions">
          <button onClick={() => onDemoOpen("student", "analytics")} disabled={loading}>
            1. Student Analytics
          </button>
          <button onClick={() => onDemoOpen("teacher", "analytics")} disabled={loading}>
            2. Teacher Snapshot
          </button>
          <button onClick={() => onDemoOpen("parent", "analytics")} disabled={loading}>
            3. Parent Summary
          </button>
          <button onClick={() => onDemoOpen("admin", "substitution")} disabled={loading}>
            4. Admin Substitution
          </button>
          <button onClick={() => onDemoOpen(isGuest ? "guest" : role, "kiosk")} disabled={loading}>
            5. Kiosk Display
          </button>
        </div>
      </section>

      {loading && <p>Loading data...</p>}
      {error && <p className="error">{error}</p>}

      {activeView === "schedule" && (
        <section className="panel fade-in delay-2 classic-schedule">
          <div className="classic-nav">
            {TABLE_MODES.map((mode) => (
              <button
                key={mode.key}
                className={`classic-nav-item ${tableMode === mode.key ? "classic-nav-item-active" : ""}`}
                onClick={() => setTableMode(mode.key)}
              >
                {mode.label}
              </button>
            ))}
            <div className="classic-nav-spacer" />
            <button className="classic-mini-btn">FIT</button>
            <button className="classic-mini-btn">REGULAR</button>
          </div>

          <div className="classic-meta">
            <p className="classic-school">
              {timetable?.school || "EduPage"} | {timetable?.source || "edupage_rpc"}
            </p>
            {timetableFallbackReason && (
              <p className="muted">Live source unavailable, using mock fallback data.</p>
            )}
            <h2 className="classic-class-title">{scheduleTitle}</h2>
          </div>

          <div className="classic-filter-row">
            <label>
              Day
              <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                <option value="all">All days</option>
                {displayDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            {tableMode !== "general" && (
              <label>
                {entityLabel}
                <select value={entityValue} onChange={(e) => onEntityChange(e.target.value)}>
                  {entityOptions.length === 0 && (
                    <option value="" disabled>
                      No options
                    </option>
                  )}
                  {entityOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {tableMode === "general" && (
              <label>
                Scope
                <input value="All classes 7-12" readOnly />
              </label>
            )}

            <label>
              Lessons
              <input value={String(filteredTimetable.length)} readOnly />
            </label>

            <div className="filter-actions">
              <button onClick={resetTimetableFilters}>Reset</button>
            </div>
          </div>

          {timetableLoading && <p>Loading timetable...</p>}
          {!timetableLoading && filteredTimetable.length === 0 && <p className="muted">No lessons found for filters.</p>}

          {!timetableLoading && filteredTimetable.length > 0 && (
            <div className="timetable-wrap">
              <div className="timetable-grid">
                <div className="tt-head tt-sticky">Day</div>
                {slotTemplate.map((lesson) => (
                  <div key={`head-${lesson.lessonNo}`} className="tt-head tt-head-lesson">
                    <p>Lesson {lesson.lessonNo}</p>
                    <p>{lesson.slot}</p>
                  </div>
                ))}

                {timetableGridByDay.map((row) => (
                  <Fragment key={`day-${row.day}`}>
                    <div className="tt-day-label">
                      <p>{row.day}</p>
                    </div>
                    {row.cells.map((cell) => (
                      <div key={`${row.day}-${cell.slot}`} className="tt-cell">
                        {cell.entries.length === 0 && <p className="tt-empty">-</p>}
                        {cell.entries.length > 0 && (
                          <div className="tt-entry-list">
                            {cell.entries.slice(0, 2).map((entry) => (
                              <div
                                key={`${entry.day}-${entry.slot}-${entry.class_id}-${entry.subject}-${entry.teacher}`}
                                className="tt-entry"
                              >
                                <p className="tt-subject">{entry.subject}</p>
                                {tableMode === "classes" && <p className="tt-meta">Room {entry.room || "-"}</p>}
                                {tableMode !== "classes" && <p className="tt-meta">Class {entry.class_id}</p>}
                                {tableMode === "rooms" ? (
                                  <p className="tt-meta">{entry.teacher}</p>
                                ) : (
                                  <p className="tt-meta">
                                    {tableMode === "teachers" ? `Room ${entry.room || "-"}` : entry.teacher}
                                  </p>
                                )}
                              </div>
                            ))}
                            {cell.entries.length > 2 && (
                              <p className="tt-more">+{cell.entries.length - 2} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="classic-footnote">
            <p>Valid period: current academic year</p>
          </div>
        </section>
      )}
      {activeView === "analytics" && isAuthenticated && (
        <>
          {role === "student" && gradesData && (
            <>
              <section className="metric-grid fade-in delay-2">
                <article className="metric-card">
                  <p className="metric-label">Student</p>
                  <p className="metric-value">{gradesData.student}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Average Risk</p>
                  <p className="metric-value">{studentMetrics?.averageRisk ?? 0}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Average Attendance</p>
                  <p className="metric-value">{formatPercent(studentMetrics?.averageAttendance ?? 0)}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Tracked Subjects</p>
                  <p className="metric-value">{studentMetrics?.totalSubjects ?? 0}</p>
                </article>
              </section>

              <section className="panel fade-in delay-2">
                <div className="panel-head">
                  <h2>Learning Snapshot</h2>
                  <p className="muted">Subjects, risk level, and AI advice in one place</p>
                </div>
                <div className="subject-grid">
                  {gradesData.subjects.map((subject, index) => {
                    const risk = risks[subject.name] ?? 0;
                    return (
                      <article
                        key={subject.name}
                        className="card stagger"
                        style={{ animationDelay: `${index * 90}ms` }}
                      >
                        <div className="card-head">
                          <h3>{subject.name}</h3>
                          <span className={riskClassName(risk)}>Risk {risk}</span>
                        </div>
                        <p>
                          <strong>Grades:</strong> {subject.grades.join(", ")}
                        </p>
                        <p>
                          <strong>Attendance:</strong> {formatPercent(subject.attendance)}
                        </p>
                        <p>
                          <strong>Topics:</strong> {subject.topics.join(", ")}
                        </p>
                        <button onClick={() => onGetAdvice(subject)}>Get advice</button>
                        {advice[subject.name] && <p className="advice">{advice[subject.name]}</p>}
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {role === "student" && !loading && !gradesData && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Student Analytics</h2>
              </div>
              <p className="muted">No student analytics data is available right now.</p>
            </section>
          )}

          {role === "parent" && parentSummary && (
            <>
              <section className="metric-grid fade-in delay-2">
                <article className="metric-card">
                  <p className="metric-label">Child</p>
                  <p className="metric-value">{parentSummary.child_name}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Class</p>
                  <p className="metric-value">{parentSummary.class_id}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Risk Score</p>
                  <p className="metric-value">{parentSummary.risk_score}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Attendance</p>
                  <p className="metric-value">{formatPercent(parentSummary.average_attendance)}</p>
                </article>
              </section>

              <section className="panel fade-in delay-2">
                <div className="panel-head">
                  <h2>Weekly Parent Summary</h2>
                  <p className="muted">
                    {parentSummary.week_label} | Source: {parentSummary.source}
                  </p>
                </div>
                <div className="subject-grid">
                  <article className="card">
                    <h3>Summary</h3>
                    <p>{parentSummary.summary}</p>
                  </article>
                  <article className="card">
                    <h3>Recommendation</h3>
                    <p>{parentSummary.recommendation}</p>
                  </article>
                  <article className="card">
                    <h3>Strong Subjects</h3>
                    <p>{parentSummary.strong_subjects.length ? parentSummary.strong_subjects.join(", ") : "-"}</p>
                  </article>
                  <article className="card">
                    <h3>Attention Subjects</h3>
                    <p>
                      {parentSummary.attention_subjects.length ? parentSummary.attention_subjects.join(", ") : "No critical risks"}
                    </p>
                  </article>
                </div>
              </section>
            </>
          )}

          {role === "parent" && !loading && !parentSummary && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Parent Analytics</h2>
              </div>
              <p className="muted">No weekly summary data is available right now.</p>
            </section>
          )}

          {(role === "student" || role === "parent") && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Student-Parent Progress Wall</h2>
                <p className="muted">Shared social feed for collaborative support</p>
              </div>
              <div className="form-grid">
                <label className="full-width">
                  Post update
                  <textarea
                    value={socialPostText}
                    onChange={(e) => setSocialPostText(e.target.value)}
                    rows={2}
                    placeholder="Share progress update..."
                  />
                </label>
              </div>
              <div className="row">
                <button onClick={onCreateSocialPost}>Publish update</button>
              </div>

              {socialFeed.length === 0 && <p className="muted">No feed posts yet.</p>}
              {socialFeed.length > 0 && (
                <div className="lesson-list">
                  {socialFeed.map((post) => (
                    <article key={post.id} className="lesson-card">
                      <p>
                        <strong>{post.author_name}</strong> ({post.author_role})
                      </p>
                      <p>{post.content}</p>
                      <p className="muted">{formatDateValue(post.created_at)}</p>
                      <div className="form-grid">
                        <label className="full-width">
                          Comment
                          <input
                            value={socialCommentDrafts[post.id] || ""}
                            onChange={(e) =>
                              setSocialCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="Write a comment..."
                          />
                        </label>
                      </div>
                      <div className="row">
                        <button onClick={() => onCreateSocialComment(post.id)}>Add comment</button>
                      </div>
                      <ul className="note-list">
                        {(post.comments || []).map((comment) => (
                          <li key={comment.id}>
                            <strong>{comment.author_name}</strong> ({comment.author_role}): {comment.text}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {(role === "student" || role === "parent") && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Digital Portfolio</h2>
                <p className="muted">Verified achievements and evidence</p>
              </div>
              <div className="form-grid">
                <label>
                  Title
                  <input value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} />
                </label>
                <label className="full-width">
                  Description
                  <textarea
                    value={portfolioDescription}
                    onChange={(e) => setPortfolioDescription(e.target.value)}
                    rows={2}
                  />
                </label>
              </div>
              <div className="row">
                <button onClick={onCreatePortfolioItem}>Add portfolio item</button>
              </div>
              {portfolioItems.length === 0 && <p className="muted">No portfolio items yet.</p>}
              {portfolioItems.length > 0 && (
                <ul className="note-list">
                  {portfolioItems.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong> - {item.description} ({item.status})
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {(role === "student" || role === "parent") && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Gamification Leaderboard</h2>
                <p className="muted">Improvement-first ranking</p>
              </div>
              {leaderboard.length === 0 && <p className="muted">No leaderboard rows yet.</p>}
              {leaderboard.length > 0 && (
                <ul className="note-list">
                  {leaderboard.map((row, index) => (
                    <li key={row.student_id}>
                      #{index + 1} <strong>{row.student_name}</strong> ({row.class_id}) - {row.improvement_score} |{" "}
                      {row.badge}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {role === "teacher" && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Teacher Early Warning</h2>
                <p className="muted">At-risk students with explainable factors</p>
              </div>
              <div className="row">
                <label>
                  Class
                  <input value={teacherClassId} onChange={(e) => setTeacherClassId(e.target.value.toUpperCase())} />
                </label>
                <button onClick={onRefreshTeacherWarnings}>Refresh</button>
                <button onClick={onGenerateTeacherReport}>Generate Class Report</button>
              </div>
              {teacherReport && <p className="advice">{teacherReport}</p>}
              {teacherWarnings.length === 0 && <p className="muted">No risk rows yet.</p>}
              {teacherWarnings.length > 0 && (
                <div className="lesson-list">
                  {teacherWarnings.map((row) => (
                    <article key={row.student_id} className="lesson-card">
                      <p>
                        <strong>{row.student_name}</strong> ({row.class_id}) - Risk {row.risk_score} ({row.risk_level})
                      </p>
                      <p>Top subject: {row.top_subject} | Attendance: {formatPercent(row.attendance)}</p>
                      <p className="muted">{(row.reasons || []).join(" | ")}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {role === "admin" && (
            <>
              <section className="metric-grid fade-in delay-2">
                <article className="metric-card">
                  <p className="metric-label">Students</p>
                  <p className="metric-value">{adminMetrics?.total_students ?? 0}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Teachers</p>
                  <p className="metric-value">{adminMetrics?.total_teachers ?? 0}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">High Risk</p>
                  <p className="metric-value">{adminMetrics?.high_risk_students ?? 0}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Avg School Risk</p>
                  <p className="metric-value">{adminMetrics?.average_school_risk ?? 0}</p>
                </article>
              </section>

              <section className="panel fade-in delay-2">
                <div className="panel-head">
                  <h2>Announcement Center</h2>
                  <p className="muted">Targeted communication by role/class</p>
                </div>
                <div className="form-grid">
                  <label>
                    Title
                    <input value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
                  </label>
                  <label>
                    Priority
                    <select value={announcePriority} onChange={(e) => setAnnouncePriority(e.target.value)}>
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </label>
                  <label className="full-width">
                    Message
                    <textarea value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} rows={2} />
                  </label>
                  <label>
                    Target roles (comma)
                    <input value={announceRoles} onChange={(e) => setAnnounceRoles(e.target.value)} />
                  </label>
                  <label>
                    Target classes (comma)
                    <input value={announceClasses} onChange={(e) => setAnnounceClasses(e.target.value)} />
                  </label>
                </div>
                <div className="row">
                  <button onClick={onCreateAnnouncement}>Publish</button>
                </div>
                <ul className="note-list">
                  {announcementRows.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong> [{item.priority}] - {item.message}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel fade-in delay-2">
                <div className="panel-head">
                  <h2>Smart Schedule Engine</h2>
                  <p className="muted">Generate and track schedule changes</p>
                </div>
                <div className="row">
                  <button onClick={onGenerateSchedule}>Generate schedule</button>
                  <button className="ghost-btn" onClick={onResetDemoData}>
                    Reset demo data
                  </button>
                </div>
                {generatedSchedule && (
                  <p className="info">
                    Schedule {generatedSchedule.schedule_id}: {generatedSchedule.stats.total_entries} entries, unresolved{" "}
                    {generatedSchedule.stats.unresolved_count}.
                  </p>
                )}
                {resetSummary && <p className="info">{resetSummary}</p>}
                {dbStats && (
                  <p className="muted">
                    Seed DB: {dbStats.students} students, {dbStats.teachers} teachers, {dbStats.accounts} accounts.
                  </p>
                )}
                <ul className="note-list">
                  {scheduleChanges.slice(0, 8).map((change) => (
                    <li key={change.id}>
                      <strong>{change.event}</strong> | {formatDateValue(change.created_at)}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {role !== "student" && role !== "parent" && role !== "teacher" && role !== "admin" && (
            <section className="panel fade-in delay-2">
              <div className="panel-head">
                <h2>Daily Operations Snapshot</h2>
                <p className="muted">Current schedule view for {role}</p>
              </div>
              {roleScheduleList.length === 0 && <p className="muted">No schedule entries found.</p>}
              {roleScheduleList.length > 0 && (
                <div className="timeline-grid">
                  {roleScheduleList.map((item) => (
                    <article key={item.id} className="timeline-item">
                      <p className="timeline-time">{item.time}</p>
                      <p className="timeline-title">{item.title}</p>
                      {item.subtitle && <p className="timeline-subtitle">{item.subtitle}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {activeView === "substitution" && isAuthenticated && (
        <section className="panel fade-in delay-2">
          <div className="panel-head">
            <h2>Adaptive Substitution Engine</h2>
            <p className="muted">Human-in-the-loop replacement planning with score-based options</p>
          </div>
          <SubstitutionLab role={role} token={token} meProfile={meProfile} />
        </section>
      )}

      {activeView === "kiosk" && (
        <section className="panel fade-in delay-2 kiosk-mode">
          <div className="kiosk-toolbar">
            <div>
              <p className="kiosk-meta">
                {kioskData?.school_name || "Aqbobek Lyceum"} | Updated: {kioskGeneratedAt}
              </p>
              <h2>{kioskSlide.label}</h2>
            </div>
            <div className="kiosk-actions">
              <button onClick={prevKioskSlide}>Prev</button>
              <button onClick={nextKioskSlide}>Next</button>
              <button onClick={toggleKioskFullscreen}>{isKioskFullscreen ? "Exit fullscreen" : "Fullscreen"}</button>
            </div>
          </div>

          <div className="kiosk-progress">
            {KIOSK_SLIDES.map((slide, index) => (
              <span
                key={slide.key}
                className={`kiosk-progress-item ${index === kioskSlideIndex ? "kiosk-progress-item-active" : ""}`}
              >
                {slide.label}
              </span>
            ))}
          </div>

          {kioskLoading && <p>Loading kiosk feed...</p>}
          {kioskError && <p className="error">{kioskError}</p>}

          {!kioskLoading && kioskSlide.key === "announcements" && (
            <div className="kiosk-grid">
              {kioskAnnouncements.length === 0 && <p className="muted">No announcements right now.</p>}
              {kioskAnnouncements.map((item) => (
                <article key={item.id} className="kiosk-card">
                  <div className="kiosk-card-head">
                    <h3>{item.title}</h3>
                    <span className={kioskPriorityClass(item.priority)}>{item.priority}</span>
                  </div>
                  <p>{item.message}</p>
                  <p className="muted">Valid until: {item.valid_until || "-"}</p>
                </article>
              ))}
            </div>
          )}

          {!kioskLoading && kioskSlide.key === "top_students" && (
            <div className="kiosk-grid">
              {kioskTopStudents.length === 0 && <p className="muted">No leaderboard data yet.</p>}
              {kioskTopStudents.map((student, index) => (
                <article key={student.id} className="kiosk-card">
                  <div className="kiosk-rank">{index + 1}</div>
                  <h3>{student.name}</h3>
                  <p className="kiosk-main-number">{student.score}</p>
                  <p>
                    {student.class_id} | {student.achievement}
                  </p>
                </article>
              ))}
            </div>
          )}

          {!kioskLoading && kioskSlide.key === "replacements" && (
            <div className="kiosk-grid">
              {kioskReplacements.length === 0 && <p className="muted">No replacement entries at the moment.</p>}
              {kioskReplacements.map((item) => (
                <article key={item.id} className="kiosk-card">
                  <div className="kiosk-card-head">
                    <h3>
                      {item.day} {item.slot}
                    </h3>
                    <span className="status status-pending">{replacementTypeLabel(item.type)}</span>
                  </div>
                  <p>
                    <strong>{item.class_id}</strong> | {item.subject}
                  </p>
                  <p>{item.teacher_name ? `Teacher: ${item.teacher_name}` : "Teacher: n/a"}</p>
                  <p className="muted">{item.note}</p>
                </article>
              ))}
            </div>
          )}

          {!kioskLoading && kioskSlide.key === "events" && (
            <div className="kiosk-grid">
              {kioskEvents.length === 0 && <p className="muted">No school events scheduled.</p>}
              {kioskEvents.map((event) => (
                <article key={event.id} className="kiosk-card">
                  <h3>{event.title}</h3>
                  <p className="kiosk-main-number">{event.time}</p>
                  <p>{event.date}</p>
                  <p>
                    {event.location} | {event.audience}
                  </p>
                </article>
              ))}
            </div>
          )}

          <p className="muted kiosk-hint">Auto-rotate: 9s | Refresh feed: 45s | Keys: Left, Right and F</p>
        </section>
      )}
    </main>
  );
}

