import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserPlus, 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Download,
  Upload,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdmissionSection = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const applications = [
    { id: "APP-2024-001", name: "John Mutasa", grade: "Form 1", date: "Feb 1, 2024", status: "pending", docs: true },
    { id: "APP-2024-002", name: "Sarah Chikonye", grade: "Form 3", date: "Jan 30, 2024", status: "approved", docs: true },
    { id: "APP-2024-003", name: "Peter Dube", grade: "Form 1", date: "Jan 28, 2024", status: "rejected", docs: false },
    { id: "APP-2024-004", name: "Mary Nyathi", grade: "Form 2", date: "Jan 25, 2024", status: "approved", docs: true },
    { id: "APP-2024-005", name: "David Moyo", grade: "Form 1", date: "Jan 22, 2024", status: "pending", docs: true },
  ];

  const stats = {
    total: 45,
    approved: 28,
    pending: 12,
    rejected: 5
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const handleApprove = (id: string) => {
    toast({
      title: "Application Approved",
      description: `Application ${id} has been approved. Enrollment email sent.`,
    });
  };

  const handleReject = (id: string) => {
    toast({
      title: "Application Rejected",
      description: `Application ${id} has been rejected.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Student Admissions</h2>
          <p className="text-muted-foreground">Manage student applications and enrollment</p>
        </div>
        <Button variant="gold">
          <UserPlus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="new">New Application</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Application Queue</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Application ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applicant</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Grade</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Documents</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4 font-medium text-foreground">{app.id}</td>
                        <td className="py-3 px-4 text-foreground">{app.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{app.grade}</td>
                        <td className="py-3 px-4 text-muted-foreground">{app.date}</td>
                        <td className="py-3 px-4">
                          {app.docs ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-700">Missing</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {app.status === "pending" && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleApprove(app.id)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleReject(app.id)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                New Student Application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input placeholder="Enter last name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grade Applying For *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="form1">Form 1</SelectItem>
                      <SelectItem value="form2">Form 2</SelectItem>
                      <SelectItem value="form3">Form 3</SelectItem>
                      <SelectItem value="form4">Form 4</SelectItem>
                      <SelectItem value="form5">Form 5</SelectItem>
                      <SelectItem value="form6">Form 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent/Guardian Name *</Label>
                  <Input placeholder="Enter guardian name" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input type="tel" placeholder="+263 77 XXX XXXX" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="guardian@email.com" />
              </div>

              <div className="space-y-2">
                <Label>Previous School</Label>
                <Input placeholder="Name of previous school" />
              </div>

              <div className="space-y-2">
                <Label>Upload Documents</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Birth certificate, previous report cards, ID copies
                  </p>
                  <Button variant="outline" className="mt-4">
                    Browse Files
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="gold">Submit Application</Button>
                <Button variant="outline">Save as Draft</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdmissionSection;
