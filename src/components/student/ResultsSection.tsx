import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, TrendingDown, Minus, Award } from "lucide-react";

const ResultsSection = () => {
  const examResults = {
    current: {
      term: "Term 1 2024",
      examType: "Mid-Term Examinations",
      subjects: [
        { name: "Mathematics", score: 78, grade: "B+", previousScore: 72, comment: "Good improvement in algebra" },
        { name: "English Language", score: 85, grade: "A", previousScore: 88, comment: "Excellent essay writing" },
        { name: "Physics", score: 72, grade: "B", previousScore: 70, comment: "Needs more practice on mechanics" },
        { name: "Chemistry", score: 81, grade: "A-", previousScore: 75, comment: "Strong understanding of organic chemistry" },
        { name: "Biology", score: 88, grade: "A", previousScore: 85, comment: "Excellent practical work" },
        { name: "Geography", score: 76, grade: "B+", previousScore: 78, comment: "Good map reading skills" },
        { name: "History", score: 82, grade: "A-", previousScore: 80, comment: "Well-researched essays" },
        { name: "Computer Science", score: 90, grade: "A+", previousScore: 88, comment: "Outstanding programming skills" },
      ],
      average: 81.5,
      rank: 5,
      totalStudents: 45
    },
    previous: [
      { term: "Term 3 2023", average: 79.2, rank: 7 },
      { term: "Term 2 2023", average: 77.8, rank: 8 },
      { term: "Term 1 2023", average: 75.5, rank: 12 },
    ]
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-500/20 text-green-700 border-green-500/30";
    if (grade.startsWith("B")) return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    if (grade.startsWith("C")) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    if (grade.startsWith("D")) return "bg-orange-500/20 text-orange-700 border-orange-500/30";
    return "bg-red-500/20 text-red-700 border-red-500/30";
  };

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

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
                <p className="text-2xl font-bold text-foreground">{examResults.current.average}%</p>
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
                <p className="text-2xl font-bold text-foreground">{examResults.current.rank}<span className="text-sm text-muted-foreground">/{examResults.current.totalStudents}</span></p>
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
                <p className="text-lg font-bold text-foreground">Computer Science</p>
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
                <p className="text-2xl font-bold text-green-600">+2.3%</p>
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
                  <CardTitle>{examResults.current.examType}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{examResults.current.term}</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Grade A-
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
                    {examResults.current.subjects.map((subject, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4 font-medium text-foreground">{subject.name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-foreground">{subject.score}%</span>
                          <span className="text-xs text-muted-foreground ml-1">({subject.previousScore}%)</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getTrend(subject.score, subject.previousScore)}
                            <span className={`text-xs ${subject.score > subject.previousScore ? 'text-green-600' : subject.score < subject.previousScore ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {subject.score > subject.previousScore ? '+' : ''}{subject.score - subject.previousScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{subject.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid gap-4">
            {examResults.previous.map((term, index) => (
              <Card key={index}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{term.term}</p>
                      <p className="text-sm text-muted-foreground">Final Examinations</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className="font-semibold text-foreground">{term.average}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Rank</p>
                        <p className="font-semibold text-foreground">#{term.rank}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsSection;
