import { useState } from "react";
import { calculateGrade, getGradeColorClasses } from "@/lib/grading";
import { useGrades, useStudentProfile } from "@/lib/hooks";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, TrendingDown, Minus, Award } from "lucide-react";

export interface ResultsSectionProps {
  studentId: number;
}

const ResultsSection = ({ studentId }: ResultsSectionProps) => {
  const [selectedTerm, setSelectedTerm] = useState("Term 1 2024");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: profile } = useStudentProfile();
  const { data: grades = [], isLoading } = useGrades({ student: studentId });

  const filteredResults = grades.filter(result =>
    result.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.assessment_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  // Placeholder for summary calculations based on `grades`
  const currentTermGrades = grades.filter(g => g.term_name === "Term 1 2024"); // Example filtering
  const averageScore = currentTermGrades.length > 0
    ? (currentTermGrades.reduce((sum, g) => sum + g.score, 0) / currentTermGrades.length).toFixed(1)
    : "N/A";
  const bestSubject = currentTermGrades.reduce((best, current) => (best.score > current.score ? best : current), { score: -1, subject_name: "N/A" }).subject_name;
  // Rank and totalStudents would typically come from a separate API or be calculated with more context
  const rank = "N/A";
  const totalStudents = "N/A";
  const improvement = "N/A"; // Requires previous term data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">My Results</h2>
          <p className="text-muted-foreground">View your examination results and performance trends</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

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
                <p className="text-2xl font-bold text-foreground">{averageScore}%</p>
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
                <p className="text-2xl font-bold text-foreground">{rank}<span className="text-sm text-muted-foreground">/{totalStudents}</span></p>
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
                <p className="text-sm text-muted-foreground">Improvement</p>
                <p className="text-2xl font-bold text-green-600">{improvement}</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mid-Term Examinations</CardTitle> {/* Placeholder */}
                  <p className="text-sm text-muted-foreground mt-1">Term 1 2024</p> {/* Placeholder */}
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Grade A- {/* Placeholder */}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Score</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Grade</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Trend</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Teacher Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* This section needs to be updated to use `currentTermGrades` or similar filtered data */}
                    {currentTermGrades.map((subject, index) => {
                      const gradeInfo = calculateGrade(subject.score);
                      // Assuming 'previousScore' is available or can be fetched/calculated
                      const previousScore = 0; // Placeholder
                      const trendIcon = subject.score > previousScore ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                        subject.score < previousScore ? <TrendingDown className="h-4 w-4 text-red-500" /> :
                          <Minus className="h-4 w-4 text-muted-foreground" />;
                      const scoreDifference = subject.score - previousScore;

                      return (
                        <tr key={index} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 font-medium text-foreground">{subject.subject_name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-foreground">{subject.score}%</span>
                            <span className="text-xs text-muted-foreground ml-1">({previousScore}%)</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={getGradeColorClasses(gradeInfo.grade)}>{gradeInfo.grade}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {trendIcon}
                              <span className={`text-xs ${scoreDifference > 0 ? 'text-green-600' : scoreDifference < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {scoreDifference > 0 ? '+' : ''}{scoreDifference}
                              </span>
                            </div>
                          </td>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid gap-4">
            <div className="overflow-x-auto">
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
                  {filteredResults.map((result, idx) => {
                    const gradeInfo = calculateGrade(result.score);
                    return (
                      <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">{result.subject_name}</div>
                          <div className="text-xs text-muted-foreground">{result.assessment_name}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-bold text-foreground">{result.score}%</div>
                          <div className="text-[10px] text-muted-foreground">out of 100</div>
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsSection;
