import { aqbobekApi } from "@/shared/api/aqbobek-service";
import type { AdvicePayload, GradesPayload, RiskPayload } from "@/shared/types/domain";

export type SubjectInsight = {
  subject: GradesPayload["subjects"][number];
  risk: RiskPayload;
  advice: AdvicePayload;
};

export type StudentInsightsPayload = {
  grades: GradesPayload;
  insights: SubjectInsight[];
  averageRisk: number;
  averageAttendance: number;
};

export async function loadStudentInsights(): Promise<StudentInsightsPayload> {
  const grades = await aqbobekApi.student.getGrades();
  const insights = await Promise.all(
    grades.subjects.map(async (subject) => {
      const risk = await aqbobekApi.student.getRisk({
        subject: subject.name,
        grades: subject.grades,
        attendance: subject.attendance,
      });
      const advice = await aqbobekApi.student.getAdvice({
        subject: subject.name,
        grades: subject.grades,
        attendance: subject.attendance,
        risk: risk.risk,
      });
      return { subject, risk, advice };
    }),
  );

  const averageRisk = Math.round(insights.reduce((sum, item) => sum + item.risk.risk, 0) / Math.max(insights.length, 1));
  const averageAttendance = insights.reduce((sum, item) => sum + item.subject.attendance, 0) / Math.max(insights.length, 1);

  return { grades, insights, averageRisk, averageAttendance };
}
