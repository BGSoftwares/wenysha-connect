import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, User, Mail, Calendar, Shield, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PendingUser {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "teacher" | "parent" | "accounts";
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  additionalInfo?: {
    class?: string;
    department?: string;
    studentName?: string;
  };
}

// Mock data
const mockPendingUsers: PendingUser[] = [
  {
    id: "1",
    fullName: "Tendai Chikwanda",
    email: "tendai.c@email.com",
    role: "student",
    requestedAt: "2024-01-05T10:30:00",
    status: "pending",
    additionalInfo: { class: "Form 4A" }
  },
  {
    id: "2",
    fullName: "Margaret Dube",
    email: "m.dube@email.com",
    role: "teacher",
    requestedAt: "2024-01-04T14:20:00",
    status: "pending",
    additionalInfo: { department: "Sciences" }
  },
  {
    id: "3",
    fullName: "Robert Moyo",
    email: "r.moyo@email.com",
    role: "parent",
    requestedAt: "2024-01-04T09:15:00",
    status: "pending",
    additionalInfo: { studentName: "Peter Moyo" }
  },
  {
    id: "4",
    fullName: "Susan Banda",
    email: "s.banda@email.com",
    role: "accounts",
    requestedAt: "2024-01-03T16:45:00",
    status: "pending"
  },
  {
    id: "5",
    fullName: "James Ncube",
    email: "j.ncube@email.com",
    role: "teacher",
    requestedAt: "2024-01-02T11:30:00",
    status: "pending",
    additionalInfo: { department: "Mathematics" }
  },
];

const PendingApprovalsSection = () => {
  const [users, setUsers] = useState<PendingUser[]>(mockPendingUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: "approve" | "reject"; user: PendingUser } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<PendingUser | null>(null);

  const getRoleBadge = (role: PendingUser["role"]) => {
    const styles = {
      student: "bg-blue-100 text-blue-700",
      teacher: "bg-green-100 text-green-700",
      parent: "bg-amber-100 text-amber-700",
      accounts: "bg-purple-100 text-purple-700"
    };
    const labels = {
      student: "Student",
      teacher: "Teacher",
      parent: "Parent/Guardian",
      accounts: "Accounts Officer"
    };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[role]}`}>{labels[role]}</span>;
  };

  const handleApprove = (user: PendingUser) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.success(`${user.fullName} has been approved and activated`);
    setShowConfirmModal(null);
  };

  const handleReject = (user: PendingUser) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.error(`${user.fullName}'s registration has been rejected`);
    setShowConfirmModal(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const pendingCount = users.filter(u => u.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Pending User Approvals</h2>
          <p className="text-muted-foreground text-sm">Review and approve new user registrations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-800">You have {pendingCount} pending approval{pendingCount > 1 ? "s" : ""}</p>
            <p className="text-sm text-amber-700">New users cannot access the system until their accounts are approved.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="accounts">Accounts Officers</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No Pending Approvals</h3>
          <p className="text-muted-foreground text-sm">All user registrations have been processed.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Requested</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Additional Info</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.requestedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.requestedAt).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      {user.additionalInfo?.class && `Class: ${user.additionalInfo.class}`}
                      {user.additionalInfo?.department && `Dept: ${user.additionalInfo.department}`}
                      {user.additionalInfo?.studentName && `Student: ${user.additionalInfo.studentName}`}
                      {!user.additionalInfo && "-"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDetailsModal(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setShowConfirmModal({ type: "approve", user })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setShowConfirmModal({ type: "reject", user })}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmModal(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className={`h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              showConfirmModal.type === "approve" ? "bg-green-100" : "bg-red-100"
            }`}>
              {showConfirmModal.type === "approve" 
                ? <CheckCircle className="h-8 w-8 text-green-600" />
                : <XCircle className="h-8 w-8 text-red-600" />
              }
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground text-center mb-2">
              {showConfirmModal.type === "approve" ? "Approve User" : "Reject User"}
            </h3>
            <p className="text-muted-foreground text-sm text-center mb-6">
              {showConfirmModal.type === "approve"
                ? `Are you sure you want to approve ${showConfirmModal.user.fullName}? They will be able to access the system immediately.`
                : `Are you sure you want to reject ${showConfirmModal.user.fullName}'s registration? This action will be logged.`
              }
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirmModal(null)} className="flex-1">Cancel</Button>
              <Button
                variant={showConfirmModal.type === "approve" ? "default" : "destructive"}
                onClick={() => showConfirmModal.type === "approve" 
                  ? handleApprove(showConfirmModal.user) 
                  : handleReject(showConfirmModal.user)
                }
                className="flex-1"
              >
                {showConfirmModal.type === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{showDetailsModal.fullName}</h3>
                {getRoleBadge(showDetailsModal.role)}
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{showDetailsModal.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Registration Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(showDetailsModal.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Requested Role</p>
                  <p className="text-sm font-medium text-foreground capitalize">{showDetailsModal.role}</p>
                </div>
              </div>
              {showDetailsModal.additionalInfo && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Additional Information</p>
                  {showDetailsModal.additionalInfo.class && (
                    <p className="text-sm text-foreground">Class: {showDetailsModal.additionalInfo.class}</p>
                  )}
                  {showDetailsModal.additionalInfo.department && (
                    <p className="text-sm text-foreground">Department: {showDetailsModal.additionalInfo.department}</p>
                  )}
                  {showDetailsModal.additionalInfo.studentName && (
                    <p className="text-sm text-foreground">Student: {showDetailsModal.additionalInfo.studentName}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDetailsModal(null)} className="flex-1">Close</Button>
              <Button
                variant="default"
                onClick={() => {
                  handleApprove(showDetailsModal);
                  setShowDetailsModal(null);
                }}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsSection;
