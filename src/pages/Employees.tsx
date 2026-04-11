import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Phone, MoreHorizontal, Loader2, ShieldCheck, MessageSquare, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppData, Employee } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const roleConfig: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "bg-primary/10 text-primary" },
  manager: { label: "Manager", className: "bg-accent/20 text-accent-foreground" },
  senior_employee: { label: "Senior Employee", className: "bg-warning/10 text-warning" },
  employee: { label: "Employee", className: "bg-info/10 text-info" },
};

export default function Employees() {
  const navigate = useNavigate();
  const { employees, farms, employeesLoading, refetchEmployees } = useAppData();
  const { isOwner, isManager, canManageRoles, canManageEmployees } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [roleForm, setRoleForm] = useState({ role: "", farmId: "" });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "", email: "", password: "", phone: "", role: "employee", farm_id: "",
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openRoleDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setRoleForm({ role: employee.role, farmId: "" });
    setIsRoleDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedEmployee || !roleForm.role) return;
    try {
      await supabase.from("user_roles").update({ role: roleForm.role as any }).eq("user_id", selectedEmployee.user_id);
      if (roleForm.farmId) {
        await supabase.from("farm_assignments").upsert({
          user_id: selectedEmployee.user_id, farm_id: roleForm.farmId, role: roleForm.role,
        }, { onConflict: "farm_id,user_id" });
      }
      toast.success(`Role updated for ${selectedEmployee.name}`);
      setIsRoleDialogOpen(false);
      await refetchEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleAddEmployee = async () => {
    if (!addForm.full_name || !addForm.email || !addForm.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (addForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-employee", {
        body: {
          email: addForm.email,
          password: addForm.password,
          full_name: addForm.full_name,
          phone: addForm.phone,
          role: addForm.role,
          farm_id: addForm.farm_id || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${addForm.full_name} has been added successfully`);
      setIsAddDialogOpen(false);
      setAddForm({ full_name: "", email: "", password: "", phone: "", role: "employee", farm_id: "" });
      await refetchEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to add employee");
    }
    setAdding(false);
  };

  if (employeesLoading) {
    return (
      <DashboardLayout title="Employees" subtitle="Manage your farm workers and staff">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employees" subtitle="Manage your farm workers and staff">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        {canManageEmployees && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="mb-2">No team members yet.</p>
          {canManageEmployees && (
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add your first employee
            </Button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-xl bg-card shadow-card overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Employee</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Farm</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const role = roleConfig[employee.role] || roleConfig.employee;
                const initials = employee.name.split(" ").map((n) => n[0]).join("");
                return (
                  <TableRow key={employee.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.phone || "—"}</TableCell>
                    <TableCell><Badge className={role.className}>{role.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{employee.farm}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManageRoles && (
                            <DropdownMenuItem onClick={() => openRoleDialog(employee)}>
                              <ShieldCheck className="h-4 w-4 mr-2" /> Manage Role
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate("/messages")}>
                            <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Role Management Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Manage Role — {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>Update the role and farm assignment for this user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={roleForm.role} onValueChange={(v) => setRoleForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isOwner && <SelectItem value="manager">Manager</SelectItem>}
                  {(isOwner || isManager) && <SelectItem value="senior_employee">Senior Employee</SelectItem>}
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assign to Farm</Label>
              <Select value={roleForm.farmId} onValueChange={(v) => setRoleForm((p) => ({ ...p, farmId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Create an account for a new team member.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} placeholder="e.g., John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+254 700 000 000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={addForm.role} onValueChange={v => setAddForm({ ...addForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isOwner && <SelectItem value="manager">Manager</SelectItem>}
                    {isManager && <>
                      <SelectItem value="senior_employee">Senior Employee</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to Farm</Label>
                <Select value={addForm.farm_id} onValueChange={v => setAddForm({ ...addForm, farm_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee} disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
