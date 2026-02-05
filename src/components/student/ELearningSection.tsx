import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  Search, 
  Clock, 
  CheckCircle,
  Play,
  File,
  Upload,
  Calendar
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ELearningSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const courses = [
    {
      id: 1,
      subject: "Mathematics",
      teacher: "Mr. Moyo",
      progress: 75,
      materials: 12,
      videos: 8,
      lastAccessed: "2 hours ago"
    },
    {
      id: 2,
      subject: "Physics",
      teacher: "Mrs. Chikonye",
      progress: 60,
      materials: 10,
      videos: 6,
      lastAccessed: "Yesterday"
    },
    {
      id: 3,
      subject: "Chemistry",
      teacher: "Dr. Nyathi",
      progress: 85,
      materials: 15,
      videos: 10,
      lastAccessed: "3 days ago"
    },
    {
      id: 4,
      subject: "English Language",
      teacher: "Ms. Dube",
      progress: 90,
      materials: 8,
      videos: 4,
      lastAccessed: "1 hour ago"
    },
  ];

  const recentMaterials = [
    { id: 1, title: "Quadratic Equations Notes", subject: "Mathematics", type: "PDF", size: "2.4 MB", date: "Feb 1, 2024" },
    { id: 2, title: "Newton's Laws of Motion", subject: "Physics", type: "Video", duration: "25 min", date: "Jan 30, 2024" },
    { id: 3, title: "Organic Chemistry Chapter 5", subject: "Chemistry", type: "PDF", size: "3.1 MB", date: "Jan 28, 2024" },
    { id: 4, title: "Essay Writing Techniques", subject: "English", type: "Video", duration: "18 min", date: "Jan 27, 2024" },
    { id: 5, title: "Past Paper 2023 Solutions", subject: "Mathematics", type: "PDF", size: "1.8 MB", date: "Jan 25, 2024" },
  ];

  const assignments = [
    { id: 1, title: "Algebra Assignment 3", subject: "Mathematics", dueDate: "Feb 10, 2024", status: "pending", submitted: false },
    { id: 2, title: "Physics Lab Report", subject: "Physics", dueDate: "Feb 8, 2024", status: "pending", submitted: false },
    { id: 3, title: "Chemistry Worksheet", subject: "Chemistry", dueDate: "Feb 5, 2024", status: "submitted", submitted: true },
    { id: 4, title: "Essay: Climate Change", subject: "English", dueDate: "Feb 3, 2024", status: "graded", submitted: true, grade: "A-" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "submitted": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "graded": return "bg-green-500/20 text-green-700 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">E-Learning</h2>
          <p className="text-muted-foreground">Access study materials, videos, and submit assignments</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{course.subject}</h3>
                      <p className="text-sm text-muted-foreground">{course.teacher}</p>
                    </div>
                    <Badge variant="outline">{course.progress}% Complete</Badge>
                  </div>
                  
                  <Progress value={course.progress} className="h-2 mb-4" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {course.materials} files
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        {course.videos} videos
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {course.lastAccessed}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${material.type === "Video" ? "bg-red-500/10" : "bg-blue-500/10"}`}>
                        {material.type === "Video" ? (
                          <Play className="h-5 w-5 text-red-600" />
                        ) : (
                          <File className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{material.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {material.subject} • {material.type === "Video" ? material.duration : material.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{material.date}</span>
                      <Button variant="outline" size="sm">
                        {material.type === "Video" ? (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Watch
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${assignment.submitted ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
                        {assignment.submitted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Upload className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status === "graded" ? `Graded: ${assignment.grade}` : assignment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Due: {assignment.dueDate}
                        </p>
                      </div>
                      {!assignment.submitted && (
                        <Button variant="gold" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ELearningSection;
