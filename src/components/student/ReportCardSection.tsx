import { useState, useRef } from "react";
import { Download, Printer, QrCode, Calendar, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";
import { calculateGrade, getGradeColorClasses, GRADING_SCALE } from "@/lib/grading";
import { exportReportCardPdf } from "@/lib/pdfExport";
import { useExamMarks, useStudentProfile } from "@/lib/hooks";
import { getPrincipalComment, getTeacherComment } from "@/lib/reportComments";

interface SubjectResult {
  subject: string;
  marks: number;
  scored: number;
}

interface ReportCardData {
  studentName: string;
  grade: string;
  class: string;
  exam: string;
  position: number;
  totalStudents: number;
  passed: number;
  totalSubjects: number;
  date: string;
  results: SubjectResult[];
  teacherComment: string;
  headComment: string;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    behavior: string;
  };
}

export interface ReportCardSectionProps {
  studentId: number;
}

const ReportCardSection = ({ studentId }: ReportCardSectionProps) => {
  const [selectedTerm, setSelectedTerm] = useState("Term 1 2024");
  const [isExporting, setIsExporting] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useStudentProfile();
  const { data: marks = [], isLoading } = useExamMarks({ student: studentId });

  const results: SubjectResult[] = marks.map(m => ({
    subject: m.subject_name,
    marks: m.total_marks,
    scored: Number(m.scored)
  }));

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportReportCardPdf("report-card-content", profile?.name || "Student");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateAverage = () => {
    if (results.length === 0) return "0.00";
    const total = results.reduce((sum, r) => sum + r.scored, 0);
    return (total / results.length).toFixed(2);
  };

  const countPassed = () => {
    return results.filter(r => {
      const percentage = (r.scored / r.marks) * 100;
      return percentage >= 40;
    }).length;
  };

  const averagePercentage = results.length
    ? results.reduce((sum, r) => sum + ((r.scored / r.marks) * 100), 0) / results.length
    : 0;

  const teacherComment = getTeacherComment(averagePercentage);
  const principalComment = getPrincipalComment(averagePercentage);
  const attendance = {
    totalDays: 65,
    present: 62,
    absent: 3,
    behavior: "Good",
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating report card...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Report Card</h2>
          <p className="text-muted-foreground text-sm">View your academic performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
          >
            <option>Term 1 2024</option>
            <option>Term 3 2023</option>
            <option>Term 2 2023</option>
          </select>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="gold" size="sm" onClick={handleDownloadPdf} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Report Card Document */}
      <div id="report-card-content" ref={reportCardRef} className="bg-card rounded-xl border border-border overflow-hidden print:border-none">
        {/* Report Card Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-border">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground tracking-wide">
              STUDENT ONLINE REPORT CARD
            </h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Student Info */}
            <div className="space-y-2">
              <p className="text-sm"><span className="font-semibold text-foreground">{profile?.name}</span></p>
              <p className="text-sm text-muted-foreground">Grade: {profile?.class_name}</p>
              <p className="text-sm text-muted-foreground">Exam: {selectedTerm} Final</p>
              <p className="text-sm text-muted-foreground">Passed: {countPassed()} out of {results.length}</p>
              <p className="text-sm text-muted-foreground">Attendance: {attendance.present}/{attendance.totalDays} days present</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* School Logo */}
            <div className="flex justify-center">
              <div className="text-center">
                <img src={logo} alt="School Logo" className="h-24 w-24 mx-auto rounded-lg object-contain border border-border bg-white p-2" />
              </div>
            </div>

            {/* School Info */}
            <div className="text-right space-y-1">
              <p className="font-semibold text-foreground">Able God College</p>
              <p className="text-sm text-muted-foreground">Phone: {schoolContact.phones.map((phone) => phone.label).join(" / ")}</p>
              <p className="text-sm text-muted-foreground">{schoolContact.address}</p>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(220,25%,18%)] text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">SUBJECT</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">MARKS</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">SCORED</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">PERC(%)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">GRADE</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">COMMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((result, idx) => {
                const percentage = (result.scored / result.marks) * 100;
                const gradeInfo = calculateGrade(percentage);
                return (
                  <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{result.subject}</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">{result.marks}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-foreground">{result.scored.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">{percentage.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{gradeInfo.meaning}</td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No records found for this term.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-secondary/50">
              {(() => {
                const avg = parseFloat(calculateAverage());
                const avgGrade = calculateGrade(avg);
                return (
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">Average</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">-</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-foreground">{calculateAverage()}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-foreground">{calculateAverage()}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${avgGrade.bgColor} ${avgGrade.color}`}>
                        {avgGrade.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {avgGrade.meaning}
                    </td>
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        </div>

        {/* Comments Section */}
        <div className="p-6 border-t border-border space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Teacher Comment:</label>
            <div className="p-3 rounded-lg border border-border bg-secondary/20 min-h-[60px]">
              <p className="text-sm text-foreground italic">{teacherComment}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Principal&apos;s Overall Comment:</label>
            <div className="p-3 rounded-lg border border-border bg-primary/5 min-h-[60px]">
              <p className="text-sm text-foreground italic">{principalComment}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 rounded-lg border border-border bg-secondary/10 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
              <p className="mt-1 font-semibold text-foreground">{attendance.present} / {attendance.totalDays} days</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Absent</p>
              <p className="mt-1 font-semibold text-foreground">{attendance.absent} days</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Behaviour</p>
              <p className="mt-1 font-semibold text-foreground">{attendance.behavior}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              This report is electronically generated, follow the link to verify the report.
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <QrCode className="h-16 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardSection;
