import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Submission {
  id: number;
  exam_name: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  note: string;
  submitted_at: string;
}

const MarkSubmissionsSection = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["mark-submissions"],
    queryFn: async () => {
      const res = await api.get<unknown>("/exams/mark-submissions/");
      const r = res as { results?: Submission[] } | Submission[];
      return Array.isArray(r) ? r : r.results ?? [];
    },
  });
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h2 className="font-heading text-lg font-bold text-foreground">Submitted Mark Sheets</h2>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : data.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No teacher has submitted marks yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50"><tr>
              <th className="px-3 py-2 text-left">Teacher</th><th className="px-3 py-2 text-left">Class</th>
              <th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left">Exam</th>
              <th className="px-3 py-2 text-left">Details</th><th className="px-3 py-2 text-left">Submitted</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {data.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{s.teacher_name}</td><td className="px-3 py-2">{s.class_name}</td>
                  <td className="px-3 py-2">{s.subject_name}</td><td className="px-3 py-2">{s.exam_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.note}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarkSubmissionsSection;
