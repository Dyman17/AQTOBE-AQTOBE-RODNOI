import { useEffect, useMemo, useState } from "react";
import {
  createAbsenceRequest,
  decideAbsenceRequest,
  getAbsenceRequest,
  getSubstitutionNotifications,
  getSubstitutionSchools,
  listAbsenceRequests,
} from "./api";

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"];

function optionLabel(option) {
  if (option.type === "substitute_teacher") {
    return `Substitute: ${option.teacher_name} (score ${option.score})`;
  }
  if (option.type === "reschedule") {
    return `Reschedule: ${option.new_day} ${option.new_slot} with ${option.teacher_name} (score ${option.score})`;
  }
  return `Self study task (score ${option.score})`;
}

function optionReasoning(option) {
  const parts = Array.isArray(option.reasoning) ? option.reasoning : [];
  return parts.join(" | ");
}

function statusClass(status) {
  if (status === "approved") return "status status-approved";
  if (status === "rejected") return "status status-rejected";
  return "status status-pending";
}

function lessonOptions(lesson) {
  return [lesson.recommended, ...(lesson.alternatives || [])];
}

function toLocal(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function SubstitutionLab({ role, token, meProfile }) {
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [teacherId, setTeacherId] = useState("t_phy_1");
  const [day, setDay] = useState("Monday");
  const [reason, setReason] = useState("");
  const [submittedBy, setSubmittedBy] = useState("t_phy_1");
  const [statusFilter, setStatusFilter] = useState("all");

  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  const [approverRole, setApproverRole] = useState("admin");
  const [approverId, setApproverId] = useState(meProfile?.user_id || "admin_1");
  const [decisionComment, setDecisionComment] = useState("");

  const [adminNotifications, setAdminNotifications] = useState([]);
  const [teacherNotifications, setTeacherNotifications] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isPending = useMemo(() => selectedRequest?.status === "pending", [selectedRequest]);
  const canReview = role === "admin";

  useEffect(() => {
    if (role === "admin") {
      setApproverRole("admin");
      setApproverId(meProfile?.user_id || "admin_1");
    }
  }, [role, meProfile?.user_id]);

  async function loadNotifications(activeSchoolId = schoolId) {
    if (!activeSchoolId) return;
    try {
      const [adminRows, teacherRows] = await Promise.all([
        getSubstitutionNotifications({ schoolId: activeSchoolId, targetRole: "admin" }),
        getSubstitutionNotifications({
          schoolId: activeSchoolId,
          targetRole: "teacher",
          targetUserId: teacherId || undefined,
        }),
      ]);
      setAdminNotifications(adminRows);
      setTeacherNotifications(teacherRows);
    } catch (err) {
      setError(err.message || "Cannot load notifications");
    }
  }

  async function loadRequestDetail(requestId) {
    if (!requestId) {
      setSelectedRequestId("");
      setSelectedRequest(null);
      setSelectedOptions({});
      return;
    }

    const detail = await getAbsenceRequest(requestId);
    setSelectedRequestId(requestId);
    setSelectedRequest(detail);

    const defaults = {};
    for (const lesson of detail.proposal.lessons) {
      defaults[lesson.lesson_id] = lesson.recommended.option_id;
    }
    if (detail.approved_plan?.lessons) {
      for (const lesson of detail.approved_plan.lessons) {
        defaults[lesson.lesson_id] = lesson.chosen.option_id;
      }
    }
    setSelectedOptions(defaults);
  }

  async function loadRequests(preferredRequestId = "") {
    if (!schoolId) return;
    setLoadingBoard(true);
    setError("");
    try {
      const rows = await listAbsenceRequests({ schoolId, status: statusFilter });
      setRequests(rows);

      let nextId = preferredRequestId || selectedRequestId;
      if (!nextId && rows.length > 0) {
        nextId = rows[0].request_id;
      }
      if (!rows.some((row) => row.request_id === nextId)) {
        nextId = rows.length > 0 ? rows[0].request_id : "";
      }
      await loadRequestDetail(nextId);
    } catch (err) {
      setError(err.message || "Cannot load requests");
    } finally {
      setLoadingBoard(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      setLoadingBoard(true);
      setError("");
      try {
        const rows = await getSubstitutionSchools();
        setSchools(rows);
        if (rows.length > 0) {
          setSchoolId(rows[0].id);
        }
      } catch (err) {
        setError(err.message || "Cannot load schools");
      } finally {
        setLoadingBoard(false);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    loadRequests();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, statusFilter]);

  useEffect(() => {
    if (!schoolId) return;
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  async function onCreateRequest() {
    if (!schoolId) {
      setError("Select school first");
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      const created = await createAbsenceRequest({
        school_id: schoolId,
        teacher_id: teacherId,
        day,
        reason,
        submitted_by: submittedBy,
      });
      setInfo(`Request created: ${created.request_id}`);
      setReason("");
      await loadRequests(created.request_id);
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Cannot create request");
    } finally {
      setBusy(false);
    }
  }

  async function onMakeDecision(decision) {
    if (!selectedRequestId || !selectedRequest) return;
    if (!canReview) {
      setError("Only admin can approve or reject requests");
      return;
    }
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const updated = await decideAbsenceRequest(
        selectedRequestId,
        {
          decision,
          approver_id: approverId,
          approver_role: approverRole,
          comment: decisionComment,
          selected_options: selectedOptions,
        },
        token,
      );
      setInfo(`Request ${decision}d by ${approverRole}`);
      setSelectedRequest(updated);
      setDecisionComment("");
      await loadRequests(selectedRequestId);
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Cannot process decision");
    } finally {
      setBusy(false);
    }
  }

  function updateLessonOption(lessonId, optionId) {
    setSelectedOptions((prev) => ({ ...prev, [lessonId]: optionId }));
  }

  return (
    <div className="substitution">
      <p className="muted">
        Operator panel: create absence request, review scored options, approve/reject, and track notifications.
      </p>

      {loadingBoard && <p>Loading substitution data...</p>}
      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <div className="sub-grid">
        <article className="panel">
          <h3>1. Create absence request</h3>
          <div className="form-grid">
            <label>
              School
              <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} disabled={busy}>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Teacher ID
              <input value={teacherId} onChange={(e) => setTeacherId(e.target.value)} disabled={busy} />
            </label>

            <label>
              Day
              <select value={day} onChange={(e) => setDay(e.target.value)} disabled={busy}>
                {DAY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Submitted by
              <input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} disabled={busy} />
            </label>

            <label className="full-width">
              Reason
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} disabled={busy} />
            </label>
          </div>
          <button onClick={onCreateRequest} disabled={busy || !schoolId}>
            Create request
          </button>
        </article>

        <article className="panel">
          <h3>2. Request queue</h3>
          <div className="row">
            <label>
              Filter
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={busy}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => loadRequests()} disabled={busy || !schoolId}>
              Refresh
            </button>
          </div>

          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          {requests.length > 0 && (
            <ul className="request-list">
              {requests.map((request) => (
                <li key={request.request_id}>
                  <button
                    className={`request-btn ${selectedRequestId === request.request_id ? "request-btn-active" : ""}`}
                    onClick={() => loadRequestDetail(request.request_id)}
                    disabled={busy}
                  >
                    <span>{request.teacher_name}</span>
                    <span>{request.day}</span>
                    <span className={statusClass(request.status)}>{request.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="panel">
        <h3>3. Proposal details and decision</h3>
        {!selectedRequest && <p className="muted">Select request from queue.</p>}

        {selectedRequest && (
          <>
            <p>
              Request: <code>{selectedRequest.request_id}</code>
            </p>
            <p>
              Teacher: {selectedRequest.teacher_name} | Day: {selectedRequest.day} | Status:{" "}
              <span className={statusClass(selectedRequest.status)}>{selectedRequest.status}</span>
            </p>
            <p>
              Submitted by: {selectedRequest.submitted_by} at {toLocal(selectedRequest.submitted_at)}
            </p>
            <p>
              Summary: {selectedRequest.proposal.summary.total_lessons} lesson(s), recommended substitutions{" "}
              {selectedRequest.proposal.summary.recommended_substitutions}, reschedules{" "}
              {selectedRequest.proposal.summary.recommended_reschedules}, self study{" "}
              {selectedRequest.proposal.summary.recommended_self_study}
            </p>

            <div className="lesson-list">
              {selectedRequest.proposal.lessons.map((lesson) => {
                const options = lessonOptions(lesson);
                const value = selectedOptions[lesson.lesson_id] || lesson.recommended.option_id;
                const activeOption = options.find((option) => option.option_id === value) || lesson.recommended;
                return (
                  <div key={lesson.lesson_id} className="lesson-card">
                    <p>
                      <strong>
                        {lesson.subject} {lesson.class_id}
                      </strong>{" "}
                      at {lesson.day} {lesson.slot}
                    </p>
                    <p className="muted">Recommended: {optionLabel(lesson.recommended)}</p>
                    <label>
                      Option
                      <select
                        value={value}
                        onChange={(e) => updateLessonOption(lesson.lesson_id, e.target.value)}
                        disabled={!isPending || busy}
                      >
                        {options.map((option) => (
                          <option key={option.option_id} value={option.option_id}>
                            {optionLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="muted">{optionReasoning(activeOption)}</p>
                  </div>
                );
              })}
            </div>

            {isPending && canReview && (
              <div className="decision-box">
                <h4>Decision (admin)</h4>
                <div className="form-grid">
                  <label>
                    Approver role
                    <input value={approverRole} disabled />
                  </label>
                  <label>
                    Approver ID
                    <input value={approverId} disabled />
                  </label>
                  <label className="full-width">
                    Comment
                    <textarea
                      value={decisionComment}
                      onChange={(e) => setDecisionComment(e.target.value)}
                      rows={2}
                      disabled={busy}
                    />
                  </label>
                </div>
                <div className="row">
                  <button onClick={() => onMakeDecision("approve")} disabled={busy}>
                    Approve
                  </button>
                  <button onClick={() => onMakeDecision("reject")} disabled={busy}>
                    Reject
                  </button>
                </div>
              </div>
            )}

            {isPending && !canReview && (
              <p className="muted">Only admin role can approve/reject substitution requests.</p>
            )}

            {selectedRequest.status === "approved" && selectedRequest.approved_plan && (
              <p className="info">
                Final plan: substitutions {selectedRequest.approved_plan.summary.substitutions}, reschedules{" "}
                {selectedRequest.approved_plan.summary.reschedules}, self study{" "}
                {selectedRequest.approved_plan.summary.self_study}.
              </p>
            )}
          </>
        )}
      </article>

      <div className="sub-grid">
        <article className="panel">
          <h3>4. Admin notifications</h3>
          <button onClick={() => loadNotifications()} disabled={busy || !schoolId}>
            Refresh notifications
          </button>
          <ul className="note-list">
            {adminNotifications.slice(0, 10).map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <div className="muted">{item.message}</div>
                <div className="muted">{toLocal(item.created_at)}</div>
              </li>
            ))}
            {adminNotifications.length === 0 && <li className="muted">No admin notifications</li>}
          </ul>
        </article>

        <article className="panel">
          <h3>5. Teacher notifications (by Teacher ID filter)</h3>
          <p className="muted">Current Teacher ID filter: {teacherId || "-"}</p>
          <ul className="note-list">
            {teacherNotifications.slice(0, 10).map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <div className="muted">{item.message}</div>
                <div className="muted">{toLocal(item.created_at)}</div>
              </li>
            ))}
            {teacherNotifications.length === 0 && <li className="muted">No teacher notifications</li>}
          </ul>
        </article>
      </div>
    </div>
  );
}
