import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { calculateGrade } from "@/lib/grading";
import { fetchAllPages, useExamMarks, useStudents } from "@/lib/hooks";

interface Submission {
  id: number;
  exam: number;
  subject: number;
  school_class: number;
  exam_name: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  note: string;
  submitted_at: string;
}

const MarkSubmissionsSection = () => {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["mark-submissions"],
    queryFn: () => fetchAllPages<Submission>("/exams/mark-submissions/"),
    refetchInterval: 30000,
  });
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const selectedSubmission = data.find((submission) => submission.id === selectedSubmissionId);
  const { data: students = [], isLoading: loadingStudents, error: studentsError } = useStudents();
  const { data: allMarks = [], isLoading: loadingMarks, error: marksError } = useExamMarks({
    exam: selectedSubmission?.exam,
    subject: selectedSubmission?.subject,
  });
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const classStudents = selectedSubmission
    ? students
      .filter((student) => student.school_class === selectedSubmission.school_class)
      .sort((first, second) => first.name.localeCompare(second.name))
    : [];
  const marksByStudent = new Map(allMarks
    .filter((mark) => studentsById.get(mark.student)?.school_class === selectedSubmission?.school_class)
    .map((mark) => [mark.student, mark]));

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h2 className="font-heading text-lg font-bold text-foreground">Submitted Mark Sheets</h2>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : error ? (
        <p role="alert" className="text-sm text-destructive">Could not load teacher submissions: {getErrorMessage(error)}</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No teacher has submitted marks yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50"><tr>
              <th className="px-3 py-2 text-left">Teacher</th><th className="px-3 py-2 text-left">Class</th>
              <th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left">Exam</th>
              <th className="px-3 py-2 text-left">Details</th><th className="px-3 py-2 text-left">Submitted</th><th className="px-3 py-2 text-left">Review</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {data.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{s.teacher_name}</td><td className="px-3 py-2">{s.class_name}</td>
                  <td className="px-3 py-2">{s.subject_name}</td><td className="px-3 py-2">{s.exam_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.note}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</td>
                  <td className="px-3 py-2"><Button size="sm" variant="outline" onClick={() => setSelectedSubmissionId(s.id)}>View marks</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedSubmission && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <h3 className="font-semibold text-foreground">{selectedSubmission.class_name} · {selectedSubmission.subject_name}</h3>
            <p className="text-sm text-muted-foreground">{selectedSubmission.exam_name} · Submitted by {selectedSubmission.teacher_name}</p>
          </div>
          {loadingMarks || loadingStudents ? <p className="text-sm text-muted-foreground">Loading submitted marks…</p> : marksError || studentsError ? (
            <p role="alert" className="text-sm text-destructive">Could not load submitted marks: {getErrorMessage(marksError || studentsError)}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50"><tr>
                  <th className="px-3 py-2 text-left">Learner</th><th className="px-3 py-2 text-right">Score</th>
                  <th className="px-3 py-2 text-right">Out of</th><th className="px-3 py-2 text-right">Grade</th>
                  <th className="px-3 py-2 text-left">Comment</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {classStudents.map((student) => {
                    const mark = marksByStudent.get(student.id);
                    const percentage = mark && mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : null;
                    return (
                      <tr key={student.id}>
                        <td className="px-3 py-2 font-medium">{student.name}</td>
                        <td className="px-3 py-2 text-right">{mark?.scored ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{mark?.total_marks ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{percentage === null ? "—" : calculateGrade(percentage).grade}</td>
                        <td className="px-3 py-2 text-muted-foreground">{mark?.comment || "—"}</td>
                      </tr>
                    );
                  })}
                  {classStudents.length === 0 && <tr><td className="px-3 py-4 text-center text-muted-foreground" colSpan={5}>No learners are enrolled in this class.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default MarkSubmissionsSection;
