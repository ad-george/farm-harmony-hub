import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Mail, Phone, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "owner" | "manager" | "employee";
  farm: string;
  status: "active" | "on-leave" | "inactive";
  avatar?: string;
}

const employees: Employee[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@farmflow.com",
    phone: "+1 (555) 123-4567",
    role: "owner",
    farm: "All Farms",
    status: "active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@farmflow.com",
    phone: "+1 (555) 234-5678",
    role: "manager",
    farm: "Green Valley Farm",
    status: "active",
  },
  {
    id: "3",
    name: "Mike Williams",
    email: "mike.w@farmflow.com",
    phone: "+1 (555) 345-6789",
    role: "manager",
    farm: "Sunrise Acres",
    status: "active",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@farmflow.com",
    phone: "+1 (555) 456-7890",
    role: "employee",
    farm: "Green Valley Farm",
    status: "active",
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.b@farmflow.com",
    phone: "+1 (555) 567-8901",
    role: "employee",
    farm: "Hillside Ranch",
    status: "on-leave",
  },
  {
    id: "6",
    name: "Lisa Garcia",
    email: "lisa.g@farmflow.com",
    phone: "+1 (555) 678-9012",
    role: "employee",
    farm: "Sunrise Acres",
    status: "active",
  },
];

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.farm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Employees"
      subtitle="Manage your farm workers and staff"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employees Table */}
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
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Farm</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => {
              const role = roleConfig[employee.role];
              const status = statusConfig[employee.status];
              const initials = employee.name
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <TableRow key={employee.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{employee.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={role.className}>{role.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.farm}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
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
    </DashboardLayout>
  );
}
