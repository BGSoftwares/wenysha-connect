import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowUp, 
  ArrowDown, 
  Users, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PromotionSection = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("form3a");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const students = [
    { id: "STU001", name: "Tatenda Moyo", average: 78, attendance: 95, status: "eligible", recommendation: "promote" },
    { id: "STU002", name: "Rudo Chikonye", average: 82, attendance: 92, status: "eligible", recommendation: "promote" },
    { id: "STU003", name: "Farai Nyathi", average: 45, attendance: 88, status: "review", recommendation: "repeat" },
    { id: "STU004", name: "Tendai Dube", average: 68, attendance: 78, status: "eligible", recommendation: "promote" },
    { id: "STU005", name: "Chipo Mutasa", average: 52, attendance: 90, status: "review", recommendation: "conditional" },
    { id: "STU006", name: "David Makoni", average: 88, attendance: 98, status: "eligible", recommendation: "promote" },
    { id: "STU007", name: "Grace Sibanda", average: 72, attendance: 85, status: "eligible", recommendation: "promote" },
    { id: "STU008", name: "Peter Zimba", average: 38, attendance: 70, status: "ineligible", recommendation: "repeat" },
  ];

  const stats = {
    total: students.length,
    eligible: students.filter(s => s.status === "eligible").length,
    review: students.filter(s => s.status === "review").length,
    ineligible: students.filter(s => s.status === "ineligible").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "eligible":
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Eligible</Badge>;
      case "review":
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Needs Review</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Ineligible</Badge>;
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "promote":
        return <Badge variant="outline" className="text-green-700"><ArrowUp className="h-3 w-3 mr-1" />Promote</Badge>;
      case "conditional":
        return <Badge variant="outline" className="text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" />Conditional</Badge>;
      default:
        return <Badge variant="outline" className="text-red-700"><RefreshCw className="h-3 w-3 mr-1" />Repeat</Badge>;
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handlePromotion = () => {
    toast({
      title: "Promotion Successful",
      description: `${selectedStudents.length} students have been promoted to the next grade.`,
    });
    setSelectedStudents([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Student Promotion</h2>
          <p className="text-muted-foreground">Manage end-of-term student promotions and grade transitions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eligible</p>
                <p className="text-2xl font-bold text-green-600">{stats.eligible}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.review}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10">
                <ArrowDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ineligible</p>
                <p className="text-2xl font-bold text-red-600">{stats.ineligible}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Promotion List</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="form1a">Form 1A</SelectItem>
                  <SelectItem value="form1b">Form 1B</SelectItem>
                  <SelectItem value="form2a">Form 2A</SelectItem>
                  <SelectItem value="form2b">Form 2B</SelectItem>
                  <SelectItem value="form3a">Form 3A</SelectItem>
                  <SelectItem value="form3b">Form 3B</SelectItem>
                  <SelectItem value="form4a">Form 4A</SelectItem>
                  <SelectItem value="form4b">Form 4B</SelectItem>
                </SelectContent>
              </Select>
              {selectedStudents.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="gold">
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Promote Selected ({selectedStudents.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Promotion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to promote {selectedStudents.length} students to the next grade? 
                        This action will update their class records and cannot be easily undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePromotion}>Confirm Promotion</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">
                    <Checkbox 
                      checked={selectedStudents.length === students.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Average %</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Attendance %</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Recommendation</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-3 px-4">
                      <Checkbox 
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{student.id}</td>
                    <td className="py-3 px-4 text-foreground">{student.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${student.average >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {student.average}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${student.attendance >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {student.attendance}%
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(student.status)}</td>
                    <td className="py-3 px-4">{getRecommendationBadge(student.recommendation)}</td>
                    <td className="py-3 px-4 text-right">
                      <Select defaultValue={student.recommendation}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="promote">Promote</SelectItem>
                          <SelectItem value="conditional">Conditional</SelectItem>
                          <SelectItem value="repeat">Repeat</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Promotion Rules Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Promotion Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium text-green-700 mb-2">Eligible for Promotion</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Average score ≥ 50%</li>
                <li>• Attendance ≥ 80%</li>
                <li>• No disciplinary issues</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="font-medium text-yellow-700 mb-2">Conditional Promotion</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Average score 40-49%</li>
                <li>• Requires remedial classes</li>
                <li>• Parent consultation needed</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium text-red-700 mb-2">Repeat Grade</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Average score &lt; 40%</li>
                <li>• Attendance &lt; 70%</li>
                <li>• Failed core subjects</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionSection;
