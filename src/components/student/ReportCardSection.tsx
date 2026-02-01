import { useState, useRef } from "react";
import { Download, Printer, QrCode, Calendar, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/wenyasha-logo.jpg";
import { calculateGrade, getGradeColorClasses, GRADING_SCALE } from "@/lib/grading";
import { exportReportCardPdf } from "@/lib/pdfExport";

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

// Mock data - will be populated from teacher marks entry
const mockReportCard: ReportCardData = {
  studentName: "John Moyo",
  grade: "Form 4",
  class: "Form 4A",
  exam: "End of Term 1 2024",
  position: 5,
  totalStudents: 45,
  passed: 6,
  totalSubjects: 7,
  date: "2024-03-15",
  results: [
    { subject: "Family And Religious Studies", marks: 100, scored: 86 },
    { subject: "Food Technology And Design", marks: 100, scored: 56 },
    { subject: "Shona", marks: 100, scored: 29 },
    { subject: "English Language", marks: 100, scored: 66 },
    { subject: "Mathematics", marks: 100, scored: 54 },
    { subject: "Combined Science", marks: 100, scored: 68 },
    { subject: "ICT", marks: 100, scored: 58 },
  ],
  teacherComment: "John has shown great improvement this term. Keep up the good work!",
  headComment: "A commendable performance. Continue striving for excellence.",
  attendance: {
    totalDays: 65,
    present: 62,
    absent: 3,
    behavior: "Good"
  }
};

const ReportCardSection = () => {
  const [selectedTerm, setSelectedTerm] = useState("Term 1 2024");
  const [isExporting, setIsExporting] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const reportCard = mockReportCard;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportReportCardPdf("report-card-content", reportCard.studentName);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateAverage = () => {
    const total = reportCard.results.reduce((sum, r) => sum + r.scored, 0);
    return (total / reportCard.results.length).toFixed(2);
  };

  const countPassed = () => {
    return reportCard.results.filter(r => {
      const percentage = (r.scored / r.marks) * 100;
      return percentage >= 40;
    }).length;
  };

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
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="gold" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Card Document */}
      <div className="bg-card rounded-xl border border-border overflow-hidden print:border-none">
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
              <p className="text-sm"><span className="font-semibold text-foreground">{reportCard.studentName}</span></p>
              <p className="text-sm text-muted-foreground">Grade: {reportCard.grade}, {reportCard.class}</p>
              <p className="text-sm text-muted-foreground">Exam: {reportCard.exam}</p>
              <p className="text-sm text-muted-foreground">Position In Class: {reportCard.position} out of {reportCard.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Passed: {countPassed()} out of {reportCard.results.length}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date: {new Date(reportCard.date).toLocaleDateString()}
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
              <p className="font-semibold text-foreground">Wenyasha International School</p>
              <p className="text-sm text-muted-foreground">Phone: +263 242 123456</p>
              <p className="text-sm text-muted-foreground">Email: info@wenyasha.ac.zw</p>
              <p className="text-sm text-muted-foreground">P.O. Box 1234</p>
              <p className="text-sm text-muted-foreground">Harare, Zimbabwe</p>
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
              {reportCard.results.map((result, idx) => {
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

        {/* Overall Behavior Section */}
        <div className="p-6 border-t border-border">
          <div className="bg-[hsl(220,25%,18%)] text-white px-4 py-2 rounded-t-lg">
            <h3 className="font-semibold text-sm">Overall Behavior</h3>
          </div>
          <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Total days:</p>
                <p className="font-medium text-foreground">{reportCard.attendance.totalDays}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Behavior:</p>
                <p className="font-medium text-foreground">{reportCard.attendance.behavior}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Presents:</p>
                <p className="font-medium text-green-600">{reportCard.attendance.present}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Absent:</p>
                <p className="font-medium text-red-600">{reportCard.attendance.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-6 border-t border-border space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Teacher Comment:</label>
            <div className="p-3 rounded-lg border border-border bg-secondary/20 min-h-[60px]">
              <p className="text-sm text-muted-foreground italic">{reportCard.teacherComment || "No comment provided"}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Head Comment:</label>
            <div className="p-3 rounded-lg border border-border bg-secondary/20 min-h-[60px]">
              <p className="text-sm text-muted-foreground italic">{reportCard.headComment || "No comment provided"}</p>
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
