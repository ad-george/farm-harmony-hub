import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Mail, Phone, MoreHorizontal, Edit, Trash2, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppData, Employee } from "@/contexts/AppDataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const roleConfig = {
  owner: { label: "Owner", className: "bg-primary/10 text-primary" },
  manager: { label: "Manager", className: "bg-accent/20 text-accent-foreground" },
  employee: { label: "Employee", className: "bg-info/10 text-info" },
};

const statusConfig = {
  active: { label: "Active", className: "bg-success/10 text-success" },
  "on-leave": { label: "On Leave", className: "bg-warning/10 text-warning" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
};

export default function Employees() {
  const navigate = useNavigate();
  const { employees, farms, employeesLoading, refetchEmployees } = useAppData();
  const { isOwner, isManager, canManageRoles } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [roleForm, setRoleForm] = useState({ role: "", farmId: "" });

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
      // Update role in user_roles
      await supabase
        .from("user_roles")
        .update({ role: roleForm.role as any })
        .eq("user_id", selectedEmployee.user_id);

      // If assigning to a farm, create/update farm_assignment
      if (roleForm.farmId) {
        await supabase
          .from("farm_assignments")
          .upsert({
            user_id: selectedEmployee.user_id,
            farm_id: roleForm.farmId,
            role: roleForm.role,
          }, { onConflict: "farm_id,user_id" });
      }

      toast.success(`Role updated for ${selectedEmployee.name}`);
      setIsRoleDialogOpen(false);
      await refetchEmployees();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleSendMessage = (employeeName: string) => {
    navigate("/messages");
  };

  if (employeesLoading) {
    return (
      <DashboardLayout title="Employees" subtitle="Manage your farm workers and staff">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
        {(isOwner || isManager) && (
          <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Invite Employee
          </Button>
        )}
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No team members yet. Users will appear here once they sign up.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-card shadow-card overflow-hidden"
        >
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
                const role = roleConfig[employee.role];
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
                    <TableCell>
                      <Badge className={role.className}>{role.label}</Badge>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => handleSendMessage(employee.name)}>
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
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assign to Farm</Label>
              <Select value={roleForm.farmId} onValueChange={(v) => setRoleForm((p) => ({ ...p, farmId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>
                  {farms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Employee Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Invite a New Employee</DialogTitle>
            <DialogDescription>
              Share the signup link below with the person you want to invite. Once they create an account, they'll appear here automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label>Signup Link</Label>
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}/auth`} className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/auth`);
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The new employee should sign up using this link. After signup, you can assign them a role and farm from this page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
