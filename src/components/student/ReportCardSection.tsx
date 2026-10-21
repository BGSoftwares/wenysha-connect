import { useState, useRef } from "react";
import { Download, Printer, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";
import { calculateGrade } from "@/lib/grading";
import { exportReportCardPdf } from "@/lib/pdfExport";
import { useAttendanceRecords, useExamMarks, useExamRanking, useExams, useStudentFees, useStudentProfile } from "@/lib/hooks";
import { getPrincipalComment, getTeacherComment } from "@/lib/reportComments";

interface SubjectResult {
  subject: string;
  marks: number;
  scored: number;
}

export interface ReportCardSectionProps {
  studentId: number;
}

const getPercentage = ({ marks, scored }: SubjectResult) =>
  marks > 0 ? (scored / marks) * 100 : 0;

const formatPosition = (position: number | null | undefined, total: number | null | undefined) => {
  if (position == null || total == null) return "Not available";
  const suffix = position % 100 >= 11 && position % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[position % 10] || "th");
  return `${position}${suffix} of ${total}`;
};

const ReportCardSection = ({ studentId }: ReportCardSectionProps) => {
  const [reportCategory, setReportCategory] = useState<"current" | "past">("current");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useStudentProfile();
  const { data: fees = [] } = useStudentFees({ student: studentId });
  const { data: allMarks = [], isLoading: isLoadingMarks } = useExamMarks({ student: studentId });
  const { data: attendanceRecords = [] } = useAttendanceRecords({ student: studentId });
  const { data: exams = [], isLoading: isLoadingExams } = useExams();
  const availableExams = exams
    .filter(exam => exam.status === "completed" && allMarks.some(mark => mark.exam === exam.id))
    .sort((first, second) => second.start_date.localeCompare(first.start_date));
  const currentPeriod = availableExams[0]
    ? `${availableExams[0].year.trim()}-${availableExams[0].term.trim().toLowerCase()}`
    : null;
  const visibleExams = availableExams.filter(exam => {
    const isCurrent = `${exam.year.trim()}-${exam.term.trim().toLowerCase()}` === currentPeriod;
    return reportCategory === "current" ? isCurrent : !isCurrent;
  });
  const selectedExam = visibleExams.find(exam => exam.id === selectedExamId) || visibleExams[0];
  const selectedTerm = selectedExam
    ? `${selectedExam.name} · ${selectedExam.term} ${selectedExam.year}`
    : "No examination selected";
  const marks = allMarks.filter(mark => mark.exam === selectedExam?.id);
  const { data: ranking, isLoading: isLoadingRanking, isError: isRankingError } =
    useExamRanking(selectedExam?.id, studentId);

  const results: SubjectResult[] = marks.map(m => ({
    subject: m.subject_name,
    marks: m.total_marks,
    scored: Number(m.scored)
  })).sort((first, second) => first.subject.localeCompare(second.subject));

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      if (!selectedExam) return;
      await exportReportCardPdf({
        studentName: profile?.name || "Student",
        studentId: profile?.student_id || "",
        className: profile?.class_name || "—",
        examName: selectedExam.name,
        termLabel: `${selectedExam.term} ${selectedExam.year}`,
        issuedDate: new Date().toLocaleDateString("en-GB"),
        average: averagePercentage,
        overallGrade: calculateGrade(averagePercentage).grade,
        passed: countPassed(),
        totalSubjects: results.length,
        classPosition: formatPosition(ranking?.class_position, ranking?.class_total),
        levelPosition: formatPosition(ranking?.level_position, ranking?.level_total),
        teacherComment,
        principalComment,
        attendance: {
          totalDays: attendanceRecords.length,
          present: attendanceRecords.filter(record => record.status.toLowerCase() === "present").length,
          absent: attendanceRecords.filter(record => record.status.toLowerCase() === "absent").length,
        },
        results: results.map(result => ({
          ...result,
          percentage: getPercentage(result),
          grade: calculateGrade(getPercentage(result)).grade,
        })),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add("printing-report-card");
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("printing-report-card");
    }, { once: true });
    window.print();
  };

  const handleShareWhatsApp = () => {
    const message = `Hello, your report card for ${profile?.name || "student"} is ready. Please log in to the school portal to download the PDF report card.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const countPassed = () => {
    return results.filter(result => getPercentage(result) >= 40).length;
  };

  const outstandingBalance = fees.reduce((sum, fee) => sum + (Number(fee.amount_due) - Number(fee.amount_paid)), 0);
  const resultsBlocked = outstandingBalance > 0;

  const averagePercentage = results.length
    ? results.reduce((sum, result) => sum + getPercentage(result), 0) / results.length
    : 0;

  const teacherComment = getTeacherComment(averagePercentage);
  const principalComment = getPrincipalComment(averagePercentage);
  const attendance = {
    totalDays: attendanceRecords.length,
    present: attendanceRecords.filter(record => record.status.toLowerCase() === "present").length,
    absent: attendanceRecords.filter(record => record.status.toLowerCase() === "absent").length,
  };

  if (resultsBlocked) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <div className="max-w-xl w-full bg-card border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Results Locked</h3>
          <p className="text-muted-foreground mb-4">
            This student portal is currently restricted because the account has an outstanding balance of ${outstandingBalance.toFixed(2)}. Results and report cards are hidden until the balance is cleared.
          </p>
          <p className="text-sm text-muted-foreground">Please contact the school accounts office to clear the balance.</p>
        </div>
      </div>
    );
  }

  if (isLoadingMarks || isLoadingExams) {
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
      <div className="report-card-controls flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Report Card</h2>
          <p className="text-muted-foreground text-sm">View your academic performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={reportCategory}
            onChange={(event) => {
              const nextCategory = event.target.value as "current" | "past";
              setReportCategory(nextCategory);
              const nextExam = availableExams.find(exam => {
                const isCurrent = `${exam.year.trim()}-${exam.term.trim().toLowerCase()}` === currentPeriod;
                return nextCategory === "current" ? isCurrent : !isCurrent;
              });
              setSelectedExamId(nextExam?.id ?? null);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            aria-label="Report card term category"
          >
            <option value="current">Current Term</option>
            <option value="past">Past Report Cards</option>
          </select>
          <select
            value={selectedExam?.id ?? ""}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            disabled={visibleExams.length === 0}
          >
            {visibleExams.length === 0 && <option value="">No exam results</option>}
            {visibleExams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.name} · {exam.term} {exam.year}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
            Share on WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!selectedExam || results.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="gold" size="sm" onClick={handleDownloadPdf} disabled={isExporting || !selectedExam || results.length === 0}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <div
        id="report-card-content"
        ref={reportCardRef}
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-[#ead9e3] bg-[#fffafd] text-[#172044] shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      >
        <header className="text-white">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-[#10244f] via-[#34245f] to-[#b31669] px-5 py-4 sm:flex-row sm:items-center">
            <img
              src={logo}
              alt="Able God College crest"
              className="h-16 w-16 shrink-0 rounded-xl bg-white p-1.5 object-contain"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-serif text-2xl font-bold tracking-wide">Able God College</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-white/75">B&apos;Ezrat Hashem</p>
            </div>
            <div className="text-center text-[10px] leading-relaxed text-white/90 sm:text-right">
              <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65">Contact</p>
              <p>{schoolContact.phones.map((phone) => phone.label).join(" / ")}</p>
              <p>{schoolContact.address}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#ed3c91] via-[#d82179] to-[#f0c86c]" />
        </header>

        <div className="px-4 pb-4 pt-3 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-serif text-base font-bold tracking-wide text-[#14234f] sm:text-lg">
              STUDENT ONLINE REPORT CARD
            </h1>
            <p className="text-[10px] text-[#747386]">
              Issued {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(105px,0.43fr)_minmax(82px,0.32fr)]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-[#eadde5] bg-white p-3">
              <div className="col-span-2 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8490]">Learner</p>
                <p className="truncate font-serif text-base font-bold text-[#17244c]">{profile?.name || "Student"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8490]">Class</p>
                <p className="truncate text-xs font-semibold text-[#17244c]">{profile?.class_name || "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8490]">Examination</p>
                <p className="truncate text-xs font-semibold text-[#17244c]">{selectedTerm}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-[#10244f] to-[#a91667] p-3 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Average</p>
              <p className="mt-0.5 font-serif text-2xl font-bold leading-none">{averagePercentage.toFixed(2)}%</p>
              <p className="mt-1 text-[9px] text-white/85">Overall grade {calculateGrade(averagePercentage).grade}</p>
            </div>

            <div className="flex flex-row items-center justify-between rounded-xl border border-[#eadde5] bg-white p-3 sm:flex-col sm:items-start sm:justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8490]">Passed</p>
              <p className="font-serif text-2xl font-bold leading-none text-[#17244c]">{countPassed()} / {results.length}</p>
              <p className="text-[9px] text-[#777484]">subjects</p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#eadde5] bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">Class position</p>
              <p className="mt-0.5 font-serif text-lg font-bold leading-tight text-[#17244c]">
                {isLoadingRanking ? "Calculating…" : formatPosition(ranking?.class_position, ranking?.class_total)}
              </p>
              <p className="text-[9px] text-[#777484]">Based on this examination</p>
            </div>
            <div className="rounded-xl border border-[#edcfdf] bg-[#fff3f8] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">
                {ranking?.level_name ? `${ranking.level_name} level position` : "Overall level position"}
              </p>
              <p className="mt-0.5 font-serif text-lg font-bold leading-tight text-[#17244c]">
                {isLoadingRanking ? "Calculating…" : formatPosition(ranking?.level_position, ranking?.level_total)}
              </p>
              <p className="text-[9px] text-[#777484]">Across sections at the same level</p>
            </div>
          </div>
          {isRankingError && (
            <p role="alert" className="mb-3 text-xs text-red-700">
              Positions could not be calculated. Please try again later.
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-[#eadde5]">
            <table className="w-full min-w-[620px] table-fixed border-collapse text-[11px]">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[22%]" />
                <col className="w-[10%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead className="bg-[#14234f] text-white">
                <tr>
                  {["Subject", "Out of", "Score", "Percentage", "Grade", "Comment"].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${index === 0 || index === 5 ? "text-left" : "text-center"}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadde5]">
                {results.map((result, index) => {
                  const percentage = getPercentage(result);
                  const gradeInfo = calculateGrade(percentage);
                  return (
                    <tr key={`${result.subject}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-[#fff3f8]"}>
                      <td className="px-2 py-1.5 font-semibold text-[#202849]">{result.subject}</td>
                      <td className="px-2 py-1.5 text-center text-[#777484]">{result.marks}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-[#202849]">{result.scored.toFixed(2)}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-[#eee8ed]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#182858] to-[#e33388]"
                              style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-right text-[10px] text-[#777484]">{percentage.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                          <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[#777484]">{gradeInfo.meaning}</td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#777484]">No records found for this term.</td>
                  </tr>
                )}
              </tbody>
              {results.length > 0 && (
                <tfoot className="border-t border-[#e9c9d9] bg-[#fdeaf3]">
                  <tr>
                    <td className="px-2 py-2 font-bold text-[#17244c]">Average</td>
                    <td className="px-2 py-2 text-center text-[#777484]">—</td>
                    <td className="px-2 py-2 text-center font-bold text-[#17244c]">{averagePercentage.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#182858] to-[#e33388]"
                            style={{ width: `${Math.min(Math.max(averagePercentage, 0), 100)}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-[10px] font-semibold text-[#17244c]">{averagePercentage.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${calculateGrade(averagePercentage).bgColor} ${calculateGrade(averagePercentage).color}`}>
                        {calculateGrade(averagePercentage).grade}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-medium text-[#777484]">{calculateGrade(averagePercentage).meaning}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#eadde5] bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">Teacher&apos;s comment</p>
              <p className="mt-1 text-[10px] italic leading-relaxed text-[#454255]">{teacherComment}</p>
            </div>
            <div className="rounded-xl border border-[#edcfdf] bg-[#fff3f8] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">Principal&apos;s overall comment</p>
              <p className="mt-1 text-[10px] italic leading-relaxed text-[#454255]">{principalComment}</p>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-[#eadde5] bg-white px-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">Attendance</p>
                <p className="mt-0.5 text-xs font-bold text-[#17244c]">{attendance.totalDays ? `${attendance.present} / ${attendance.totalDays} days` : "No attendance recorded"}</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e6e9e8]">
                  <div className="h-full rounded-full bg-[#17874f]" style={{ width: `${attendance.totalDays ? (attendance.present / attendance.totalDays) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">Absent</p>
                <p className="mt-0.5 text-xs font-bold text-[#17244c]">{attendance.absent} days</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-8 px-3">
            <div className="border-t border-[#a8a1ad] pt-1 text-[9px] uppercase tracking-[0.12em] text-[#777484]">Class teacher</div>
            <div className="border-t border-[#a8a1ad] pt-1 text-[9px] uppercase tracking-[0.12em] text-[#777484]">Principal</div>
          </div>

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[9px] text-[#898391]">
            <p>This report is electronically generated.</p>
            <p><span className="font-semibold text-[#17244c]">Able God College</span> · {schoolContact.address}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReportCardSection;
