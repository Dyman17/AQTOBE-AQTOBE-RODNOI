const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function parseErrorMessage(rawText, fallbackStatus) {
  if (!rawText) return `API error: ${fallbackStatus}`;
  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed === "string") return parsed;
    if (parsed?.detail && typeof parsed.detail === "string") return parsed.detail;
    return rawText;
  } catch {
    return rawText;
  }
}

async function request(path, options = {}) {
  const token = options.token;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const requestId = response.headers.get("X-Request-ID");
    const message = parseErrorMessage(errorText, response.status);
    throw new Error(requestId ? `${message} (request: ${requestId})` : message);
  }

  return response.json();
}

export function login(role) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export function authLogin(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerStudent(payload) {
  return request("/auth/register-student", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerParent(payload) {
  return request("/auth/register-parent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(token) {
  return request("/me", { token });
}

export function getHealth() {
  return request("/healthz");
}

export function getGrades(token) {
  return request("/grades", { token });
}

export function getSchedule(role) {
  const params = new URLSearchParams({ role });
  return request(`/schedule?${params.toString()}`);
}

export function getTimetable(filters = {}) {
  const params = new URLSearchParams();
  if (filters.day) params.set("day", filters.day);
  if (filters.classId) params.set("class_id", filters.classId);
  if (filters.teacher) params.set("teacher", filters.teacher);
  const query = params.toString();
  return request(`/timetable${query ? `?${query}` : ""}`);
}

export function getDbStats() {
  return request("/db/stats");
}

export function getGamificationLeaderboard(limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/gamification/leaderboard?${params.toString()}`);
}

export function getKioskData(schoolId = "aqbobek") {
  const params = new URLSearchParams({ school_id: schoolId });
  return request(`/kiosk?${params.toString()}`);
}

export function getRisk(payload) {
  return request("/risk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAiAdvice(payload) {
  return request("/ai-advice", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getParentWeeklySummary(token) {
  return request("/parent/weekly-summary", { token });
}

export function getTeacherEarlyWarning({ classId, limit = 25 }) {
  const params = new URLSearchParams();
  if (classId) params.set("class_id", classId);
  if (limit) params.set("limit", String(limit));
  return request(`/teacher/early-warning?${params.toString()}`);
}

export function getTeacherClassReport(payload) {
  return request("/teacher/class-report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminMetrics() {
  return request("/admin/metrics");
}

export function resetDemoData(token) {
  return request("/admin/reset-demo-data", {
    method: "POST",
    token,
  });
}

export function listAnnouncements({ role, classId } = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (classId) params.set("class_id", classId);
  const query = params.toString();
  return request(`/announcements${query ? `?${query}` : ""}`);
}

export function createAnnouncement(payload, token) {
  return request("/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function generateSmartSchedule(token, payload) {
  return request("/schedule/generate", {
    method: "POST",
    body: JSON.stringify(payload || {}),
    token,
  });
}

export function validateSmartSchedule(token, entries) {
  return request("/schedule/validate", {
    method: "POST",
    body: JSON.stringify({ entries }),
    token,
  });
}

export function getScheduleChanges(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/schedule/changes?${params.toString()}`);
}

export function getSocialFeed(token, studentId = "") {
  const params = new URLSearchParams();
  if (studentId) params.set("student_id", studentId);
  const query = params.toString();
  return request(`/social/feed${query ? `?${query}` : ""}`, { token });
}

export function createSocialPost(token, payload) {
  return request("/social/feed", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function createSocialComment(token, postId, payload) {
  return request(`/social/feed/${postId}/comment`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function listPortfolio(token, studentId = "") {
  const params = new URLSearchParams();
  if (studentId) params.set("student_id", studentId);
  const query = params.toString();
  return request(`/portfolio/items${query ? `?${query}` : ""}`, { token });
}

export function createPortfolioItem(token, payload) {
  return request("/portfolio/items", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function verifyPortfolioItem(itemId) {
  return request(`/portfolio/verify/${itemId}`, {
    method: "POST",
  });
}

export function getSubstitutionSchools() {
  return request("/substitution/schools");
}

export function createAbsenceRequest(payload) {
  return request("/substitution/absence-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listAbsenceRequests({ schoolId, status }) {
  const params = new URLSearchParams({ school_id: schoolId });
  if (status && status !== "all") {
    params.set("status", status);
  }
  return request(`/substitution/absence-requests?${params.toString()}`);
}

export function getAbsenceRequest(requestId) {
  return request(`/substitution/absence-requests/${requestId}`);
}

export function decideAbsenceRequest(requestId, payload, token) {
  return request(`/substitution/absence-requests/${requestId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function getSubstitutionNotifications({ schoolId, targetRole, targetUserId }) {
  const params = new URLSearchParams({ school_id: schoolId });
  if (targetRole) {
    params.set("target_role", targetRole);
  }
  if (targetUserId) {
    params.set("target_user_id", targetUserId);
  }
  return request(`/substitution/notifications?${params.toString()}`);
}
