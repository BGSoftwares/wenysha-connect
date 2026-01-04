import { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserPlus, 
  Shield, 
  UserCheck, 
  UserX,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  createdAt: string;
  avatar?: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
}

const mockUsers: User[] = [
  { id: 1, name: "John Moyo", email: "john@wenyasha.edu.zw", role: "Student", status: "Active", createdAt: "2024-01-15" },
  { id: 2, name: "Mrs. Grace Moyo", email: "grace@wenyasha.edu.zw", role: "Teacher", status: "Active", createdAt: "2023-08-01" },
  { id: 3, name: "Admin User", email: "admin@wenyasha.edu.zw", role: "Admin", status: "Active", createdAt: "2023-01-01" },
  { id: 4, name: "Sarah Ndlovu", email: "sarah@wenyasha.edu.zw", role: "Student", status: "Inactive", createdAt: "2024-02-10" },
  { id: 5, name: "Mr. David Ncube", email: "david@wenyasha.edu.zw", role: "Teacher", status: "Active", createdAt: "2023-06-15" },
];

const mockRoles: Role[] = [
  { id: 1, name: "Admin", description: "Full system access with all permissions", permissions: ["all"], usersCount: 2 },
  { id: 2, name: "Teacher", description: "Can manage classes, grades, and attendance", permissions: ["classes", "grades", "attendance"], usersCount: 48 },
  { id: 3, name: "Student", description: "Can view own grades, timetable, and assignments", permissions: ["view-grades", "view-timetable"], usersCount: 1245 },
  { id: 4, name: "Parent", description: "Can view child's performance and fees", permissions: ["view-child"], usersCount: 856 },
];

interface UsersRolesSectionProps {
  activeSubNav: string;
}

const UsersRolesSection = ({ activeSubNav }: UsersRolesSectionProps) => {
  const [users, setUsers] = useState(mockUsers);
  const [roles, setRoles] = useState(mockRoles);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Form states
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserRole("");
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!userName || !userEmail || !userRole) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: userName, email: userEmail, role: userRole } : u));
      toast({ title: "Success", description: "User updated successfully" });
    } else {
      const newUser: User = {
        id: users.length + 1,
        name: userName,
        email: userEmail,
        role: userRole,
        status: "Active",
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
      toast({ title: "Success", description: "User added successfully" });
    }
    setShowUserModal(false);
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
    ));
    toast({ title: "Status Updated", description: "User status has been updated" });
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: "Deleted", description: "User has been removed" });
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (!roleName || !roleDescription) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, name: roleName, description: roleDescription } : r));
      toast({ title: "Success", description: "Role updated successfully" });
    } else {
      const newRole: Role = {
        id: roles.length + 1,
        name: roleName,
        description: roleDescription,
        permissions: [],
        usersCount: 0
      };
      setRoles([...roles, newRole]);
      toast({ title: "Success", description: "Role created successfully" });
    }
    setShowRoleModal(false);
  };

  if (activeSubNav === "roles") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Role Management</h2>
            <p className="text-sm text-muted-foreground">Create and manage user roles</p>
          </div>
          <Button onClick={handleAddRole} variant="gold">
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditRole(role)}
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-foreground">{role.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">{role.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">{role.usersCount} users</span>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Eye className="h-3 w-3" /> View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Role Modal */}
        <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
              <DialogDescription>
                {editingRole ? "Update role information" : "Add a new role to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input 
                  id="roleName" 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)} 
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="roleDesc">Description</Label>
                <Input 
                  id="roleDesc" 
                  value={roleDescription} 
                  onChange={(e) => setRoleDescription(e.target.value)} 
                  placeholder="Enter role description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
              <Button variant="gold" onClick={handleSaveRole}>
                {editingRole ? "Update Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage all system users</p>
        </div>
        <Button onClick={handleAddUser} variant="gold">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.status === "Active").length}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <UserX className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.status === "Inactive").length}</p>
            <p className="text-xs text-muted-foreground">Inactive Users</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{roles.length}</p>
            <p className="text-xs text-muted-foreground">Total Roles</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Active</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === "Admin" ? "bg-primary/10 text-primary" :
                      user.role === "Teacher" ? "bg-accent/20 text-accent-foreground" :
                      "bg-secondary text-secondary-foreground"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Switch 
                      checked={user.status === "Active"}
                      onCheckedChange={() => handleToggleStatus(user.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="p-2 hover:bg-secondary rounded-lg"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-secondary rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user information" : "Add a new user to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="userName">Full Name</Label>
              <Input 
                id="userName" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="userEmail">Email</Label>
              <Input 
                id="userEmail" 
                type="email"
                value={userEmail} 
                onChange={(e) => setUserEmail(e.target.value)} 
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="userRole">Role</Label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleSaveUser}>
              {editingUser ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersRolesSection;
