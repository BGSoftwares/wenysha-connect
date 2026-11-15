import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

const contents = [
  { file: "students.csv", text: "Learners in your classes: ID, name, class, gender and status" },
  { file: "marks.csv", text: "Marks for the classes and subjects you teach" },
  { file: "attendance.csv", text: "Attendance records for your classes" },
  { file: "my_classes_and_subjects.csv", text: "Your subject and class allocations" },
];

const TeacherBackupSection = () => {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      await downloadAuthenticatedFile("/auth/backups/my-data/", `my-teaching-data-${stamp}.zip`);
      toast.success("Backup downloaded");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground">Back up my data</h2>
        <p className="text-sm text-muted-foreground">Download a copy of your classes, marks and attendance to keep on your own device.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">What you get</h3>
            <p className="mb-3 text-sm text-muted-foreground">One ZIP file. Open the spreadsheets in Excel or Google Sheets.</p>
            <ul className="space-y-2">
              {contents.map((c) => (
                <li key={c.file} className="flex items-start gap-2 text-sm text-foreground">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span><span className="font-medium">{c.file}</span>: {c.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button variant="gold" onClick={() => void download()} disabled={busy} className="shrink-0">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing…</> : <><Download className="mr-2 h-4 w-4" />Download my backup</>}
          </Button>
        </div>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          The file lists learners' names and results, so store it privately and delete it from shared computers. Addresses, birth dates,
          contact details and fees are not included. The school keeps its own full backups.
        </span>
      </p>
    </div>
  );
};

export default TeacherBackupSection;
