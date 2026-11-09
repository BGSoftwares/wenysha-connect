import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { useTableNavigation } from "@/hooks/useTableNavigation";
import { useState } from "react";
import { calculateGrade, calculatePercentageFromScore, getGradeColorClasses } from "@/lib/grading";
import { useGrades, useStudentPerformanceSummary, useStudentProfile } from "@/lib/hooks";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, Award, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { toCsv } from "@/lib/csv";
import { getErrorMessage } from "@/lib/api";

export interface ResultsSectionProps {
  studentId: number;
}

const ResultsSection = ({ studentId }: ResultsSectionProps) => {
  const [selectedTerm, setSelectedTerm] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: profile } = useStudentProfile();
  const {
    data: grades = [],
    isLoading,
    isFetching,
    error: gradesError,
    dataUpdatedAt,
    refetch: refreshGrades,
  } = useGrades({ student: studentId }, 5000);

  const filteredResults = grades.filter(result =>
    result.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.assessment_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const historyNavigation = useTableNavigation(filteredResults, searchQuery);
  const termLabel = (grade: typeof grades[number]) => `${grade.assessment_term_name} ${grade.academic_year_name}`.trim();
  const currentTermGrades = selectedTerm === "All" ? grades : grades.filter((grade) => termLabel(grade) === selectedTerm);
  const selectedTermId = selectedTerm === "All" ? undefined : currentTermGrades[0]?.assessment_term_id;
  const {
    data: performanceSummary,
    isFetching: isFetchingSummary,
    error: summaryError,
    dataUpdatedAt: summaryUpdatedAt,
    refetch: refreshSummary,
  } = useStudentPerformanceSummary(studentId, selectedTermId, 5000);
  const currentNavigation = useTableNavigation(currentTermGrades, selectedTerm);

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  const termOptions = Array.from(new Set(grades.map((grade) => termLabel(grade)))).filter(Boolean).sort().reverse();

  const percentageFor = (grade: typeof grades[number]) =>
    calculatePercentageFromScore(grade.score, grade.assessment_total_marks);
  const averageScore = currentTermGrades.length
    ? currentTermGrades.reduce((sum, grade) => sum + percentageFor(grade), 0) / currentTermGrades.length
    : null;
  const bestSubject = [...currentTermGrades].sort((a, b) => percentageFor(b) - percentageFor(a))[0]?.subject_name ?? "N/A";
  const rank = performanceSummary?.class_position;
  const totalStudents = performanceSummary?.class_total;
  const improvement = performanceSummary?.improvement;
  const updatedAt = Math.max(dataUpdatedAt, summaryUpdatedAt);
  const refreshResults = () => {
    void Promise.all([refreshGrades(), refreshSummary()]);
  };
  const formatPosition = (position: number | null | undefined) => {
    if (position == null) return "Not ranked";
    const suffix = position % 100 >= 11 && position % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" }[position % 10] || "th");
    return `${position}${suffix}`;
  };
  const improvementLabel = improvement === null || improvement === undefined
    ? "Not enough term history"
    : `${improvement > 0 ? "+" : ""}${improvement.toFixed(1)} pp`;

  const exportResults = () => {
    if (filteredResults.length === 0) {
      toast.info("There are no results to export.");
      return;
    }

    const csv = toCsv(
      ["Subject", "Assessment", "Score (%)", "Grade", "Remarks", "Date"],
      filteredResults.map((result) => [
        result.subject_name,
        result.assessment_name,
        percentageFor(result).toFixed(1),
        calculateGrade(percentageFor(result)).grade,
        result.remarks || "",
        new Date(result.date_recorded).toLocaleDateString(),
      ]),
    );
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `able-god-results-${studentId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">My Results</h2>
          <p className="text-muted-foreground">View your examination results and performance trends. Results refresh automatically every 5 seconds while this page is open.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {updatedAt > 0 && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {isFetching || isFetchingSummary ? "Updating results…" : `Updated ${new Date(updatedAt).toLocaleTimeString()}`}
            </span>
          )}
          <Button variant="outline" onClick={refreshResults} disabled={isFetching || isFetchingSummary}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching || isFetchingSummary ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>
      {gradesError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Could not refresh results: {getErrorMessage(gradesError)}
          {grades.length > 0 ? " Showing the most recently loaded results; try Refresh again." : " Try Refresh again."}
        </p>
      )}
      {summaryError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Could not load class rank and improvement: {getErrorMessage(summaryError)}
        </p>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground">{averageScore === null ? "N/A" : `${averageScore.toFixed(1)}%`}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Rank</p>
                <p className="text-2xl font-bold text-foreground">
                  {performanceSummary ? formatPosition(rank) : "Calculating…"}
                  <span className="text-sm text-muted-foreground">{totalStudents ? ` / ${totalStudents}` : ""}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedTerm === "All" ? "Across all recorded results" : selectedTerm}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Subject</p>
                <p className="text-lg font-bold text-foreground">{bestSubject}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Improvement vs previous term</p>
                <p className={`text-2xl font-bold ${improvement === null || improvement === undefined ? "text-muted-foreground" : improvement >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {improvementLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {performanceSummary?.improvement_period
                    ? `${performanceSummary.improvement_period}${performanceSummary.previous_period ? ` vs ${performanceSummary.previous_period}` : " · no earlier term"}`
                    : "Based on the latest term with recorded marks"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Current Term</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Assessment results</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTerm === "All" ? "All assessment periods" : selectedTerm}
                  </p>
                </div>
                <select
                  aria-label="Filter results by term"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectedTerm}
                  onChange={(event) => setSelectedTerm(event.target.value)}
                >
                  <option value="All">All terms</option>
                  {termOptions.map((term) => <option key={term} value={term}>{term}</option>)}
                </select>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {averageScore === null ? "No results" : `Grade ${calculateGrade(averageScore).grade}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DashboardTable navigation={currentNavigation} label="Assessment results">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Score</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Grade</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assessment</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Teacher Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentNavigation.visibleRows.map((subject, index) => {
                      const percentage = percentageFor(subject);
                      const gradeInfo = calculateGrade(percentage);

                      return (
                        <tr key={index} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 font-medium text-foreground">{subject.subject_name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-foreground">{percentage.toFixed(1)}%</span>
                            <span className="text-xs text-muted-foreground ml-1">({subject.score} / {subject.assessment_total_marks})</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`${getGradeColorClasses(gradeInfo.grade).color} ${getGradeColorClasses(gradeInfo.grade).bgColor}`}>{gradeInfo.grade}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{subject.assessment_name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{subject.remarks || "No comment"}</td>
                        </tr>
                      );
                    })}
                    {currentTermGrades.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">No results for the current term.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </DashboardTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid min-w-0 gap-4">
            <input aria-label="Search results history" placeholder="Search subject or assessment…" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm" />
            <DashboardTable navigation={historyNavigation} label="Results history">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-secondary/20">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject / Assessment</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Remarks</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyNavigation.visibleRows.map((result, idx) => {
                    const percentage = percentageFor(result);
                    const gradeInfo = calculateGrade(percentage);
                    return (
                      <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">{result.subject_name}</div>
                          <div className="text-xs text-muted-foreground">{result.assessment_name}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-bold text-foreground">{percentage.toFixed(1)}%</div>
                          <div className="text-[10px] text-muted-foreground">{result.score} / {result.assessment_total_marks}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                            Grade {gradeInfo.grade}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-muted-foreground italic line-clamp-1">
                            {result.remarks || "No remarks provided"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-muted-foreground">
                          {new Date(result.date_recorded).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">No results found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DashboardTable>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsSection;
